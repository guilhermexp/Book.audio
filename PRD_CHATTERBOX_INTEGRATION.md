# PRD - Integração do Chatterbox Real no Book.audio

## 🎯 Objetivo
Integrar o modelo Chatterbox Multilingual TTS real (ResembleAI) que está instalado em `/Users/guilhermevarela/Documents/Projetos/Chatterbox-Multilingual-TTS` ao sistema Book.audio, removendo completamente o Edge-TTS e qualquer simulador.

## ❌ O que DELETAR
1. **Remover Edge-TTS completamente**
   - Arquivo: `backend/tts_service.py` (Edge-TTS)
   - Arquivo: `backend/chatterbox_tts_simulator.py` (Simulador)
   - Arquivo: `backend/advanced_tts_service.py` (Edge-TTS melhorado)
   - Qualquer referência ao Edge-TTS no código

## ✅ O que IMPLEMENTAR

### 1. Criar Serviço Chatterbox Real
**Arquivo**: `backend/chatterbox_real_service.py`

**Funcionalidades**:
- Importar `ChatterboxMultilingualTTS` do projeto existente
- Usar o modelo real instalado localmente
- Suportar português brasileiro (pt)
- Implementar análise contextual completa
- Gerar áudio de alta qualidade

**Requisitos técnicos**:
```python
import sys
sys.path.append('/Users/guilhermevarela/Documents/Projetos/Chatterbox-Multilingual-TTS')
from src.chatterbox.mtl_tts import ChatterboxMultilingualTTS
```

### 2. Atualizar Backend API
**Arquivo**: `backend/main.py`

**Mudanças necessárias**:
- Remover TODAS as importações de Edge-TTS
- Importar apenas `chatterbox_real_service`
- Manter endpoints existentes mas usar Chatterbox real
- `/api/tts/generate-contextual` - Usar Chatterbox real
- `/api/tts/status` - Retornar que está usando Chatterbox real

### 3. Configuração de Voz Brasileira
**Vozes disponíveis**:
- Usar áudio de referência brasileiro do Chatterbox
- Path: Verificar em `LANGUAGE_CONFIG["pt"]` no app.py
- Implementar clonagem de voz se necessário

### 4. Processamento de Texto

**Análise Contextual** (MANTER):
- Ler texto completo antes de gerar
- Detectar emoções em português
- Identificar diálogos vs narração
- Adicionar pausas naturais

**Parâmetros do Chatterbox**:
- `language`: "pt" (português)
- `exaggeration`: 0.6-0.8 para livros
- `speed`: 1.0 (normal)
- `pitch`: ajustar baseado em contexto

### 5. Sistema de Cache
- Manter cache de áudios gerados
- Usar hash do texto + parâmetros como chave
- Limpar cache antigo automaticamente

## 🚫 NÃO FAZER
1. **NÃO usar Edge-TTS** em lugar nenhum
2. **NÃO criar simuladores** ou fallbacks
3. **NÃO baixar modelos** da internet (usar o local)
4. **NÃO complicar** - integração direta e simples

## 📁 Estrutura Final
```
backend/
├── chatterbox_real_service.py  # Serviço principal do Chatterbox
├── main.py                      # API atualizada
└── requirements.txt             # Dependências necessárias
```

## 🧪 Testes de Validação

### Teste 1: Geração Básica
```bash
curl -X POST http://localhost:8010/api/tts/generate-contextual \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Era uma vez um reino distante onde viviam pessoas felizes.",
    "language": "pt"
  }'
```
**Esperado**: Áudio em português com voz natural do Chatterbox

### Teste 2: Texto com Emoção
```bash
curl -X POST http://localhost:8010/api/tts/generate-contextual \
  -H "Content-Type: application/json" \
  -d '{
    "text": "SOCORRO! gritou Maria. Calma, disse João tranquilamente.",
    "language": "pt"
  }'
```
**Esperado**: Variação de emoção entre grito e fala calma

### Teste 3: Status do Sistema
```bash
curl http://localhost:8010/api/tts/status
```
**Esperado**:
```json
{
  "engine": "chatterbox-real",
  "model_path": "/Users/guilhermevarela/Documents/Projetos/Chatterbox-Multilingual-TTS",
  "language_support": ["pt", "en", "es", ...],
  "status": "operational"
}
```

## 📝 Critérios de Sucesso
1. ✅ Áudio gerado é do Chatterbox real, não Edge-TTS
2. ✅ Qualidade superior ao Edge-TTS
3. ✅ Suporta português brasileiro nativamente
4. ✅ Análise contextual funcionando
5. ✅ Sem dependência de APIs externas
6. ✅ Usando modelo local instalado

## ⚠️ Pontos Críticos
1. **Path do modelo**: `/Users/guilhermevarela/Documents/Projetos/Chatterbox-Multilingual-TTS`
2. **Import correto**: `from src.chatterbox.mtl_tts import ChatterboxMultilingualTTS`
3. **Língua**: usar "pt" para português
4. **Device**: usar "cuda" se disponível, senão "cpu"

## 🚀 Ordem de Implementação
1. Criar `chatterbox_real_service.py`
2. Testar importação do modelo
3. Atualizar `main.py`
4. Deletar arquivos antigos
5. Testar geração de áudio
6. Validar qualidade

## 🎯 Resultado Final Esperado
- Sistema usando APENAS Chatterbox real
- Qualidade de áudio profissional
- Suporte nativo para português
- Sem simuladores ou fallbacks
- Modelo rodando localmente