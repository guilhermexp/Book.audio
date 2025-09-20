import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('🔍 Diagnóstico Book.audio\n');

// Verificar Node e NPM
console.log('📊 Versões:');
console.log(`Node: ${process.version}`);
console.log(`NPM: ${process.env.npm_version || 'Não detectado'}`);
console.log(`Platform: ${process.platform}`);
console.log(`Arch: ${process.arch}\n`);

// Verificar dependências
console.log('📦 Verificando dependências...');
if (!existsSync('node_modules')) {
    console.log('❌ node_modules não encontrado!');
    console.log('Execute: npm install\n');
} else {
    console.log('✅ node_modules encontrado\n');
}

// Verificar ambiente Python
console.log('🐍 Verificando Python...');
if (!existsSync('backend/venv')) {
    console.log('❌ Virtual environment Python não encontrado!');
    console.log('Execute: npm run backend:setup\n');
} else {
    console.log('✅ Virtual environment Python encontrado\n');
}

// Verificar arquivo .env
console.log('🔑 Verificando configuração...');
if (!existsSync('.env.local') && !existsSync('.env')) {
    console.log('⚠️  Arquivo .env não encontrado');
    console.log('Crie um arquivo .env.local com: GEMINI_API_KEY=sua_chave\n');
} else {
    console.log('✅ Arquivo de configuração encontrado\n');
}

// Tentar iniciar apenas o frontend
console.log('🎨 Tentando iniciar frontend...');
const frontend = spawn('npm', ['run', 'dev:frontend-only'], {
    stdio: 'inherit',
    shell: true
});

frontend.on('error', (err) => {
    console.error('❌ Erro ao iniciar frontend:', err.message);
});

frontend.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Frontend parou com código ${code}`);
        console.log('\n💡 Sugestões:');
        console.log('1. Verifique se a porta 5173 está livre');
        console.log('2. Execute: npm install');
        console.log('3. Verifique erros de sintaxe nos arquivos');
    }
});
