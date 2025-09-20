# PRD: PDF Page Parity & Rich Page Rendering

## Contexto & Problema
- O app importa PDFs via backend FastAPI com MarkItDown, mas a conversão retorna um markdown contínuo.
- O frontend fatia esse markdown em “páginas” heurísticas, causando mistura de capítulos, perda de títulos em páginas dedicadas e descarte de imagens.
- Usuários esperam que o leitor digital reflita a paginação real do PDF (mesmo número de páginas e ordem) e respeite páginas compostas apenas por títulos ou imagens.

## Objetivos
1. Preservar a estrutura página a página do PDF original, mantendo contagem e ordem idênticas.
2. Exibir conteúdo textual, títulos isolados e imagens em cada página conforme o layout original.
3. Oferecer fallback consistente quando o backend estiver offline, mantendo experiência próxima do fluxo oficial.

## Indicadores de sucesso
- Contagem de páginas exibidas = contagem reportada pelo PDF ≥ 99% dos casos testados.
- Títulos ou páginas vazias no PDF surgem como páginas separadas na UI.
- Imagens presentes no PDF aparecem na página correspondente no leitor.

## Escopo
### Incluído
- Extração paginada de PDFs no backend (texto + imagens em ordem).
- Estrutura de resposta API com páginas individuais e metadados.
- Ajustes no frontend para consumir páginas estruturadas e exibir imagens.
- Persistência temporária ou serialização leve de imagens para servir via HTTP.
- Atualização do fallback `pdf.js` para alinhar interface de dados com o novo formato.

### Fora de escopo
- Reconstrução fiel de tipografia ou layout (fontes, colunas, etc.).
- Conversão com reconhecimento OCR para PDFs com texto rasterizado.
- Paginação idêntica para formatos não-PDF (ePub, DOCX, etc.).

## Requisitos Funcionais
### Backend
- Detectar uploads PDF em `/api/convert/file` e executar extração página a página.
- Retornar JSON com:
  - `pages`: lista ordenada com `{ number, text, html?, images[] }`.
  - `metadata`: inclui `page_count`, `filename`, `content_type`, etc.
- Tratar páginas sem texto preservando entradas vazias com flag `hasContent: false`.
- Converter imagens de página para assets servidos via rota dedicada ou data URL (definir limite de tamanho).
- Limpar arquivos temporários e indexar imagens na cache existente quando aplicável.

### Frontend
- Atualizar `DocumentConverterService` para consumir novo payload e remover fatiamento heurístico.
- Ajustar estado em `App.tsx` para armazenar objetos de página (`text`, `images`, `titleHint`).
- Renderizar imagens dentro do `BookView`, mantendo acessibilidade básica (alt). Se não houver texto, mostrar aviso “Página com título/imagem”.
- Exibir contagem total diretamente do backend (`metadata.page_count`).
- Manter compatibilidade com fallback `pdf.js` abastecendo o mesmo formato de dados.

### Observabilidade
- Logs de backend detalhando páginas extraídas, quantidade de imagens e tempo de processamento por arquivo.
- Mensagens de erro claras quando PDF não puder ser processado.

## Experiência do Usuário
- Sem alteração de layout geral.
- Páginas com títulos isolados aparecem como páginas inteiras (lado esquerdo título, lado direito vazio ou com título replicado).
- Páginas com imagens exibem a imagem renderizada na área de conteúdo.

## Dependências & Ferramentas
- Biblioteca Python para extração estruturada (preferência: PyMuPDF/Fitz pela capacidade de extrair texto por página e imagens com bounding boxes).
- Suporte a imagens: Pillow (se necessário) para salvar/otimizar.
- `pdf.js` já disponível no frontend como fallback.

## Considerações Técnicas
- Formato de resposta JSON deve ser compatível com outros conversores (YouTube, ePub). Podemos versionar o contrato com `format: "pdf-pages"`.
- Necessário limitar tamanho de imagens (ex.: max 1MB) e compressão para evitar tráfego excessivo.
- Cache de TTS deve continuar operando com texto por página.

## Riscos
- PDFs protegidos ou com texto como imagem exigem OCR (fora de escopo). Devemos retornar erro amigável.
- Extração de imagens pode gerar muitos arquivos temporários; limpar agressivamente.
- Bibliotecas como PyMuPDF exigem dependências nativas – garantir instalação no `requirements.txt` e build container.

## Roadmap Resumido
1. Backend: adicionar dependências, criar util de extração paginada, atualizar rota `/api/convert/file`, criar rota para servir imagens.
2. Frontend: atualizar serviços e tipos, ajustar `App.tsx` e `BookView`, tratar fallback `pdf.js`.
3. QA manual com PDFs contendo títulos isolados e imagens (usar amostras fornecidas).

## Aprovação
- Stakeholders: Guilherme (frontend), equipe backend TTS, design (apenas validação de UX textual).
- Go/no-go após testes com pelo menos 3 PDFs distintos (texto contínuo, capítulos com páginas vazias, imagens).
