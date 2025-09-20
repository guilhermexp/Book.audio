"""
Chatterbox Real TTS Service - Using the actual ResembleAI Chatterbox model
This integrates the real Chatterbox Multilingual TTS installed locally
"""

import sys
import os
import torch
import numpy as np
import tempfile
import hashlib
import re
import logging
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from collections import OrderedDict
from dataclasses import dataclass
from enum import Enum
import soundfile as sf
from pathlib import Path

# Add the Chatterbox project path to Python path
CHATTERBOX_PATH = "/Users/guilhermevarela/Documents/Projetos/Chatterbox-Multilingual-TTS"
sys.path.insert(0, CHATTERBOX_PATH)

# Import Chatterbox components
from src.chatterbox.mtl_tts import ChatterboxMultilingualTTS, SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

# Device configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"🚀 Chatterbox Real running on device: {DEVICE}")


class EmotionType(Enum):
    """Types of emotions for TTS"""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    EXCITED = "excited"
    CALM = "calm"
    CONTEMPLATIVE = "contemplative"


class ContentContext:
    """Contextual analysis for Chatterbox TTS"""

    def __init__(self, text: str):
        self.text = text
        self.sentences = self._split_sentences(text)
        self.word_count = len(text.split())
        self.dominant_emotion = EmotionType.NEUTRAL
        self.emotion_intensity = 0.5
        self.has_dialogue = self._detect_dialogue()

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting for Portuguese
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

    def _detect_dialogue(self) -> bool:
        """Detect if text contains dialogue"""
        dialogue_markers = ['"', '"', '"', '—', '–', '-']
        return any(marker in self.text for marker in dialogue_markers)

    def analyze(self):
        """Analyze text context"""
        self._detect_emotion()

    def _detect_emotion(self):
        """Detect dominant emotion from text"""
        text_lower = self.text.lower()

        # Emotion keywords in Portuguese
        if any(word in text_lower for word in ['feliz', 'alegre', 'contente', 'risonho']):
            self.dominant_emotion = EmotionType.HAPPY
            self.emotion_intensity = 0.7
        elif any(word in text_lower for word in ['triste', 'melancólico', 'deprimido']):
            self.dominant_emotion = EmotionType.SAD
            self.emotion_intensity = 0.6
        elif any(word in text_lower for word in ['raiva', 'furioso', 'irritado']):
            self.dominant_emotion = EmotionType.ANGRY
            self.emotion_intensity = 0.8
        elif any(word in text_lower for word in ['calmo', 'tranquilo', 'sereno']):
            self.dominant_emotion = EmotionType.CALM
            self.emotion_intensity = 0.4

        # Check punctuation for emotion
        if self.text.count('!') > 2:
            self.dominant_emotion = EmotionType.EXCITED
            self.emotion_intensity = 0.8
        elif self.text.count('?') > 2:
            self.dominant_emotion = EmotionType.CONTEMPLATIVE
            self.emotion_intensity = 0.6


class ChatterboxRealService:
    """Real Chatterbox TTS Service using the actual ResembleAI model"""

    def __init__(self):
        self.model = None
        self.cache = OrderedDict()
        self.cache_size = 50
        self.model_path = None
        self.initialized = False

        # Try to initialize the model
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the Chatterbox model"""
        try:
            logger.info("Initializing Chatterbox Real model...")

            # Check if model exists locally
            local_model_path = os.path.join(CHATTERBOX_PATH, "models")
            if not os.path.exists(local_model_path):
                # Try to download from HuggingFace
                from huggingface_hub import snapshot_download
                logger.info("Downloading Chatterbox model from HuggingFace...")
                local_model_path = snapshot_download(
                    repo_id="ResembleAI/chatterbox",
                    cache_dir=os.path.expanduser("~/.cache/huggingface/hub")
                )

            # Initialize the model
            self.model = ChatterboxMultilingualTTS.from_local(
                ckpt_dir=local_model_path,
                device=DEVICE
            )

            self.model_path = local_model_path
            self.initialized = True
            logger.info(f"✅ Chatterbox Real model initialized successfully from {local_model_path}")

        except Exception as e:
            logger.error(f"Failed to initialize Chatterbox model: {e}")
            self.initialized = False

    async def generate_with_context(
        self,
        text: str,
        language: str = "pt",
        voice_reference: Optional[str] = None,
        exaggeration: float = 0.6,
        temperature: float = 0.8,
        cfg_scale: float = 0.5,
        pre_analyze: bool = True
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate audio using real Chatterbox model with contextual analysis

        Args:
            text: Text to synthesize
            language: Language code (pt for Portuguese)
            voice_reference: Path to reference audio for voice cloning
            exaggeration: Control expressiveness (0-1)
            temperature: Generation temperature
            cfg_scale: Configuration scale
            pre_analyze: Analyze context before generation

        Returns:
            Tuple of (audio_file_path, metadata)
        """

        if not self.initialized:
            raise RuntimeError("Chatterbox model not initialized")

        # Validate language
        if language not in SUPPORTED_LANGUAGES:
            logger.warning(f"Language {language} not supported, defaulting to Portuguese")
            language = "pt"

        # Analyze context if requested
        context = ContentContext(text)
        if pre_analyze:
            context.analyze()

            # Adjust parameters based on context
            if context.dominant_emotion == EmotionType.EXCITED:
                exaggeration = min(0.9, exaggeration + 0.2)
            elif context.dominant_emotion == EmotionType.SAD:
                exaggeration = max(0.3, exaggeration - 0.2)
                temperature = max(0.6, temperature - 0.2)

        # Generate cache key
        cache_key = self._generate_cache_key(text, language, exaggeration, temperature)

        # Check cache
        if cache_key in self.cache:
            cached_path = self.cache[cache_key]
            if os.path.exists(cached_path):
                logger.info("Using cached audio")
                return cached_path, {"cached": True, "emotion": context.dominant_emotion.value}

        try:
            logger.info(f"Generating audio with Chatterbox Real: lang={language}, emotion={context.dominant_emotion.value}")

            # Set seed for reproducibility
            seed = 42
            torch.manual_seed(seed)
            if DEVICE == "cuda":
                torch.cuda.manual_seed(seed)
                torch.cuda.manual_seed_all(seed)
            np.random.seed(seed)

            # Use default voice reference for Portuguese if not provided
            if not voice_reference and language == "pt":
                # Use Spanish reference as a fallback for Portuguese
                voice_reference = None  # Will use default model voice

            # Generate audio directly with the model
            audio_tensor = self.model.generate(
                text=text,
                language_id=language,
                audio_prompt_path=voice_reference,
                exaggeration=exaggeration,
                cfg_weight=cfg_scale,
                temperature=temperature
            )

            # Convert tensor to numpy array and get sample rate
            audio_array = audio_tensor.squeeze().cpu().numpy()
            sample_rate = 24000  # Chatterbox uses 24kHz sample rate

            # Save audio to file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav", dir="/tmp") as tmp_file:
                output_path = tmp_file.name

            # Write audio
            sf.write(output_path, audio_array, sample_rate)

            # Convert to MP3 for smaller size
            mp3_path = output_path.replace('.wav', '.mp3')
            os.system(f"ffmpeg -i {output_path} -acodec mp3 -ab 192k {mp3_path} -y 2>/dev/null")

            # Clean up WAV
            if os.path.exists(output_path):
                os.remove(output_path)

            # Cache the result
            self.cache[cache_key] = mp3_path
            if len(self.cache) > self.cache_size:
                oldest = next(iter(self.cache))
                old_path = self.cache.pop(oldest)
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except:
                        pass

            metadata = {
                "model": "chatterbox-real",
                "language": language,
                "emotion": context.dominant_emotion.value,
                "emotion_intensity": context.emotion_intensity,
                "has_dialogue": context.has_dialogue,
                "exaggeration": exaggeration,
                "sample_rate": sample_rate,
                "cached": False
            }

            logger.info(f"✅ Audio generated successfully: {mp3_path}")
            return mp3_path, metadata

        except Exception as e:
            logger.error(f"Failed to generate audio with Chatterbox: {e}")
            raise

    def _generate_cache_key(self, text: str, language: str, exaggeration: float, temperature: float) -> str:
        """Generate unique cache key"""
        content = f"{text[:100]}:{language}:{exaggeration}:{temperature}"
        return hashlib.md5(content.encode()).hexdigest()

    def get_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            "engine": "chatterbox-real",
            "initialized": self.initialized,
            "model_path": self.model_path,
            "device": DEVICE,
            "languages": list(SUPPORTED_LANGUAGES.keys()),
            "cache_size": len(self.cache)
        }

    def clear_cache(self):
        """Clear audio cache"""
        for path in self.cache.values():
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass
        self.cache.clear()
        logger.info("Cache cleared")


# Global instance
chatterbox_service = ChatterboxRealService()

# Export for compatibility
EmotionType = EmotionType
CHATTERBOX_AVAILABLE = chatterbox_service.initialized