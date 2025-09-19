# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ebook reader web application built with React, TypeScript, and Vite. The app allows users to upload and read PDF files, get AI-powered summaries, interact with an AI assistant about the book content, and generate mind maps of book concepts.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

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

### Core Technologies
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini AI (`@google/genai`)
- **PDF Processing**: PDF.js (loaded via CDN)

### Application Structure

The app follows a component-based architecture:

- **App.tsx**: Main application component managing global state including:
  - Book content (pages, current page, navigation)
  - AI features (summaries, assistant chat, mind map generation)
  - UI state (panel visibility, loading states)

- **Component Organization**:
  - `components/` - All React components
    - `icons/` - SVG icon components
    - Main UI components (TopBar, BookView, AudioPlayer, Footer, etc.)
    - AI-powered components (AssistantPanel, MindMap)

### Key Architectural Patterns

1. **State Management**: Uses React hooks (useState) for local state management in App.tsx
2. **AI Integration**: Direct API calls to Gemini AI for summaries, chat, and structured JSON generation
3. **PDF Processing**: Client-side PDF parsing using pdf.js library
4. **Styling**: Inline Tailwind CSS classes for styling

### AI Features Implementation

- **Page Summaries**: Sends current page text to Gemini for summarization
- **AI Assistant**: Maintains chat history and sends full book context with each query, supports web search with citations
- **Mind Map Generation**: Uses structured JSON schema with Gemini to generate hierarchical book concept maps

### Build Configuration

- **Vite Config**: Custom environment variable injection for API keys
- **TypeScript Config**: ES2022 target with React JSX, path aliases configured