# PRD - Integração MarkItDown no Book.audio

## 1. Visão Geral

### Objetivo
Substituir a biblioteca pdf.js limitada por uma solução robusta de conversão de documentos usando MarkItDown, mantendo a estrutura visual existente e expandindo o suporte para múltiplos formatos de arquivo.

### Problema Atual
- pdf.js é limitado e não estrutura o conteúdo adequadamente
- Extração de texto perde formatação e contexto
- Conteúdo não otimizado para processamento por IA
- Suporte apenas para PDF

### Solução Proposta
Implementar MarkItDown como serviço de conversão backend que:
- Converte documentos em Markdown estruturado
- Preserva formatação, tabelas, listas e hierarquia
- Otimiza conteúdo para processamento por LLMs
- Suporta múltiplos formatos (PDF, YouTube, ePub, Word, etc.)

## 2. Requisitos Funcionais

### 2.1 Requisitos Principais
- **Manter estrutura visual existente**: O BookView deve continuar funcionando como está
- **Garantir visualização de todo conteúdo**: Todo conteúdo convertido deve aparecer formatado no frontend

### 2.2 Formatos Suportados (Ordem de Implementação)
1. **PDF** (MVP - fase inicial de testes)
2. **YouTube URLs** (transcrições de vídeos)
3. **ePub** (formato nativo de ebooks)
4. **Word/PowerPoint** (documentos office)
5. **Imagens com OCR** (fase futura)
6. **Áudio com transcrição** (fase futura)

### 2.3 Fluxo de Conversão
1. Usuário faz upload do arquivo ou insere URL
2. Frontend envia arquivo para backend
3. Backend processa com MarkItDown
4. Retorna Markdown estruturado
5. Frontend renderiza Markdown no BookView existente
6. Conteúdo fica disponível para features de IA

## 3. Arquitetura Técnica

### 3.1 Backend (Python/FastAPI)
```
backend/
├── main.py                 # FastAPI server
├── converters/
│   ├── __init__.py
│   ├── pdf_converter.py    # PDF processing
│   ├── youtube_converter.py # YouTube processing
│   └── epub_converter.py   # ePub processing
├── models/
│   └── schemas.py          # Request/Response models
├── requirements.txt        # Dependencies
└── tests/
    └── test_converters.py  # Unit tests
```

### 3.2 Modificações no Frontend
- Adaptar `handleFileChange` para chamar API
- Implementar parser de Markdown para HTML
- Adicionar input para YouTube URLs
- Manter paginação baseada em seções do Markdown

### 3.3 API Endpoints
```
POST /api/convert/file
  - Body: multipart/form-data com arquivo
  - Response: { content: string (markdown), metadata: object }

POST /api/convert/youtube
  - Body: { url: string }
  - Response: { content: string (markdown), metadata: object }

GET /api/health
  - Response: { status: "healthy" }
```

## 4. Fases de Implementação

### Fase 1: Setup Inicial ✅
- [x] Criar estrutura do backend
- [x] Instalar MarkItDown
- [x] Configurar FastAPI com CORS

### Fase 2: Conversão PDF
- [ ] Implementar endpoint de upload
- [ ] Processar PDF com MarkItDown
- [ ] Retornar Markdown estruturado
- [ ] **Teste**: Converter 3 PDFs diferentes

### Fase 3: Integração Frontend
- [ ] Modificar handleFileChange
- [ ] Implementar renderização de Markdown
- [ ] Manter sistema de paginação
- [ ] **Teste**: Visualizar PDF convertido

### Fase 4: YouTube Support
- [ ] Adicionar input para URLs
- [ ] Implementar endpoint YouTube
- [ ] **Teste**: Transcrever vídeo educacional

### Fase 5: ePub Support
- [ ] Implementar endpoint ePub
- [ ] Adaptar navegação por capítulos
- [ ] **Teste**: Carregar ebook completo

## 5. Critérios de Sucesso

### Testes de Validação
1. **PDF Simples**: Documento com texto básico
2. **PDF Complexo**: Com tabelas, imagens e formatação
3. **YouTube Educacional**: Vídeo de 10+ minutos
4. **ePub Completo**: Livro com múltiplos capítulos

### Métricas
- Tempo de conversão < 5 segundos para PDFs até 100 páginas
- Preservação de 95%+ da estrutura do documento
- Renderização correta no BookView existente
- Melhoria na qualidade dos resumos da IA

## 6. Considerações Técnicas

### Performance
- Cache de documentos convertidos
- Processamento assíncrono para arquivos grandes
- Limite de tamanho: 50MB inicialmente

### Segurança
- Validação de tipos de arquivo
- Sanitização de conteúdo Markdown
- Rate limiting na API

### UX
- Indicador de progresso durante conversão
- Mensagens de erro claras
- Preview do conteúdo antes de confirmar

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| MarkItDown falha com PDF específico | Média | Alto | Fallback para pdf.js |
| Latência alta na conversão | Baixa | Médio | Implementar queue de processamento |
| Markdown mal formatado | Média | Alto | Sanitização e validação robusta |

## 8. Cronograma Estimado

- **Semana 1**: Backend setup + PDF support
- **Semana 2**: Frontend integration + testes
- **Semana 3**: YouTube + ePub support
- **Semana 4**: Polish + edge cases

## 9. Definição de Pronto

- [ ] Todos os testes passando
- [ ] Documentação da API completa
- [ ] Frontend mantendo layout atual
- [ ] Conteúdo convertido 100% visível
- [ ] Features de IA funcionando com novo conteúdo