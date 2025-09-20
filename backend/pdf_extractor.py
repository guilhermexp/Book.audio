"""Utilities for extracting structured page content from PDF files."""

from __future__ import annotations

import hashlib
import mimetypes
import os
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import fitz  # PyMuPDF
from enum import Enum


class ValidationStatus(Enum):
    """Page validation status."""
    VALID = "valid"
    WARNING = "warning"
    ERROR = "error"


class IssueSeverity(Enum):
    """Validation issue severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class ValidationIssue:
    """Represents a validation issue found in a PDF page."""
    page: int
    issue_type: str  # 'missing', 'corrupt', 'encoding', 'other'
    message: str
    severity: IssueSeverity


@dataclass
class PageValidation:
    """Validation results for the PDF document."""
    is_valid: bool
    total_pages: int
    validated_pages: int
    issues: List[ValidationIssue]


@dataclass
class PageImage:
    """Metadata about an image extracted from a PDF page."""

    id: str
    url: str
    width: Optional[int]
    height: Optional[int]
    content_type: str


@dataclass
class PageMetadata:
    """Metadata about a PDF page."""
    word_count: int
    char_count: int
    has_images: bool
    reading_time: Optional[float] = None  # in seconds


@dataclass
class PageContent:
    """Structured content extracted from a single PDF page."""

    number: int
    text: str
    images: List[PageImage]
    metadata: Optional[PageMetadata] = None
    validation_status: ValidationStatus = ValidationStatus.VALID

    @property
    def has_content(self) -> bool:
        return bool(self.text.strip() or self.images)


@dataclass
class PDFExtractionResult:
    """Result returned after processing a PDF document."""

    pages: List[PageContent]
    page_count: int
    validation: PageValidation
    metadata: Optional[Dict[str, any]] = None


class PDFAssetManager:
    """Manage temporary storage for extracted PDF assets like images."""

    def __init__(self, base_dir: Optional[Path] = None, max_items: int = 200) -> None:
        self.base_dir = base_dir or Path(os.getenv("PDF_ASSET_CACHE", Path(Path("/tmp")) / "bookaudio_pdf_assets"))
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.max_items = max_items
        self._registry: "OrderedDict[str, Dict[str, str]]" = OrderedDict()

    def _evict_if_needed(self) -> None:
        while len(self._registry) > self.max_items:
            image_id, asset = self._registry.popitem(last=False)
            try:
                Path(asset["path"]).unlink(missing_ok=True)
            except OSError:
                pass

    def register(self, image_id: str, data: bytes, extension: str, content_type: str) -> str:
        path = self.base_dir / image_id
        path.write_bytes(data)
        self._registry[image_id] = {"path": str(path), "content_type": content_type}
        # Move to end to mark as most recently used
        self._registry.move_to_end(image_id)
        self._evict_if_needed()
        return str(path)

    def get(self, image_id: str) -> Optional[Dict[str, str]]:
        asset = self._registry.get(image_id)
        if asset:
            # Keep frequently accessed assets around for longer
            self._registry.move_to_end(image_id)
        return asset


class PDFExtractor:
    """Extract text and images keeping the original pagination with validation."""

    AVERAGE_READING_SPEED = 200  # words per minute

    def __init__(self, asset_manager: Optional[PDFAssetManager] = None) -> None:
        self.asset_manager = asset_manager or PDFAssetManager()

    def _calculate_page_metadata(self, text: str, has_images: bool) -> PageMetadata:
        """Calculate metadata for a page."""
        words = text.split()
        word_count = len(words)
        char_count = len(text)
        reading_time = (word_count / self.AVERAGE_READING_SPEED) * 60 if word_count > 0 else 0

        return PageMetadata(
            word_count=word_count,
            char_count=char_count,
            has_images=has_images,
            reading_time=reading_time
        )

    def _validate_page(self, page: fitz.Page, page_number: int, text: str) -> Tuple[ValidationStatus, Optional[ValidationIssue]]:
        """Validate a single PDF page."""
        try:
            # Check if page can be rendered
            _ = page.get_pixmap(matrix=fitz.Matrix(0.1, 0.1))  # Low resolution test render

            # Check for encoding issues
            if '\ufffd' in text:  # Unicode replacement character
                return ValidationStatus.WARNING, ValidationIssue(
                    page=page_number,
                    issue_type='encoding',
                    message=f'Page {page_number} may have encoding issues',
                    severity=IssueSeverity.WARNING
                )

            # Check if page is completely empty
            if not text.strip() and not list(page.get_images()):
                return ValidationStatus.WARNING, ValidationIssue(
                    page=page_number,
                    issue_type='missing',
                    message=f'Page {page_number} appears to be empty',
                    severity=IssueSeverity.WARNING
                )

            return ValidationStatus.VALID, None

        except Exception as e:
            return ValidationStatus.ERROR, ValidationIssue(
                page=page_number,
                issue_type='corrupt',
                message=f'Page {page_number} validation failed: {str(e)}',
                severity=IssueSeverity.ERROR
            )

    def validate_document(self, doc: fitz.Document) -> PageValidation:
        """Validate the entire PDF document."""
        issues = []
        validated_count = 0

        for page_index in range(doc.page_count):
            try:
                page = doc.load_page(page_index)
                text = page.get_text("text", sort=True).strip()
                status, issue = self._validate_page(page, page_index + 1, text)

                if issue:
                    issues.append(issue)

                if status != ValidationStatus.ERROR:
                    validated_count += 1

            except Exception as e:
                issues.append(ValidationIssue(
                    page=page_index + 1,
                    issue_type='corrupt',
                    message=f'Failed to load page {page_index + 1}: {str(e)}',
                    severity=IssueSeverity.ERROR
                ))

        # Determine overall validation status
        has_errors = any(issue.severity == IssueSeverity.ERROR for issue in issues)
        is_valid = not has_errors and validated_count == doc.page_count

        return PageValidation(
            is_valid=is_valid,
            total_pages=doc.page_count,
            validated_pages=validated_count,
            issues=issues
        )

    def get_page_count(self, pdf_path: str) -> Tuple[int, bool]:
        """Get accurate page count with validation.

        Returns:
            Tuple of (page_count, is_reliable)
        """
        try:
            doc = fitz.open(pdf_path)
            page_count = doc.page_count

            # Quick validation - try to load first and last pages
            if page_count > 0:
                try:
                    doc.load_page(0)
                    if page_count > 1:
                        doc.load_page(page_count - 1)
                    is_reliable = True
                except:
                    is_reliable = False
            else:
                is_reliable = False

            doc.close()
            return page_count, is_reliable

        except Exception:
            return 0, False

    def extract(self, pdf_path: str, token: Optional[str] = None, validate: bool = True) -> PDFExtractionResult:
        """Extract content from PDF with validation.

        Args:
            pdf_path: Path to the PDF file
            token: Optional token for image identification
            validate: Whether to perform validation (default: True)

        Returns:
            PDFExtractionResult with pages, validation, and metadata
        """
        doc = fitz.open(pdf_path)
        pages: List[PageContent] = []
        file_token = token or hashlib.md5(pdf_path.encode()).hexdigest()

        # Perform validation if requested
        validation = self.validate_document(doc) if validate else PageValidation(
            is_valid=True,
            total_pages=doc.page_count,
            validated_pages=doc.page_count,
            issues=[]
        )

        # Extract document metadata
        doc_metadata = {
            'title': doc.metadata.get('title', ''),
            'author': doc.metadata.get('author', ''),
            'subject': doc.metadata.get('subject', ''),
            'keywords': doc.metadata.get('keywords', ''),
            'creator': doc.metadata.get('creator', ''),
            'producer': doc.metadata.get('producer', ''),
            'creation_date': doc.metadata.get('creationDate', ''),
            'modification_date': doc.metadata.get('modDate', ''),
            'format': 'PDF',
            'encrypted': doc.is_encrypted,
            'page_count': doc.page_count
        }

        for page_index in range(doc.page_count):
            try:
                page = doc.load_page(page_index)
                text = page.get_text("text", sort=True).strip()
                images: List[PageImage] = []

                # Validate this specific page
                page_status, page_issue = self._validate_page(page, page_index + 1, text)

                # Extract images
                for image_pos, image_info in enumerate(page.get_images(full=True)):
                    try:
                        xref = image_info[0]
                        base_image = doc.extract_image(xref)
                        image_bytes: bytes = base_image.get("image", b"")
                        if not image_bytes:
                            continue

                        ext = base_image.get("ext") or "png"
                        guessed_type = mimetypes.types_map.get(f".{ext}", "image/png")

                        image_id = f"{file_token}_p{page_index + 1}_{image_pos}.{ext}"
                        self.asset_manager.register(image_id, image_bytes, ext, guessed_type)

                        images.append(
                            PageImage(
                                id=image_id,
                                url=f"/api/convert/file/image/{image_id}",
                                width=base_image.get("width"),
                                height=base_image.get("height"),
                                content_type=guessed_type,
                            )
                        )
                    except Exception as e:
                        # Log but continue processing other images
                        print(f"Failed to extract image {image_pos} from page {page_index + 1}: {e}")

                # Calculate page metadata
                page_metadata = self._calculate_page_metadata(text, len(images) > 0)

                pages.append(PageContent(
                    number=page_index + 1,
                    text=text,
                    images=images,
                    metadata=page_metadata,
                    validation_status=page_status
                ))

            except Exception as e:
                # Add a page with error status
                pages.append(PageContent(
                    number=page_index + 1,
                    text="",
                    images=[],
                    metadata=PageMetadata(word_count=0, char_count=0, has_images=False),
                    validation_status=ValidationStatus.ERROR
                ))
                print(f"Failed to process page {page_index + 1}: {e}")

        result = PDFExtractionResult(
            pages=pages,
            page_count=doc.page_count,
            validation=validation,
            metadata=doc_metadata
        )
        doc.close()
        return result

    def get_image_asset(self, image_id: str) -> Optional[Dict[str, str]]:
        return self.asset_manager.get(image_id)


pdf_extractor = PDFExtractor()
"""Singleton extractor used by the FastAPI application."""
