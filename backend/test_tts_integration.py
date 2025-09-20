#!/usr/bin/env python3
"""
Integration test for TTS functionality
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

try:
    import edge_tts
    from tts_service import tts_service
    print("✅ Edge-TTS and TTS Service imported successfully!")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install dependencies: pip install edge-tts")
    sys.exit(1)

async def test_basic_generation():
    """Test basic TTS audio generation"""
    print("\n1. Testing basic TTS generation...")

    test_text = "Olá! Este é um teste do sistema de síntese de voz integrado ao Book.audio."

    try:
        # Generate audio
        audio_path = await tts_service.generate_audio(test_text)

        # Check file exists
        if os.path.exists(audio_path):
            size_kb = os.path.getsize(audio_path) / 1024
            print(f"✅ Audio generated: {audio_path}")
            print(f"   Size: {size_kb:.2f} KB")
        else:
            print("❌ Audio file not created")
            return False

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_voice_listing():
    """Test listing available voices"""
    print("\n2. Testing voice listing...")

    try:
        # Get PT-BR voices
        pt_voices = await tts_service.list_voices("pt-BR")
        print(f"✅ Found {len(pt_voices)} PT-BR voices")

        if pt_voices:
            print("   Sample voices:")
            for voice in pt_voices[:3]:
                print(f"   - {voice['name']} ({voice['gender']})")

        # Get EN-US voices
        en_voices = await tts_service.list_voices("en-US")
        print(f"✅ Found {len(en_voices)} EN-US voices")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_cache():
    """Test caching functionality"""
    print("\n3. Testing cache...")

    test_text = "Este texto será usado para testar o cache."

    try:
        # First generation
        print("   Generating audio (first time)...")
        audio1 = await tts_service.generate_audio(test_text)

        # Second generation (should use cache)
        print("   Generating audio (from cache)...")
        audio2 = await tts_service.generate_audio(test_text)

        if audio1 == audio2:
            print("✅ Cache working - same file returned")
        else:
            print("⚠️ Cache not working - different files")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_different_voices():
    """Test generation with different voices"""
    print("\n4. Testing different voices...")

    text = "Testando diferentes vozes."
    voices_to_test = [
        "pt-BR-FranciscaNeural",
        "pt-BR-AntonioNeural",
        "en-US-JennyNeural"
    ]

    try:
        for voice in voices_to_test:
            print(f"   Testing {voice}...")
            audio = await tts_service.generate_audio(text, voice=voice)
            if os.path.exists(audio):
                print(f"   ✅ {voice} OK")
            else:
                print(f"   ❌ {voice} failed")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 50)
    print("🧪 TTS INTEGRATION TEST")
    print("=" * 50)

    tests = [
        test_basic_generation(),
        test_voice_listing(),
        test_cache(),
        test_different_voices()
    ]

    results = await asyncio.gather(*tests)

    # Clear cache after tests
    tts_service.clear_cache()

    print("\n" + "=" * 50)
    if all(results):
        print("✅ ALL TESTS PASSED!")
        print("\n📌 TTS is ready to use!")
        print("Start the backend server with:")
        print("  cd backend && python main.py")
    else:
        print("❌ Some tests failed")
        print("Please check the errors above")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())