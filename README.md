# Book.audio - AI-Powered Ebook Reader

A full-stack ebook reader application with AI-powered features including text-to-speech, summaries, chat assistant, and mind maps.

## Features

- 📚 Multi-format support: PDF, ePub, Word, PowerPoint, YouTube videos
- 🎙️ Text-to-speech with Brazilian Portuguese voices
- 🤖 AI-powered summaries and chat assistant (Gemini AI)
- 🧠 Interactive mind maps generation
- 📱 Responsive design with synchronized reading experience
- 🎵 Advanced audio controls with caching

## Architecture Overview

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: FastAPI + Python 3.9+
- **AI Integration**: Google Gemini AI
- **Document Processing**: MarkItDown + PyMuPDF
- **Text-to-Speech**: Edge-TTS

### System Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   React App     │────▶│  FastAPI Backend │
│   (Port 5173)   │     │   (Port 8010)    │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Gemini AI API  │     │  Edge-TTS Engine │
└─────────────────┘     └──────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Gemini API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/book.audio.git
cd book.audio
```

2. **Setup environment variables**
```bash
# Create .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

3. **Install dependencies and run**
```bash
# Install frontend dependencies
npm install

# Setup backend (creates venv and installs Python dependencies)
npm run backend:setup

# Start development server (frontend + backend)
npm run dev
```

The app will be available at http://localhost:5173

## Development Commands

```bash
# Full-stack development
npm run dev

# Frontend only
npm run dev:frontend-only

# Backend only
npm run dev:backend-only

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Project Structure

```
book.audio/
├── src/                    # Frontend source code
│   ├── App.tsx            # Main application component
│   ├── components/        # React components
│   │   ├── AudioPlayer.tsx
│   │   ├── BookView.tsx
│   │   ├── MindMap.tsx
│   │   └── icons/
│   └── services/          # Business logic services
│       ├── documentConverter.ts
│       └── ttsService.ts
├── backend/               # Python backend
│   ├── main.py           # FastAPI application
│   ├── pdf_extractor.py  # PDF processing
│   ├── tts_service.py    # Text-to-speech service
│   └── requirements.txt
├── public/               # Static assets
├── .env.local           # Environment variables (create this)
└── package.json         # Node.js dependencies
```

## API Documentation

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/convert/file` | POST | Convert documents (PDF, ePub, Word, PPT) |
| `/api/convert/youtube` | POST | Extract YouTube transcripts |
| `/api/tts/generate` | POST | Generate audio from text |

### Frontend Services

- **DocumentConverterService**: Handles document processing
- **TTSService**: Manages text-to-speech and audio caching
- **GeminiService**: AI integration for summaries and chat

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_API_URL` | Backend API URL (default: http://localhost:8010) | No |

### TTS Voice Configuration

The application supports multiple Brazilian Portuguese voices:
- Ana (Female, neutral)
- Francisca (Female, expressive)
- Antonio (Male, neutral)
- Humberto (Male, formal)

## Features Documentation

### PDF Processing
- Dual processing: client-side (PDF.js) + backend (PyMuPDF)
- Automatic page count validation
- Image extraction from PDFs
- Graceful fallback when backend unavailable

### Text-to-Speech
- Brazilian Portuguese optimization
- Audio caching for performance
- Variable speed control (0.5x - 2.0x)
- Synchronized audio-page navigation

### AI Features
- Document summarization
- Interactive chat with context
- Mind map generation
- Web search integration

## Troubleshooting

### Backend not starting
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall backend dependencies
rm -rf backend/venv
npm run backend:setup
```

### TTS not working
- Ensure backend is running on port 8010
- Check browser console for CORS errors
- Verify Edge-TTS is installed: `pip list | grep edge-tts`

### PDF pages mismatch
- Clear browser cache
- Restart both frontend and backend
- Check PDF file integrity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting guide above