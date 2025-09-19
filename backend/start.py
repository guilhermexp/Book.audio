#!/usr/bin/env python3
"""
Script to start the backend server with proper virtual environment activation
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent
    venv_path = backend_dir / "venv"

    # Check if virtual environment exists
    if not venv_path.exists():
        print("🔧 Virtual environment not found. Setting up...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=backend_dir)

        # Install requirements
        pip_path = venv_path / "bin" / "pip" if os.name != "nt" else venv_path / "Scripts" / "pip.exe"
        subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], cwd=backend_dir)
        print("✅ Setup complete!")

    # Run the main.py with the virtual environment Python
    python_path = venv_path / "bin" / "python" if os.name != "nt" else venv_path / "Scripts" / "python.exe"
    print("🚀 Starting Book.audio Backend Server...")
    print("📚 API Documentation: http://localhost:8000/docs")
    subprocess.run([str(python_path), "main.py"], cwd=backend_dir)

if __name__ == "__main__":
    main()
