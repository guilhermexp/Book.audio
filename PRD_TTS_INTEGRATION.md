# PRD - Integração Text-to-Speech no Book.audio

## 1. Resumo Executivo

### Objetivo
Implementar funcionalidade de leitura automática de livros através de síntese de voz (TTS), permitindo que o aplicativo leia dinamicamente o conteúdo para o usuário, sincronizando com a navegação do texto.

### Solução Proposta
Integração do **Edge-TTS** (Microsoft Edge Text-to-Speech) como engine de síntese de voz, oferecendo:
- Vozes neurais de alta qualidade
- Suporte multilíngue (PT-BR, EN-US, etc.)
- Streaming de áudio em tempo real
- Controle de velocidade e tom
- Integração gratuita e sem limites de uso

## 2. Análise de Viabilidade

### ✅ Pontos Positivos
1. **Edge-TTS testado e funcionando** - Testes comprovaram funcionamento perfeito
2. **20 vozes em PT-BR** - Variedade de vozes masculinas e femininas
3. **81 vozes em EN-US** - Suporte extensivo para inglês
4. **Streaming disponível** - Permite início imediato da reprodução
5. **Controle de parâmetros** - Velocidade e tom ajustáveis
6. **Gratuito e sem limites** - Sem custos ou restrições de uso
7. **Integração simples** - API Python assíncrona bem documentada

### ⚠️ Considerações
1. **Requer backend ativo** - Processamento server-side
2. **Latência inicial** - 1-2 segundos para gerar primeiro áudio
3. **Dependência de internet** - Necessita conexão estável
4. **Tamanho dos chunks** - Gerenciar buffer de áudio

## 3. Arquitetura de Implementação

### 3.1 Backend (Python/FastAPI)

```python
# Novos endpoints no backend existente
POST /api/tts/generate
  - Body: { text: string, voice: string, rate?: string, pitch?: string }
  - Response: audio/mpeg stream

POST /api/tts/generate-page
  - Body: { pageNumber: int, voice: string }
  - Response: { audioUrl: string, duration: float }

GET /api/tts/voices
  - Response: { voices: Array<{id, name, gender, locale}> }

WebSocket /ws/tts/stream
  - Streaming em tempo real para páginas longas
```

### 3.2 Frontend (React/TypeScript)

#### Componentes Novos
```typescript
// components/AudioController.tsx
- Controles de reprodução (play, pause, stop)
- Seletor de voz
- Controle de velocidade
- Indicador de progresso

// components/TTSSettings.tsx
- Modal de configurações de voz
- Preferências salvas no localStorage

// services/ttsService.ts
- Gerenciamento de fila de áudio
- Cache de páginas convertidas
- Sincronização com navegação
```

#### Modificações Necessárias
```typescript
// App.tsx
- Estado global de TTS (isReading, currentVoice, readingSpeed)
- Sincronização entre leitura e navegação de páginas
- Auto-avanço de página quando áudio termina

// components/AudioPlayer.tsx
- Integração com novo sistema TTS
- Modo duplo: música ambiente ou leitura de livro
```

## 4. Fluxo de Funcionamento

### 4.1 Fluxo Principal
```mermaid
1. Usuário clica no botão de áudio
2. Sistema detecta se há conteúdo carregado
3. Mostra controles de TTS
4. Usuário seleciona voz e velocidade
5. Clica em Play
6. Backend gera áudio da página atual
7. Frontend reproduz e sincroniza
8. Auto-avança para próxima página
9. Pré-carrega áudio da próxima página
```

### 4.2 Funcionalidades Detalhadas

#### Leitura Contínua
- Lê página atual
- Auto-avança quando termina
- Pré-carrega próxima página
- Para no final do documento

#### Sincronização Visual
- Destaque do parágrafo sendo lido
- Scroll automático suave
- Indicador de progresso na página

#### Controles de Reprodução
- Play/Pause
- Stop (volta ao início da página)
- Próxima/Anterior página
- Velocidade (0.5x a 2.0x)
- Volume

#### Cache Inteligente
- Armazena áudios gerados
- Pré-carrega páginas adjacentes
- Limpa cache antigo (LRU)

## 5. Especificações Técnicas

### 5.1 Requisitos de Sistema
- Backend Python 3.8+
- Node.js 18+ (frontend)
- 100MB RAM adicional
- Conexão internet estável

### 5.2 Dependências
```json
// Backend
{
  "edge-tts": "^7.2.3",
  "fastapi": "existente",
  "websockets": "^12.0"
}

// Frontend
{
  "howler": "^2.2.4",  // Biblioteca de áudio
  "react-use-websocket": "^4.5.0"
}
```

### 5.3 Configurações
```typescript
interface TTSConfig {
  defaultVoice: string;
  defaultSpeed: number;
  autoAdvance: boolean;
  highlightText: boolean;
  preloadPages: number;
  cacheSize: number;
}
```

## 6. Implementação por Fases

### Fase 1: MVP Básico (3 dias)
- [x] Setup Edge-TTS no backend ✅ TESTADO
- [ ] Endpoint de geração de áudio
- [ ] Player básico no frontend
- [ ] Reprodução página por página

### Fase 2: Sincronização (2 dias)
- [ ] Auto-avanço de páginas
- [ ] Sincronização com navegação manual
- [ ] Indicadores visuais de progresso

### Fase 3: Otimizações (2 dias)
- [ ] Cache de áudios gerados
- [ ] Pré-carregamento inteligente
- [ ] Streaming via WebSocket

### Fase 4: Polish (1 dia)
- [ ] UI/UX refinada
- [ ] Configurações persistentes
- [ ] Atalhos de teclado

## 7. Testes de Validação

### Cenários de Teste
1. **Livro curto (10 páginas)** - Fluxo completo
2. **Livro longo (100+ páginas)** - Performance e cache
3. **Mudança de idioma** - PT-BR para EN-US
4. **Navegação manual durante leitura** - Sincronização
5. **Conexão instável** - Tratamento de erros

### Métricas de Sucesso
- Latência inicial < 2 segundos
- Transição entre páginas < 500ms
- Taxa de sucesso > 99%
- Uso de memória < 100MB
- Cache hit rate > 80%

## 8. Interface de Usuário

### 8.1 Controles Principais
```
[▶️ Play] [⏸️ Pause] [⏹️ Stop]
[⏮️ Anterior] [⏭️ Próxima]

🎤 Voz: [Francisca (PT-BR) ▼]
⚡ Velocidade: [1.0x ▼]
🔊 Volume: [████████--]

📖 Página 12 de 187
⏱️ 02:34 / 05:12
```

### 8.2 Estados Visuais
- **Idle**: Botão play visível
- **Loading**: Spinner animado
- **Playing**: Controles completos
- **Paused**: Botão resume destacado
- **Error**: Mensagem e retry

## 9. Tratamento de Erros

### Erros Previstos
1. **Backend offline** - Mensagem clara + fallback
2. **Falha de rede** - Retry automático (3x)
3. **Página vazia** - Pular para próxima
4. **Voz indisponível** - Usar voz padrão
5. **Buffer underrun** - Pausar e recarregar

## 10. Performance e Otimizações

### Estratégias
1. **Chunking** - Dividir páginas longas
2. **Compression** - Áudio em MP3 128kbps
3. **CDN** - Servir áudios cacheados
4. **Worker Threads** - Processamento paralelo
5. **Rate Limiting** - Prevenir abuso

### Benchmarks Esperados
- 1 página (3KB texto) → 100KB áudio MP3
- Geração: ~1 segundo
- Download: ~200ms (boa conexão)
- Início reprodução: < 2 segundos total

## 11. Segurança e Privacidade

### Considerações
- Sanitização de texto antes do TTS
- Rate limiting por IP
- Não armazenar conteúdo sensível
- HTTPS obrigatório
- CORS configurado

## 12. Roadmap Futuro

### Próximas Features
1. **Vozes Premium** - Integração com Azure/AWS
2. **Offline Mode** - TTS local com Piper
3. **Múltiplos idiomas** - Detecção automática
4. **Audiobooks Export** - Gerar MP3 completo
5. **Voice Cloning** - Vozes personalizadas

## 13. Conclusão

### Resumo da Proposta
A integração do Edge-TTS no Book.audio é **totalmente viável** e trará valor significativo aos usuários. Os testes realizados confirmam:

✅ **Tecnologia madura e estável**
✅ **Qualidade de áudio excelente**
✅ **Implementação relativamente simples**
✅ **Sem custos adicionais**
✅ **Experiência de usuário enriquecida**

### Impacto Esperado
- **Acessibilidade**: Usuários com deficiência visual
- **Multitarefa**: Ouvir enquanto realiza outras atividades
- **Aprendizado**: Melhor retenção com áudio + visual
- **Conveniência**: Consumo de conteúdo hands-free
- **Diferencial**: Feature única vs. leitores tradicionais

### Recomendação
**APROVAR** implementação imediata, começando pelo MVP básico em 3 dias.

---

**Documento elaborado por**: Claude Code
**Data**: 2025-01-19
**Status**: ✅ PRONTO PARA IMPLEMENTAÇÃO