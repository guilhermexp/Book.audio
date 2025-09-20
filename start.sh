#!/bin/bash

echo "🚀 Iniciando Book.audio..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o backend tem venv
if [ ! -d "backend/venv" ]; then
    echo "🐍 Configurando ambiente Python..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Tentar iniciar apenas o frontend primeiro
echo "🎨 Iniciando frontend..."
npm run dev:frontend-only &
FRONTEND_PID=$!

# Esperar o frontend iniciar
sleep 3

# Verificar se o frontend está rodando
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend iniciado com sucesso!"

    # Tentar iniciar o backend
    echo "🔧 Iniciando backend..."
    npm run dev:backend-only &
    BACKEND_PID=$!

    echo "✨ Aplicação rodando em http://localhost:5173"
    echo "📚 API rodando em http://localhost:8000"
    echo ""
    echo "Pressione Ctrl+C para parar"

    # Aguardar até receber sinal de interrupção
    wait
else
    echo "❌ Erro ao iniciar frontend"
    exit 1
fi
