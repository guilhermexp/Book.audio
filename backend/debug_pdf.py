"""Utility script to inspect PDF extraction results."""

from __future__ import annotations

import argparse
from pathlib import Path

from pdf_extractor import pdf_extractor


def inspect_pdf(pdf_path: Path) -> None:
    if not pdf_path.exists():
        raise FileNotFoundError(f"File not found: {pdf_path}")

    result = pdf_extractor.extract(str(pdf_path), token=pdf_path.name)

    print(f"PDF: {pdf_path}")
    print(f"Total pages detected: {result.page_count}")
    print("Preview of first 5 pages (text length / image count):")

    for page in result.pages[:5]:
        text_len = len(page.text)
        img_count = len(page.images)
        has_content = page.has_content
        print(f" - Page {page.number:>3}: text_len={text_len:<5} images={img_count:<2} has_content={has_content}")

    missing = [p.number for p in result.pages if not p.has_content]
    if missing:
        print(f"Pages without textual or image content: {len(missing)}")
        print(f"Sample: {missing[:10]}")
    else:
        print("All pages have some content captured.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect PDF extraction output")
    parser.add_argument("pdf", type=Path, help="Path to PDF file")
    args = parser.parse_args()
    inspect_pdf(args.pdf)
