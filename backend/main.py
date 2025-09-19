from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from markitdown import MarkItDown
import os
import tempfile
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Book.audio Document Converter API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MarkItDown
md_converter = MarkItDown()

class YouTubeRequest(BaseModel):
    url: str

class ConversionResponse(BaseModel):
    content: str
    metadata: Dict[str, Any]
    format: str
    success: bool
    error: Optional[str] = None

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

        # Convert using MarkItDown
        logger.info(f"Converting file: {temp_file_path}")
        result = md_converter.convert(temp_file_path)

        # Extract metadata
        metadata = {
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "format": file_extension.replace(".", "").upper()
        }

        # Parse the result - MarkItDown returns a Result object with title and text_content
        markdown_content = result.text_content if hasattr(result, 'text_content') else str(result)

        logger.info(f"Conversion successful for {file.filename}")

        return ConversionResponse(
            content=markdown_content,
            metadata=metadata,
            format="markdown",
            success=True
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
