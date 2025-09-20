# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack ebook reader application with AI-powered features. The frontend is built with React and TypeScript, while the backend provides document conversion and text-to-speech services. The app supports PDF, ePub, Word, PowerPoint files, and YouTube videos, with features like AI summaries, assistants, mind maps, and audio narration.

## Development Commands

```bash
# Install frontend dependencies
npm install

# Setup backend (creates venv and installs requirements)
npm run backend:setup

# Run full-stack development (frontend + backend)
npm run dev

# Run frontend only
npm run dev:frontend-only

# Run backend only
npm run dev:backend-only

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create a `.env.local` file with your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Architecture Overview

### Full-Stack Architecture
- **Frontend**: React 19 + TypeScript + Vite (port 5173)
- **Backend**: FastAPI + Python (port 8000)
- **AI Integration**: Google Gemini AI with web search capabilities
- **Document Processing**: MarkItDown for various formats, PyMuPDF for advanced PDF processing
- **Text-to-Speech**: Edge-TTS for audio generation

### Frontend Architecture (`App.tsx`)

The main App component manages all global state using React hooks:

**State Categories:**
- **Book State**: `bookPages`, `currentPage`, `totalPages`, `bookTitle`
- **AI State**: `summary`, `chatHistory`, `mindMapData`
- **TTS State**: `isTTSPlaying`, `ttsVoice`, `ttsSpeed`
- **UI State**: `isAssistantVisible`, `isMindMapVisible`, `isAudioPlayerVisible`
- **Backend Health**: `backendHealthy`, `ttsBackendHealthy`

**Key Patterns:**
- Singleton services for document conversion and TTS (`DocumentConverterService`, `TTSService`)
- Dual PDF processing: client-side PDF.js + backend PyMuPDF extraction with image support
- Backend fallback system: client-only PDF support when backend unavailable
- Audio caching and management in TTS service

### Backend Architecture (`backend/main.py`)

FastAPI application with modular services:

**Core Endpoints:**
- `/api/convert/file` - Multi-format document conversion via MarkItDown
- `/api/convert/youtube` - YouTube transcript extraction
- `/api/tts/generate` - Text-to-speech audio generation
- `/api/health` - Service health check

**Services:**
- `pdf_extractor.py` - Advanced PDF processing with image extraction using PyMuPDF
- `tts_service.py` - Edge-TTS wrapper with caching and voice management
- `main.py` - FastAPI routes and request/response models

### Service Communication

**Frontend ↔ Backend:**
- HTTP API calls via axios with CORS support
- Health checks on startup to determine feature availability
- Graceful degradation when backend unavailable (PDF-only mode)

**AI Integration:**
- Direct Gemini AI API calls from frontend for summaries and chat
- Structured JSON generation for mind maps using response schemas
- Web search integration with citation support

### Development Patterns

**File Structure:**
- `services/` - Frontend service classes (DocumentConverter, TTS)
- `components/` - React components with icon submodule
- `backend/` - Python FastAPI backend with modular services

**State Management:**
- Single source of truth in App.tsx
- Service classes handle business logic and caching
- Backend health checks determine available features

**Error Handling:**
- Graceful fallbacks for missing backend services
- User-friendly error messages for conversion failures
- Automatic retry mechanisms in TTS service