# 📚 Instruções de Teste - Integração MarkItDown

## 🚀 Setup Inicial

### 1. Iniciar o Backend (Terminal 1)
```bash
cd backend
chmod +x setup.sh run.sh  # Dar permissões de execução
./setup.sh                 # Primeira vez apenas
./run.sh                   # Iniciar servidor
```

O servidor estará rodando em: http://localhost:8000
Documentação da API: http://localhost:8000/docs

### 2. Iniciar o Frontend (Terminal 2)
```bash
npm install    # Se ainda não instalou as dependências
npm run dev
```

Aplicação disponível em: http://localhost:5173

## 🧪 Casos de Teste

### Teste 1: PDF Simples
1. Com backend rodando:
   - Upload de PDF qualquer
   - Verificar conversão para Markdown
   - Testar navegação entre páginas
   - Testar função de resumo AI

### Teste 2: YouTube Video
1. Com backend rodando:
   - Colar URL do YouTube no campo apropriado
   - Exemplos de URLs para teste:
     - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
     - Qualquer vídeo educacional com legendas
   - Verificar transcrição convertida
   - Navegar pelo conteúdo

### Teste 3: ePub (se disponível)
1. Upload de arquivo .epub
2. Verificar estrutura de capítulos preservada
3. Testar formatação Markdown

### Teste 4: Fallback sem Backend
1. Parar o servidor backend (Ctrl+C no terminal)
2. Recarregar a aplicação
3. Tentar upload de PDF - deve funcionar com pdf.js
4. Tentar YouTube - deve mostrar aviso de backend necessário

## 🔍 O que Verificar

### ✅ Sucesso Esperado:
- [x] Conteúdo aparece formatado com Markdown
- [x] Títulos, listas e formatação preservados
- [x] Navegação funciona corretamente
- [x] AI Summary continua funcionando
- [x] Assistant Panel reconhece novo conteúdo
- [x] Mind Map gera estrutura correta

### ⚠️ Possíveis Problemas:

1. **Erro: "Backend service not available"**
   - Solução: Verificar se backend está rodando
   - Comando: `cd backend && ./run.sh`

2. **Erro: "Failed to convert file"**
   - Verificar logs do backend no terminal
   - Pode ser arquivo muito grande (>50MB)

3. **YouTube não funciona**
   - Verificar se URL é válida
   - Vídeo pode estar com restrições

## 📊 Status dos Componentes

| Componente | Status | Observação |
|------------|--------|------------|
| Backend FastAPI | ✅ | Porta 8000 |
| Conversão PDF | ✅ | Via MarkItDown |
| Conversão YouTube | ✅ | Transcrições |
| Conversão ePub | ✅ | Suportado |
| Renderização Markdown | ✅ | React-Markdown |
| Fallback pdf.js | ✅ | Quando backend offline |

## 🎯 Melhorias Futuras

1. Cache de conversões
2. Progress bar para arquivos grandes
3. Suporte para mais formatos (Word, PPT)
4. Preview antes de confirmar import
5. Histórico de documentos recentes

## 💡 Dicas

- Backend precisa estar rodando para formatos além de PDF
- YouTube funciona melhor com vídeos que têm legendas
- Arquivos muito grandes podem demorar para converter
- O Markdown preserva formatação melhor que pdf.js

## 🐛 Reportar Problemas

Se encontrar algum problema:
1. Verificar console do navegador (F12)
2. Verificar logs do backend
3. Testar com arquivo/URL diferente
4. Documentar erro específico e contexto