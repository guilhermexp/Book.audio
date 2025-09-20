# Repository Guidelines

## Project Structure & Module Organization
The Vite/React frontend lives at the repo root with entry points `index.tsx` and `App.tsx`. Shared UI sits under `components/` (PascalCase files per component) and typed service helpers in `services/`. Python TTS tooling and integration scripts are grouped in `backend/`, which also stores virtual environments and helper shell scripts. Sample inputs, specs, and QA artefacts (for example `PRD_*.md`, `test_*.json`) stay at the top level for quick reference.

## Build, Test, and Development Commands
Run `npm install` once to fetch Node dependencies. Use `npm run backend:setup` to create the Python virtualenv and install `requirements.txt`. During active development prefer `npm run dev`, which launches the Vite frontend and Python backend via `concurrently`. For isolated work, `npm run frontend` and `npm run backend` start each side independently. Ship a production bundle with `npm run build`, and preview that build locally with `npm run preview`.

## Coding Style & Naming Conventions
TypeScript, React 19, and functional components are the default. Follow existing two-space indentation, single quotes, and trailing commas as shown in `components/AssistantPanel.tsx`. Name components and files in PascalCase, hooks in camelCase, and utility modules in lower camelCase. Keep UI state in hooks near the consuming component and move cross-cutting logic into `services/`. The backend targets Python 3; mirror the current snake_case module and function naming.

## Testing Guidelines
Frontend tests are not yet automated, so gate changes by exercising key flows locally (`npm run dev`). The backend includes executable scripts such as `backend/test_tts.py` for manual validation of Edge-TTS integration; run them inside the configured virtualenv (`source backend/venv/bin/activate && python backend/test_tts.py`). When adding tests, prefer Vitest for the frontend and pytest for Python, and keep fixtures beside the code under test.

## Commit & Pull Request Guidelines
Recent history uses concise, lowercase prefixes like `feat:`, `fix:`, or context-specific tags (see `git log --oneline`). Keep commit bodies short and scoped to a single concern. Pull requests should describe the motivation, call out UI changes with screenshots or screen recordings, list manual test steps, and link the matching PRD or issue. Tag reviewers from both frontend and backend when changes cross boundaries.

## Environment & Secrets
Store secrets (e.g., `GEMINI_API_KEY`) in `.env.local`; never commit them. Document new environment variables in README-like files and provide safe defaults where possible. Backend voice synthesis relies on external services—note any new dependencies or rate limits in the PR description.
