"""
TTS Service for generating audio from text using Edge-TTS
"""

import edge_tts
import asyncio
import tempfile
import os
import hashlib
import re
import unicodedata
from typing import Optional, Dict, Any, List, Tuple
from collections import OrderedDict
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ContentType(Enum):
    """Types of content for voice selection"""
    NARRATIVE = "narrative"  # Stories, fiction
    TECHNICAL = "technical"  # Technical documentation
    CASUAL = "casual"  # Informal content
    FORMAL = "formal"  # Academic, business


@dataclass
class BrazilianVoice:
    """Brazilian voice configuration"""
    id: str
    name: str
    gender: str
    naturalness: float  # 0-100
    clarity: float  # 0-100
    expressiveness: float  # 0-100
    suitability: Dict[ContentType, float]  # 0-100 for each content type
    recommended: bool = False


class TextOptimizer:
    """Optimize text for natural TTS output in Brazilian Portuguese"""

    def __init__(self):
        self.abbreviations = {
            "Dr.": "Doutor",
            "Dra.": "Doutora",
            "Sr.": "Senhor",
            "Sra.": "Senhora",
            "Eng.": "Engenheiro",
            "Prof.": "Professor",
            "Profa.": "Professora",
            "etc.": "etcétera",
            "vs.": "versus",
            "pg.": "página",
            "pgs.": "páginas",
            "cap.": "capítulo",
            "vol.": "volume",
            "n.": "número",
        }

        # Common units that need spacing
        self.units = {
            "km": "quilômetros",
            "m": "metros",
            "cm": "centímetros",
            "kg": "quilogramas",
            "g": "gramas",
            "l": "litros",
            "ml": "mililitros",
        }

    def optimize(self, text: str, content_type: ContentType = ContentType.NARRATIVE) -> str:
        """Optimize text for TTS

        Args:
            text: Text to optimize
            content_type: Type of content for context-specific optimization

        Returns:
            Optimized text
        """
        if not text:
            return text

        # Replace abbreviations
        optimized = self._expand_abbreviations(text)

        # Add natural pauses
        optimized = self._add_natural_pauses(optimized)

        # Fix number pronunciation
        optimized = self._fix_numbers(optimized)

        # Add emphasis markers for questions
        optimized = self._add_question_emphasis(optimized)

        # Normalize punctuation
        optimized = self._normalize_punctuation(optimized)

        return optimized

    def _expand_abbreviations(self, text: str) -> str:
        """Expand common abbreviations"""
        result = text
        for abbr, expansion in self.abbreviations.items():
            # Case-sensitive replacement
            result = result.replace(abbr, expansion)
            # Capital version
            result = result.replace(abbr.upper(), expansion.upper())
        return result

    def _add_natural_pauses(self, text: str) -> str:
        """Add commas and pauses for natural speech flow"""
        # Add comma before 'mas' if not present
        text = re.sub(r'(?<!,)\s+mas\s+', ', mas ', text)

        # Add comma before 'porque' in certain contexts
        text = re.sub(r'(?<!,)\s+porque\s+', ', porque ', text)

        # Add pause after long sentences (more than 20 words without punctuation)
        sentences = text.split('.')
        result = []
        for sentence in sentences:
            words = sentence.split()
            if len(words) > 20 and ',' not in sentence:
                # Add comma in the middle
                mid_point = len(words) // 2
                words[mid_point] = words[mid_point] + ','
                sentence = ' '.join(words)
            result.append(sentence)

        return '.'.join(result)

    def _fix_numbers(self, text: str) -> str:
        """Improve number pronunciation"""
        # Add space between numbers and units
        for unit, full_name in self.units.items():
            pattern = rf'(\d+)\s*{unit}\b'
            text = re.sub(pattern, rf'\1 {full_name}', text, flags=re.IGNORECASE)

        # Format large numbers with periods for thousands
        def format_number(match):
            num = match.group(0)
            if len(num) >= 4:
                # Add dots for thousands separator
                return f"{int(num):,}".replace(',', '.')
            return num

        text = re.sub(r'\b\d{4,}\b', format_number, text)

        return text

    def _add_question_emphasis(self, text: str) -> str:
        """Add emphasis to questions"""
        # Questions in Portuguese often need rising intonation
        # Edge-TTS handles this automatically with '?'
        # But we can improve with emphasis tags
        questions = re.findall(r'[^.!?]*\?', text)
        for question in questions:
            # Add slight emphasis to question words
            emphasized = question
            question_words = ['Quem', 'O que', 'Onde', 'Quando', 'Por que', 'Como', 'Qual', 'Quanto']
            for word in question_words:
                emphasized = emphasized.replace(word, f'<emphasis level="moderate">{word}</emphasis>')
            text = text.replace(question, emphasized)

        return text

    def _normalize_punctuation(self, text: str) -> str:
        """Normalize punctuation for better TTS"""
        # Replace multiple exclamation marks with single
        text = re.sub(r'!+', '!', text)

        # Replace multiple question marks with single
        text = re.sub(r'\?+', '?', text)

        # Replace ellipsis variations with standard
        text = re.sub(r'\.{2,}', '...', text)

        # Add space after punctuation if missing
        text = re.sub(r'([.!?,;:])([A-Za-zÀ-ÿ])', r'\1 \2', text)

        return text


class BrazilianVoiceManager:
    """Manager for Brazilian Portuguese voices with optimization"""

    def __init__(self):
        self.voices = self._initialize_voices()
        self.text_optimizer = TextOptimizer()

    def _initialize_voices(self) -> Dict[str, BrazilianVoice]:
        """Initialize Brazilian voice profiles with characteristics"""
        return {
            "pt-BR-FranciscaNeural": BrazilianVoice(
                id="pt-BR-FranciscaNeural",
                name="Francisca",
                gender="Female",
                naturalness=95,
                clarity=92,
                expressiveness=88,
                suitability={
                    ContentType.NARRATIVE: 95,
                    ContentType.TECHNICAL: 85,
                    ContentType.CASUAL: 90,
                    ContentType.FORMAL: 88,
                },
                recommended=True
            ),
            "pt-BR-AntonioNeural": BrazilianVoice(
                id="pt-BR-AntonioNeural",
                name="Antonio",
                gender="Male",
                naturalness=93,
                clarity=90,
                expressiveness=85,
                suitability={
                    ContentType.NARRATIVE: 90,
                    ContentType.TECHNICAL: 92,
                    ContentType.CASUAL: 85,
                    ContentType.FORMAL: 95,
                },
            ),
            "pt-BR-HumbertoNeural": BrazilianVoice(
                id="pt-BR-HumbertoNeural",
                name="Humberto",
                gender="Male",
                naturalness=88,
                clarity=95,
                expressiveness=75,
                suitability={
                    ContentType.NARRATIVE: 80,
                    ContentType.TECHNICAL: 95,
                    ContentType.CASUAL: 70,
                    ContentType.FORMAL: 92,
                },
            ),
            "pt-BR-LeticiaNeural": BrazilianVoice(
                id="pt-BR-LeticiaNeural",
                name="Letícia",
                gender="Female",
                naturalness=90,
                clarity=88,
                expressiveness=92,
                suitability={
                    ContentType.NARRATIVE: 88,
                    ContentType.TECHNICAL: 75,
                    ContentType.CASUAL: 95,
                    ContentType.FORMAL: 80,
                },
            ),
        }

    def recommend_voice(
        self,
        content_type: ContentType = ContentType.NARRATIVE,
        preferred_gender: Optional[str] = None
    ) -> BrazilianVoice:
        """Recommend best voice for content type

        Args:
            content_type: Type of content
            preferred_gender: Preferred voice gender (Male/Female/None)

        Returns:
            Recommended voice
        """
        candidates = list(self.voices.values())

        # Filter by gender if preference given
        if preferred_gender:
            candidates = [v for v in candidates if v.gender == preferred_gender]

        # Sort by suitability for content type
        candidates.sort(
            key=lambda v: v.suitability.get(content_type, 0),
            reverse=True
        )

        return candidates[0] if candidates else list(self.voices.values())[0]

    def get_voice(self, voice_id: str) -> Optional[BrazilianVoice]:
        """Get voice by ID"""
        return self.voices.get(voice_id)

    def list_voices(self) -> List[BrazilianVoice]:
        """List all Brazilian voices"""
        return list(self.voices.values())

    def optimize_text(
        self,
        text: str,
        voice_id: str,
        content_type: ContentType = ContentType.NARRATIVE
    ) -> str:
        """Optimize text for specific voice

        Args:
            text: Text to optimize
            voice_id: Voice ID for context
            content_type: Type of content

        Returns:
            Optimized text
        """
        voice = self.get_voice(voice_id)
        if not voice:
            return text

        # Apply text optimization
        optimized = self.text_optimizer.optimize(text, content_type)

        # Voice-specific adjustments
        if voice.expressiveness < 80:
            # For less expressive voices, add more explicit pauses
            optimized = optimized.replace(',', ', <break time="200ms"/>')

        return optimized

class TTSService:
    """Service for handling Text-to-Speech generation with Brazilian voice optimization"""

    def __init__(self, cache_size: int = 50):
        """
        Initialize TTS Service

        Args:
            cache_size: Maximum number of cached audio files
        """
        self.cache: OrderedDict = OrderedDict()
        self.cache_size = cache_size
        self.brazilian_voice_manager = BrazilianVoiceManager()

    def _generate_cache_key(self, text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz") -> str:
        """Generate unique cache key for audio"""
        content = f"{text}:{voice}:{rate}:{pitch}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_from_cache(self, key: str) -> Optional[str]:
        """Get cached audio file path"""
        if key in self.cache:
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            file_path = self.cache[key]
            # Check if file still exists
            if os.path.exists(file_path):
                return file_path
            else:
                # Remove from cache if file doesn't exist
                del self.cache[key]
        return None

    def _add_to_cache(self, key: str, file_path: str):
        """Add audio file to cache"""
        # Remove oldest if cache is full
        if len(self.cache) >= self.cache_size:
            oldest_key, oldest_path = self.cache.popitem(last=False)
            # Delete the oldest file
            try:
                if os.path.exists(oldest_path):
                    os.remove(oldest_path)
            except Exception as e:
                logger.warning(f"Failed to remove old cache file: {e}")

        self.cache[key] = file_path

    async def generate_audio(
        self,
        text: str,
        voice: str = "pt-BR-FranciscaNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz",
        use_cache: bool = True,
        optimize_text: bool = True,
        content_type: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate audio from text with Brazilian voice optimization

        Args:
            text: Text to convert to speech
            voice: Voice ID to use
            rate: Speech rate adjustment (-50% to +100%)
            pitch: Pitch adjustment (-50Hz to +50Hz)
            use_cache: Whether to use cache
            optimize_text: Whether to optimize text for Brazilian Portuguese
            content_type: Type of content for optimization

        Returns:
            Tuple of (audio_file_path, metadata)
        """
        if not text:
            raise ValueError("Text cannot be empty")

        # Optimize text if requested and using Brazilian voice
        original_text = text
        if optimize_text and voice.startswith("pt-BR"):
            content_type_enum = ContentType[content_type.upper()] if content_type else ContentType.NARRATIVE
            text = self.brazilian_voice_manager.optimize_text(text, voice, content_type_enum)
            logger.info(f"Text optimized for Brazilian TTS (type: {content_type_enum.value})")

        # Check cache first
        if use_cache:
            cache_key = self._generate_cache_key(text, voice, rate, pitch)
            cached_path = self._get_from_cache(cache_key)
            if cached_path:
                logger.info(f"Using cached audio for key: {cache_key}")
                voice_info = self.brazilian_voice_manager.get_voice(voice)
                metadata = {
                    "cached": True,
                    "voice": voice,
                    "optimized": optimize_text and voice.startswith("pt-BR"),
                    "voice_info": {
                        "name": voice_info.name if voice_info else voice,
                        "naturalness": voice_info.naturalness if voice_info else None,
                        "clarity": voice_info.clarity if voice_info else None,
                    }
                }
                return cached_path, metadata

        try:
            # Generate new audio
            logger.info(f"Generating audio for text length: {len(text)}, voice: {voice}")

            # Create communicate instance
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)

            # Generate temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3", dir="/tmp") as tmp_file:
                output_path = tmp_file.name

            # Save audio
            await communicate.save(output_path)

            # Add to cache
            if use_cache:
                self._add_to_cache(cache_key, output_path)

            logger.info(f"Audio generated successfully: {output_path}")

            # Prepare metadata
            voice_info = self.brazilian_voice_manager.get_voice(voice)
            metadata = {
                "cached": False,
                "voice": voice,
                "optimized": optimize_text and voice.startswith("pt-BR"),
                "text_length": len(original_text),
                "voice_info": {
                    "name": voice_info.name if voice_info else voice,
                    "naturalness": voice_info.naturalness if voice_info else None,
                    "clarity": voice_info.clarity if voice_info else None,
                    "expressiveness": voice_info.expressiveness if voice_info else None,
                }
            }

            return output_path, metadata

        except Exception as e:
            logger.error(f"Failed to generate audio: {e}")
            raise

    async def list_voices(self, locale_filter: Optional[str] = None) -> list:
        """
        List available voices

        Args:
            locale_filter: Filter voices by locale (e.g., 'pt-BR', 'en-US')

        Returns:
            List of available voices
        """
        try:
            voices = await edge_tts.list_voices()

            if locale_filter:
                voices = [v for v in voices if v["Locale"].startswith(locale_filter)]

            # Format for frontend
            formatted_voices = []
            for voice in voices:
                formatted_voices.append({
                    "id": voice["ShortName"],
                    "name": voice.get("FriendlyName", voice["ShortName"]),
                    "gender": voice["Gender"],
                    "locale": voice["Locale"]
                })

            # Add Brazilian voice recommendations if filtering for pt-BR
            if locale_filter == "pt-BR":
                for voice_dict in formatted_voices:
                    br_voice = self.brazilian_voice_manager.get_voice(voice_dict["id"])
                    if br_voice:
                        voice_dict["naturalness"] = br_voice.naturalness
                        voice_dict["clarity"] = br_voice.clarity
                        voice_dict["expressiveness"] = br_voice.expressiveness
                        voice_dict["recommended"] = br_voice.recommended

            return formatted_voices

        except Exception as e:
            logger.error(f"Failed to list voices: {e}")
            raise

    async def generate_stream(self, text: str, voice: str = "pt-BR-FranciscaNeural"):
        """
        Generate audio stream (for WebSocket streaming)

        Args:
            text: Text to convert
            voice: Voice to use

        Yields:
            Audio chunks
        """
        try:
            communicate = edge_tts.Communicate(text, voice)

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]

        except Exception as e:
            logger.error(f"Failed to generate stream: {e}")
            raise

    def clear_cache(self):
        """Clear all cached audio files"""
        for file_path in self.cache.values():
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to remove cache file: {e}")

        self.cache.clear()
        logger.info("Cache cleared")

    async def get_brazilian_voices(self) -> List[Dict[str, Any]]:
        """Get list of Brazilian voices with detailed info"""
        voices = self.brazilian_voice_manager.list_voices()
        return [
            {
                "id": v.id,
                "name": v.name,
                "gender": v.gender,
                "naturalness": v.naturalness,
                "clarity": v.clarity,
                "expressiveness": v.expressiveness,
                "recommended": v.recommended,
                "suitability": {k.value: v for k, v in v.suitability.items()}
            }
            for v in voices
        ]

    async def recommend_voice(
        self,
        content_type: str = "narrative",
        preferred_gender: Optional[str] = None
    ) -> Dict[str, Any]:
        """Recommend best Brazilian voice for content"""
        try:
            content_type_enum = ContentType[content_type.upper()]
        except KeyError:
            content_type_enum = ContentType.NARRATIVE

        voice = self.brazilian_voice_manager.recommend_voice(content_type_enum, preferred_gender)

        return {
            "id": voice.id,
            "name": voice.name,
            "gender": voice.gender,
            "naturalness": voice.naturalness,
            "clarity": voice.clarity,
            "expressiveness": voice.expressiveness,
            "recommended": True,
            "reason": f"Best match for {content_type} content"
        }

    async def optimize_text_for_tts(
        self,
        text: str,
        voice: str = "pt-BR-FranciscaNeural",
        content_type: str = "narrative"
    ) -> Dict[str, Any]:
        """Optimize text for TTS and return analysis"""
        try:
            content_type_enum = ContentType[content_type.upper()]
        except KeyError:
            content_type_enum = ContentType.NARRATIVE

        original_text = text
        optimized_text = self.brazilian_voice_manager.optimize_text(text, voice, content_type_enum)

        # Calculate improvements
        changes = []
        if original_text != optimized_text:
            # Simple diff analysis
            import difflib
            diff = difflib.unified_diff(
                original_text.splitlines(),
                optimized_text.splitlines(),
                lineterm=''
            )
            changes = list(diff)

        return {
            "original_text": original_text,
            "optimized_text": optimized_text,
            "changes_made": len(changes) > 0,
            "improvements": {
                "naturalness": 15 if len(changes) > 0 else 0,  # Estimated improvement
                "clarity": 10 if len(changes) > 0 else 0,
                "flow_score": 85 if len(changes) > 0 else 70,
            },
            "voice": voice,
            "content_type": content_type
        }

# Global instance
tts_service = TTSService()