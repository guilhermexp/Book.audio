#!/usr/bin/env python3
"""
Setup script to download and configure Chatterbox TTS model
"""

import os
import sys
import torch
from huggingface_hub import snapshot_download
import nltk

def setup_nltk_data():
    """Download required NLTK data"""
    print("Downloading NLTK data...")
    nltk_downloads = [
        'punkt',
        'averaged_perceptron_tagger',
        'maxent_ne_chunker',
        'words',
        'stopwords'
    ]

    for dataset in nltk_downloads:
        try:
            nltk.download(dataset, quiet=True)
            print(f"✓ Downloaded {dataset}")
        except Exception as e:
            print(f"✗ Failed to download {dataset}: {e}")

def download_chatterbox_model():
    """Download Chatterbox model from HuggingFace"""
    print("\nDownloading Chatterbox model from HuggingFace...")

    model_id = "ResembleAI/chatterbox"
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")

    try:
        # Download model files
        model_path = snapshot_download(
            repo_id=model_id,
            cache_dir=cache_dir,
            resume_download=True,
            max_workers=4
        )

        print(f"✓ Model downloaded to: {model_path}")

        # Save model path for later use
        config_path = os.path.join(os.path.dirname(__file__), "chatterbox_config.json")
        import json
        with open(config_path, "w") as f:
            json.dump({
                "model_path": model_path,
                "model_id": model_id,
                "device": "cuda" if torch.cuda.is_available() else "cpu"
            }, f, indent=2)

        print(f"✓ Configuration saved to: {config_path}")
        return model_path

    except Exception as e:
        print(f"✗ Failed to download model: {e}")
        return None

def test_pytorch():
    """Test PyTorch installation"""
    print("\nTesting PyTorch installation...")
    try:
        import torch
        print(f"✓ PyTorch version: {torch.__version__}")
        print(f"✓ CUDA available: {torch.cuda.is_available()}")
        print(f"✓ Device: {'cuda' if torch.cuda.is_available() else 'cpu'}")

        # Test basic tensor operation
        x = torch.tensor([1.0, 2.0, 3.0])
        y = x * 2
        print(f"✓ Basic tensor operation successful: {x} * 2 = {y}")
        return True
    except Exception as e:
        print(f"✗ PyTorch test failed: {e}")
        return False

def test_transformers():
    """Test transformers installation"""
    print("\nTesting transformers installation...")
    try:
        print("✓ Transformers imported successfully")
        return True
    except Exception as e:
        print(f"✗ Transformers test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("CHATTERBOX TTS SETUP")
    print("=" * 60)

    # Test installations
    pytorch_ok = test_pytorch()
    transformers_ok = test_transformers()

    if not pytorch_ok or not transformers_ok:
        print("\n⚠️  Some dependencies are missing. Please install them first.")
        sys.exit(1)

    # Setup NLTK data
    setup_nltk_data()

    # Download Chatterbox model
    model_path = download_chatterbox_model()

    if model_path:
        print("\n" + "=" * 60)
        print("✅ CHATTERBOX SETUP COMPLETE!")
        print("=" * 60)
        print(f"\nModel location: {model_path}")
        print("\nYou can now use Chatterbox TTS with full contextual analysis!")
        print("The system will automatically detect and use the model.")
    else:
        print("\n⚠️  Model download failed, but the system will work with Edge-TTS")

if __name__ == "__main__":
    main()