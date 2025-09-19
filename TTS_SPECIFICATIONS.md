# 📋 Especificações Técnicas - Integração TTS

## 🎯 Visão Geral

Sistema de Text-to-Speech integrado ao Book.audio usando Edge-TTS para leitura dinâmica de livros com sincronização visual e controles avançados.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)               │
│  ┌─────────────┐  ┌──────────────┐             │
│  │AudioController│  │TTSSettings   │             │
│  └──────┬──────┘  └──────┬───────┘             │
│         │                 │                      │
│  ┌──────▼─────────────────▼──────┐             │
│  │      TTSService (TypeScript)   │             │
│  └──────────────┬─────────────────┘             │
└─────────────────┼───────────────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────────────────┐
│              Backend (FastAPI)                   │
│  ┌────────────────────────────────┐            │
│  │   Edge-TTS Integration         │            │
│  │  ┌──────────┐ ┌──────────┐    │            │
│  │  │Generator  │ │Cache     │    │            │
│  │  └──────────┘ └──────────┘    │            │
│  └────────────────────────────────┘            │
└──────────────────────────────────────────────────┘
```

## 📦 Componentes Principais

### Backend Components

#### 1. TTS Generator Service
```python
class TTSGenerator:
    """Serviço principal de geração de áudio"""

    async def generate_audio(
        text: str,
        voice: str = "pt-BR-FranciscaNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz"
    ) -> bytes:
        """Gera áudio MP3 a partir do texto"""

    async def generate_page(
        page_content: str,
        page_number: int,
        settings: TTSSettings
    ) -> AudioResponse:
        """Gera áudio para uma página específica"""

    async def stream_audio(
        text: str,
        voice: str
    ) -> AsyncGenerator[bytes, None]:
        """Stream de áudio em chunks"""
```

#### 2. Audio Cache Manager
```python
class AudioCacheManager:
    """Gerenciamento de cache LRU para áudios"""

    def __init__(self, max_size: int = 50):
        self.cache: OrderedDict = OrderedDict()
        self.max_size = max_size

    def get(self, key: str) -> Optional[bytes]:
        """Recupera áudio do cache"""

    def set(self, key: str, audio: bytes) -> None:
        """Armazena áudio no cache"""

    def generate_key(
        text_hash: str,
        voice: str,
        rate: str,
        pitch: str
    ) -> str:
        """Gera chave única para cache"""
```

#### 3. API Endpoints
```python
# Rotas FastAPI
@app.post("/api/tts/generate")
async def generate_tts(request: TTSRequest) -> FileResponse:
    """Gera áudio para texto fornecido"""

@app.post("/api/tts/generate-page")
async def generate_page_audio(request: PageRequest) -> AudioResponse:
    """Gera áudio para página específica do livro"""

@app.get("/api/tts/voices")
async def list_voices() -> VoicesResponse:
    """Lista vozes disponíveis por idioma"""

@app.websocket("/ws/tts/stream")
async def stream_tts(websocket: WebSocket):
    """WebSocket para streaming de áudio"""
```

### Frontend Components

#### 1. AudioController Component
```typescript
interface AudioControllerProps {
  isPlaying: boolean;
  currentPage: number;
  totalPages: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
}

const AudioController: React.FC<AudioControllerProps> = ({...}) => {
  // Controles de reprodução
  // Seletor de voz
  // Controle de velocidade
  // Barra de progresso
}
```

#### 2. TTS Service
```typescript
class TTSService {
  private audioQueue: AudioBuffer[] = [];
  private currentAudio: Howl | null = null;
  private preloadBuffer: Map<number, ArrayBuffer> = new Map();

  async generateAudio(
    text: string,
    voice: string,
    options?: TTSOptions
  ): Promise<ArrayBuffer> {
    // Gera ou recupera do cache
  }

  async preloadPages(
    currentPage: number,
    totalPages: number,
    range: number = 2
  ): Promise<void> {
    // Pré-carrega páginas adjacentes
  }

  play(): void {
    // Inicia reprodução
  }

  pause(): void {
    // Pausa reprodução
  }

  stop(): void {
    // Para e reseta reprodução
  }

  onPageEnd(callback: () => void): void {
    // Callback quando página termina
  }
}
```

#### 3. Sync Manager
```typescript
class ReadingSyncManager {
  private currentPosition: number = 0;
  private highlightedElement: HTMLElement | null = null;

  syncWithAudio(timestamp: number): void {
    // Sincroniza posição do texto com áudio
  }

  highlightCurrentSentence(): void {
    // Destaca frase sendo lida
  }

  autoScroll(): void {
    // Scroll automático suave
  }
}
```

## 🔧 Configurações e Parâmetros

### Configurações de Voz
```typescript
interface VoiceSettings {
  voice: string;           // ID da voz (ex: "pt-BR-FranciscaNeural")
  rate: number;           // Velocidade (-50 a +100)
  pitch: number;          // Tom (-50 a +50)
  volume: number;         // Volume (0 a 100)
}
```

### Configurações de Reprodução
```typescript
interface PlaybackSettings {
  autoAdvance: boolean;    // Auto-avançar páginas
  highlightText: boolean;  // Destacar texto sendo lido
  scrollSync: boolean;     // Sincronizar scroll
  preloadCount: number;    // Número de páginas para pré-carregar
}
```

### Configurações de Cache
```typescript
interface CacheSettings {
  maxSize: number;         // Tamanho máximo do cache (MB)
  ttl: number;            // Tempo de vida (minutos)
  strategy: 'LRU' | 'LFU'; // Estratégia de cache
}
```

## 📊 Fluxos de Dados

### Fluxo de Geração de Áudio
```
1. Frontend solicita áudio da página
   ↓
2. Backend verifica cache
   ↓
3. Se não existe no cache:
   a. Gera áudio com Edge-TTS
   b. Armazena no cache
   ↓
4. Retorna áudio ao frontend
   ↓
5. Frontend reproduz e sincroniza
```

### Fluxo de Pré-carregamento
```
1. Página atual sendo reproduzida
   ↓
2. Sistema identifica páginas adjacentes
   ↓
3. Verifica quais não estão em cache
   ↓
4. Solicita geração em background
   ↓
5. Armazena no buffer local
```

## 🎨 Interface de Usuário

### Layout dos Controles
```
┌─────────────────────────────────────┐
│  ⏮️  ⏯️  ⏭️  ⏹️  │ 🎤 Francisca ▼ │
├─────────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  02:45 ────────────────── 08:32     │
├─────────────────────────────────────┤
│  ⚡ 1.0x  🔊 ████████── │ ⚙️       │
└─────────────────────────────────────┘
```

### Estados Visuais
- **Playing**: Ícone pause, barra progresso animada
- **Paused**: Ícone play, barra estática
- **Loading**: Spinner no botão, barra indeterminada
- **Error**: Ícone de alerta, mensagem de erro

## 🔌 Integração com Sistema Existente

### Modificações em App.tsx
```typescript
// Novos estados
const [ttsState, setTTSState] = useState<TTSState>({
  isReading: false,
  currentVoice: 'pt-BR-FranciscaNeural',
  readingSpeed: 1.0,
  autoAdvance: true
});

// Nova lógica de sincronização
useEffect(() => {
  if (ttsState.isReading && audioEnded) {
    goToNextPage();
    ttsService.playPage(currentPage + 1);
  }
}, [audioEnded, ttsState.isReading]);
```

### Modificações em AudioPlayer.tsx
```typescript
// Modo dual: ambiente ou TTS
enum AudioMode {
  AMBIENT = 'ambient',
  TTS = 'tts'
}

// Switch entre modos
const handleModeSwitch = (mode: AudioMode) => {
  if (mode === AudioMode.TTS) {
    ambientMusic.pause();
    ttsService.resume();
  } else {
    ttsService.pause();
    ambientMusic.resume();
  }
};
```

## 📈 Métricas e Monitoramento

### Métricas de Performance
```typescript
interface PerformanceMetrics {
  generationTime: number;      // Tempo para gerar áudio
  cacheHitRate: number;        // Taxa de acerto do cache
  averageLatency: number;      // Latência média
  bufferedPages: number;       // Páginas em buffer
  memoryUsage: number;         // Uso de memória (MB)
}
```

### Logs de Eventos
```typescript
enum TTSEvent {
  GENERATION_START = 'tts:generation:start',
  GENERATION_COMPLETE = 'tts:generation:complete',
  PLAYBACK_START = 'tts:playback:start',
  PLAYBACK_END = 'tts:playback:end',
  PAGE_CHANGE = 'tts:page:change',
  ERROR = 'tts:error'
}
```

## 🚀 Otimizações

### 1. Chunking para Textos Longos
```python
def chunk_text(text: str, max_length: int = 5000) -> List[str]:
    """Divide texto em chunks menores"""
    sentences = text.split('.')
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) > max_length:
            chunks.append(current_chunk)
            current_chunk = sentence
        else:
            current_chunk += sentence + "."

    return chunks
```

### 2. Compressão de Áudio
```python
def compress_audio(audio_bytes: bytes) -> bytes:
    """Comprime áudio para reduzir tamanho"""
    # MP3 128kbps para balance qualidade/tamanho
    return compress_mp3(audio_bytes, bitrate=128)
```

### 3. Processamento Paralelo
```python
async def generate_multiple_pages(
    pages: List[str],
    voice: str
) -> List[bytes]:
    """Gera múltiplas páginas em paralelo"""
    tasks = [
        generate_audio(page, voice)
        for page in pages
    ]
    return await asyncio.gather(*tasks)
```

## 🛡️ Tratamento de Erros

### Erros Backend
```python
class TTSError(Exception):
    """Erro base para TTS"""

class VoiceNotFoundError(TTSError):
    """Voz solicitada não encontrada"""

class GenerationFailedError(TTSError):
    """Falha na geração de áudio"""

class CacheLimitExceededError(TTSError):
    """Limite de cache excedido"""
```

### Erros Frontend
```typescript
enum TTSErrorType {
  NETWORK_ERROR = 'network_error',
  GENERATION_FAILED = 'generation_failed',
  PLAYBACK_FAILED = 'playback_failed',
  VOICE_UNAVAILABLE = 'voice_unavailable'
}

interface TTSError {
  type: TTSErrorType;
  message: string;
  retryable: boolean;
}
```

## 📝 Testes

### Testes Unitários
```typescript
describe('TTSService', () => {
  it('should generate audio for text', async () => {
    const audio = await ttsService.generateAudio('Test text', 'pt-BR');
    expect(audio).toBeDefined();
  });

  it('should cache generated audio', async () => {
    const audio1 = await ttsService.generateAudio('Test', 'pt-BR');
    const audio2 = await ttsService.generateAudio('Test', 'pt-BR');
    expect(audio1).toBe(audio2); // Same reference = cached
  });

  it('should handle page transitions', async () => {
    ttsService.onPageEnd(() => nextPageCalled = true);
    await ttsService.playPage(1);
    // Wait for audio to end
    expect(nextPageCalled).toBe(true);
  });
});
```

### Testes de Integração
```python
async def test_full_flow():
    """Testa fluxo completo de geração e reprodução"""
    # 1. Gerar áudio
    response = await client.post("/api/tts/generate", json={
        "text": "Teste de integração",
        "voice": "pt-BR-FranciscaNeural"
    })
    assert response.status_code == 200

    # 2. Verificar cache
    cache_key = generate_cache_key(...)
    cached = cache.get(cache_key)
    assert cached is not None

    # 3. Streaming
    async with websockets.connect("ws://localhost:8000/ws/tts/stream") as ws:
        await ws.send(json.dumps({"text": "Stream test"}))
        chunk = await ws.recv()
        assert len(chunk) > 0
```

## 🎯 Conclusão

Esta especificação técnica detalha todos os aspectos necessários para implementar o sistema TTS no Book.audio. A arquitetura é:

✅ **Modular** - Componentes independentes e reutilizáveis
✅ **Escalável** - Cache e pré-carregamento otimizam performance
✅ **Resiliente** - Tratamento robusto de erros
✅ **Testável** - Cobertura completa de testes
✅ **Performante** - Otimizações para baixa latência

**Tempo estimado de implementação**: 8 dias úteis
**Complexidade**: Média-Alta
**Risco técnico**: Baixo (tecnologia testada e validada)

---
**Documento técnico elaborado por**: Claude Code
**Data**: 2025-01-19
**Versão**: 1.0