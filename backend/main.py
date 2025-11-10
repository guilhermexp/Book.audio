from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from markitdown import MarkItDown
import os
import tempfile
from typing import Optional, Dict, Any, List
import logging
from pdf_extractor import pdf_extractor

# Import ONLY Chatterbox Real Service
from chatterbox_real_service import chatterbox_service, CHATTERBOX_AVAILABLE

logger = logging.getLogger(__name__)
if CHATTERBOX_AVAILABLE:
    logger.info("✅ Chatterbox Real TTS loaded successfully!")
else:
    logger.error("❌ Chatterbox Real TTS not available - system will not work!")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Book.audio Document Converter API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8010"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MarkItDown
md_converter = MarkItDown()

class YouTubeRequest(BaseModel):
    url: str

class PageImageResponse(BaseModel):
    id: str
    url: str
    width: Optional[int] = None
    height: Optional[int] = None
    content_type: str


class PageMetadataResponse(BaseModel):
    word_count: int
    char_count: int
    has_images: bool
    reading_time: Optional[float] = None


class PageContentResponse(BaseModel):
    number: int
    text: str
    images: List[PageImageResponse] = []
    has_content: bool
    metadata: Optional[PageMetadataResponse] = None
    validation_status: Optional[str] = None


class ValidationIssueResponse(BaseModel):
    page: int
    issue_type: str
    message: str
    severity: str


class PageValidationResponse(BaseModel):
    is_valid: bool
    total_pages: int
    validated_pages: int
    issues: List[ValidationIssueResponse] = []


class ConversionResponse(BaseModel):
    content: str
    metadata: Dict[str, Any]
    format: str
    success: bool
    error: Optional[str] = None
    pages: Optional[List[PageContentResponse]] = None
    page_count: Optional[int] = None
    validation: Optional[PageValidationResponse] = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "pt-BR-FranciscaNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"

class TTSPageRequest(BaseModel):
    page_content: str
    page_number: int
    voice: str = "pt-BR-FranciscaNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    use_contextual_analysis: bool = True
    pre_generate_next: bool = True

class TTSContextualRequest(BaseModel):
    text: str
    voice: Optional[str] = "pt-BR-FranciscaNeural"
    emotion_exaggeration: float = 0.5
    cfg_scale: float = 0.5
    auto_emotion: bool = True
    pre_analyze: bool = True
    page_id: Optional[str] = None

class TTSPreGenerateRequest(BaseModel):
    pages: List[Dict[str, Any]]
    voice: str = "pt-BR-FranciscaNeural"
    settings: Optional[Dict[str, Any]] = None

class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str
    locale: str

class VoicesResponse(BaseModel):
    voices: List[VoiceInfo]
    total: int

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Book.audio Document Converter"}

@app.post("/api/convert/file", response_model=ConversionResponse)
async def convert_file(file: UploadFile = File(...)):
    """
    Convert uploaded files (PDF, ePub, Word, etc.) to Markdown
    """
    logger.info(f"Received file: {file.filename}, type: {file.content_type}")

    # Validate file size (50MB limit)
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")

    # Save to temporary file
    temp_file = None
    try:
        # Create temporary file with proper extension
        file_extension = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Extract metadata
        metadata = {
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "format": file_extension.replace(".", "").upper(),
        }

        if file_extension.lower() == ".pdf":
            logger.info(f"Extracting paginated content for PDF: {file.filename}")
            pdf_result = pdf_extractor.extract(temp_file_path, token=file.filename or temp_file_path, validate=True)

            # Update metadata with PDF-specific information
            metadata["page_count"] = pdf_result.page_count
            if pdf_result.metadata:
                metadata.update({
                    "title": pdf_result.metadata.get("title") or file.filename,
                    "author": pdf_result.metadata.get("author"),
                    "creation_date": str(pdf_result.metadata.get("creation_date")) if pdf_result.metadata.get("creation_date") else None,
                    "modification_date": str(pdf_result.metadata.get("modification_date")) if pdf_result.metadata.get("modification_date") else None,
                })

            combined_text = "\n\n---\n\n".join(
                page.text for page in pdf_result.pages if page.text.strip()
            )

            # Convert pages to response format
            page_payload: List[PageContentResponse] = [
                PageContentResponse(
                    number=page.number,
                    text=page.text,
                    images=[
                        PageImageResponse(
                            id=image.id,
                            url=image.url,
                            width=image.width,
                            height=image.height,
                            content_type=image.content_type,
                        )
                        for image in page.images
                    ],
                    has_content=page.has_content,
                    metadata=PageMetadataResponse(
                        word_count=page.metadata.word_count,
                        char_count=page.metadata.char_count,
                        has_images=page.metadata.has_images,
                        reading_time=page.metadata.reading_time,
                    ) if page.metadata else None,
                    validation_status=page.validation_status.value if page.validation_status else None,
                )
                for page in pdf_result.pages
            ]

            # Convert validation to response format
            validation_payload = None
            if pdf_result.validation:
                validation_payload = PageValidationResponse(
                    is_valid=pdf_result.validation.is_valid,
                    total_pages=pdf_result.validation.total_pages,
                    validated_pages=pdf_result.validation.validated_pages,
                    issues=[
                        ValidationIssueResponse(
                            page=issue.page,
                            issue_type=issue.issue_type,
                            message=issue.message,
                            severity=issue.severity.value,
                        )
                        for issue in pdf_result.validation.issues
                    ],
                )

            logger.info(
                "PDF extraction completed: %s (pages=%s, valid=%s)",
                file.filename,
                pdf_result.page_count,
                pdf_result.validation.is_valid if pdf_result.validation else "not validated",
            )

            return ConversionResponse(
                content=combined_text,
                metadata=metadata,
                format="pdf-pages",
                success=True,
                pages=page_payload,
                page_count=pdf_result.page_count,
                validation=validation_payload,
            )

        # Convert using MarkItDown for non-PDF formats
        logger.info(f"Converting file with MarkItDown: {temp_file_path}")
        result = md_converter.convert(temp_file_path)

        metadata["format"] = metadata["format"] or "MARKDOWN"

        markdown_content = result.text_content if hasattr(result, 'text_content') else str(result)

        logger.info(f"Conversion successful for {file.filename}")

        return ConversionResponse(
            content=markdown_content,
            metadata=metadata,
            format="markdown",
            success=True,
        )

    except Exception as e:
        logger.error(f"Error converting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting file: {str(e)}")

    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

@app.post("/api/pdf/validate")
async def validate_pdf(file: UploadFile = File(...)):
    """
    Quick validation and page count for PDF files
    """
    logger.info(f"Validating PDF: {file.filename}")

    content = await file.read()
    temp_file = None

    try:
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Get page count with validation
        page_count, is_reliable = pdf_extractor.get_page_count(temp_file_path)

        # Perform full validation if needed
        if is_reliable:
            import fitz
            doc = fitz.open(temp_file_path)
            validation = pdf_extractor.validate_document(doc)
            doc.close()

            validation_response = {
                "is_valid": validation.is_valid,
                "total_pages": validation.total_pages,
                "validated_pages": validation.validated_pages,
                "issues": [
                    {
                        "page": issue.page,
                        "type": issue.issue_type,
                        "message": issue.message,
                        "severity": issue.severity.value,
                    }
                    for issue in validation.issues
                ],
            }
        else:
            validation_response = {
                "is_valid": False,
                "total_pages": page_count,
                "validated_pages": 0,
                "issues": [
                    {
                        "page": 0,
                        "type": "corrupt",
                        "message": "Unable to reliably determine page count",
                        "severity": "error",
                    }
                ],
            }

        return {
            "success": True,
            "page_count": page_count,
            "is_reliable": is_reliable,
            "validation": validation_response,
            "filename": file.filename,
        }

    except Exception as e:
        logger.error(f"Error validating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error validating PDF: {str(e)}")

    finally:
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

@app.post("/api/convert/youtube", response_model=ConversionResponse)
async def convert_youtube(request: YouTubeRequest):
    """
    Convert YouTube video to transcript markdown
    """
    logger.info(f"Received YouTube URL: {request.url}")

    try:
        # Validate YouTube URL
        if "youtube.com" not in request.url and "youtu.be" not in request.url:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")

        # Convert using MarkItDown
        result = md_converter.convert(request.url)

        # Extract metadata
        metadata = {
            "url": request.url,
            "format": "YOUTUBE"
        }

        markdown_content = result.text_content if hasattr(result, 'text_content') else str(result)

        logger.info(f"YouTube conversion successful for {request.url}")

        return ConversionResponse(
            content=markdown_content,
            metadata=metadata,
            format="markdown",
            success=True
        )

    except Exception as e:
        logger.error(f"Error converting YouTube video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting YouTube video: {str(e)}")

@app.post("/api/convert/url", response_model=ConversionResponse)
async def convert_url(request: BaseModel):
    """
    Convert any supported URL to Markdown
    """
    url = request.dict().get("url")

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        result = md_converter.convert(url)
        markdown_content = result.text_content if hasattr(result, 'text_content') else str(result)

        return ConversionResponse(
            content=markdown_content,
            metadata={"url": url},
            format="markdown",
            success=True
        )
    except Exception as e:
        logger.error(f"Error converting URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error converting URL: {str(e)}")

# ============= TTS ENDPOINTS =============

@app.post("/api/tts/generate")
async def generate_tts(request: TTSRequest):
    """
    Generate audio from text using Chatterbox Real TTS
    """
    try:
        logger.info(f"TTS request for text length: {len(request.text)}, voice: {request.voice}")

        # Generate audio with optimization
        audio_path, metadata = await tts_service.generate_audio(
            text=request.text,
            voice=request.voice,
            rate=request.rate,
            pitch=request.pitch,
            optimize_text=True,
            content_type="narrative"
        )

        # Return audio file
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=audio.mp3",
                "Cache-Control": "public, max-age=3600"
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@app.post("/api/tts/generate-page")
async def generate_page_audio(request: TTSPageRequest):
    """
    Generate audio for a specific page
    """
    try:
        logger.info(f"TTS page request for page {request.page_number}")

        # Generate audio with optimization
        audio_path, metadata = await tts_service.generate_audio(
            text=request.page_content,
            voice=request.voice,
            rate=request.rate,
            pitch=request.pitch,
            optimize_text=True,
            content_type="narrative"
        )

        # Get file size for duration estimation
        file_size = os.path.getsize(audio_path)
        # Rough estimation: 128kbps MP3 = 16KB/s
        estimated_duration = file_size / (16 * 1024)

        return {
            "audioUrl": f"/api/tts/audio/{os.path.basename(audio_path)}",
            "duration": estimated_duration,
            "pageNumber": request.page_number,
            "cached": audio_path in tts_service.cache.values()
        }

    except Exception as e:
        logger.error(f"Error generating page audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tts/audio/{filename}")
async def get_audio(filename: str):
    """
    Serve audio files
    """
    audio_path = f"/tmp/{filename}"
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=3600"
        }
    )


@app.get("/api/tts/brazilian-voices")
async def get_brazilian_voices():
    """
    Get list of Brazilian Portuguese voices with detailed characteristics
    """
    try:
        voices = await tts_service.get_brazilian_voices()
        return {
            "voices": voices,
            "total": len(voices)
        }
    except Exception as e:
        logger.error(f"Error getting Brazilian voices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts/recommend-voice")
async def recommend_voice(
    content_type: str = "narrative",
    preferred_gender: Optional[str] = None
):
    """
    Recommend best Brazilian voice for content type
    """
    try:
        recommendation = await tts_service.recommend_voice(content_type, preferred_gender)
        return recommendation
    except Exception as e:
        logger.error(f"Error recommending voice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts/optimize-text")
async def optimize_text_for_tts(
    text: str,
    voice: str = "pt-BR-FranciscaNeural",
    content_type: str = "narrative"
):
    """
    Optimize text for natural TTS output in Brazilian Portuguese
    """
    try:
        result = await tts_service.optimize_text_for_tts(text, voice, content_type)
        return result
    except Exception as e:
        logger.error(f"Error optimizing text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/convert/file/image/{image_id}")
async def get_pdf_image(image_id: str):
    asset = pdf_extractor.get_image_asset(image_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        asset["path"],
        media_type=asset.get("content_type", "image/png"),
        headers={"Cache-Control": "public, max-age=3600"},
    )

@app.get("/api/tts/voices", response_model=VoicesResponse)
async def list_voices(locale: Optional[str] = None):
    """
    List available TTS voices
    """
    try:
        voices = await tts_service.list_voices(locale_filter=locale)

        return VoicesResponse(
            voices=[VoiceInfo(**v) for v in voices],
            total=len(voices)
        )

    except Exception as e:
        logger.error(f"Error listing voices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tts/cache")
async def clear_tts_cache():
    """
    Clear TTS audio cache
    """
    try:
        tts_service.clear_cache()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Advanced TTS endpoints
@app.post("/api/tts/generate-contextual")
async def generate_contextual_tts(request: TTSContextualRequest):
    """
    Generate TTS with full contextual analysis (Chatterbox or Advanced TTS)
    Reads entire text first for natural speech generation
    """
    try:
        if not CHATTERBOX_AVAILABLE:
            raise HTTPException(status_code=503, detail="Chatterbox TTS not available")

        # Use Chatterbox Real
        logger.info("Using Chatterbox Real TTS")
        audio_path, metadata = await chatterbox_service.generate_with_context(
            text=request.text,
            language="pt",  # Portuguese
            voice_reference=None,
            exaggeration=request.emotion_exaggeration,
            temperature=0.8,
            cfg_scale=request.cfg_scale,
            pre_analyze=request.pre_analyze
        )

        # Return audio file
        if os.path.exists(audio_path):
            return FileResponse(
                audio_path,
                media_type="audio/mpeg",
                headers={
                    "X-TTS-Engine": metadata.get("model", "edge-tts"),
                    "X-TTS-Emotion": metadata.get("emotion", "neutral"),
                    "X-TTS-Cached": str(metadata.get("cached", False))
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Audio generation failed")

    except Exception as e:
        logger.error(f"Error generating contextual TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint removido - pre-generation não disponível no Chatterbox Real atual
# @app.post("/api/tts/pre-generate")
# async def pre_generate_pages(request: TTSPreGenerateRequest):
#     """
#     Pre-generate audio for multiple pages in background
#     """
#     try:
#         if CHATTERBOX_AVAILABLE:
#             # Queue pages for pre-generation with Chatterbox
#             for page in request.pages:
#                 chatterbox_service.queue_page_for_pregeneration(
#                     page_id=str(page.get("id", page.get("number", 0))),
#                 text=page.get("text", ""),
#                 voice_reference=None,
#                 settings=request.settings
#             )
#         return {"message": f"Queued {len(request.pages)} pages for pre-generation"}
#
#     elif ADVANCED_TTS_AVAILABLE:
#         # Use advanced TTS pre-generation
#         advanced_tts_service.pre_generate_for_pages(
#             pages=request.pages,
#             voice=request.voice,
#             settings=request.settings
#         )
#         return {"message": f"Queued {len(request.pages)} pages for pre-generation"}
#
#     else:
#         # No pre-generation available with basic Edge-TTS
#         return {"message": "Pre-generation not available with current TTS engine"}
#
# except Exception as e:
#     logger.error(f"Error pre-generating pages: {str(e)}")
#     raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/tts/pre-generated/{page_id}")
# async def get_pregenerated_audio(page_id: str):
#     """
#     Get pre-generated audio for a page if available
#     """
#     try:
#         if CHATTERBOX_AVAILABLE:
#             audio_data = chatterbox_service.get_pregenerated_audio(page_id)
#         elif ADVANCED_TTS_AVAILABLE:
#             audio_data = advanced_tts_service.get_pre_generated_audio(page_id)
#         else:
#             audio_data = None
#
#         if audio_data and os.path.exists(audio_data["audio_path"]):
#             return FileResponse(
#                 audio_data["audio_path"],
#                 media_type="audio/mpeg",
#                 headers={
#                     "X-TTS-Pre-Generated": "true",
#                     "X-TTS-Generated-At": str(audio_data.get("generated_at", ""))
#                 }
#             )
#         else:
#             raise HTTPException(status_code=404, detail="Pre-generated audio not found")

#
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error getting pre-generated audio: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tts/status")
async def get_tts_status():
    """
    Get status of available TTS engines
    """
    status = chatterbox_service.get_status()
    return {
        "engine": "chatterbox-real",
        "available": CHATTERBOX_AVAILABLE,
        "initialized": status.get("initialized", False),
        "model_path": status.get("model_path"),
        "device": status.get("device"),
        "languages": status.get("languages", []),
        "portuguese_supported": "pt" in status.get("languages", []),
        "contextual_analysis": True,
        "pre_generation": True,
        "emotion_control": True,
        "voice_cloning": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
