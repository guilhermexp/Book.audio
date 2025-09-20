#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkDependencies() {
  if (!existsSync('node_modules')) {
    log('📦 Instalando dependências do frontend...', colors.yellow);
    await runCommand('npm', ['install']);
  }

  if (!existsSync('backend/venv')) {
    log('🐍 Configurando ambiente Python...', colors.yellow);
    await runCommand('npm', ['run', 'backend:setup']);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: platform() === 'win32'
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando falhou com código ${code}`));
    });
  });
}

async function startServices() {
  log('\n🚀 Iniciando Book.audio Application', colors.bright + colors.cyan);
  log('=' .repeat(40), colors.cyan);

  // Verificar dependências
  await checkDependencies();

  // Iniciar Backend
  log('\n🔧 Iniciando Backend Python...', colors.blue);
  const backend = spawn('python3', ['backend/start.py'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: platform() === 'win32'
  });

  backend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.yellow}[Backend]${colors.reset} ${data}`);
  });

  backend.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Backend Error]${colors.reset} ${data}`);
  });

  backend.on('error', (err) => {
    log(`❌ Erro ao iniciar backend: ${err.message}`, colors.red);
  });

  // Aguardar backend iniciar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Iniciar Frontend
  log('🎨 Iniciando Frontend Vite...', colors.green);
  const frontend = spawn('npm', ['run', 'frontend'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: platform() === 'win32'
  });

  frontend.stdout.on('data', (data) => {
    process.stdout.write(`${colors.green}[Frontend]${colors.reset} ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    // Vite usa stderr para algumas mensagens normais
    const message = data.toString();
    if (message.includes('warning') || message.includes('WARN')) {
      process.stdout.write(`${colors.yellow}[Frontend]${colors.reset} ${data}`);
    } else if (message.includes('error') || message.includes('ERROR')) {
      process.stderr.write(`${colors.red}[Frontend Error]${colors.reset} ${data}`);
    } else {
      process.stdout.write(`${colors.green}[Frontend]${colors.reset} ${data}`);
    }
  });

  frontend.on('error', (err) => {
    log(`❌ Erro ao iniciar frontend: ${err.message}`, colors.red);
  });

  // Aguardar um pouco e mostrar URLs
  setTimeout(() => {
    log('\n' + '=' .repeat(40), colors.cyan);
    log('✨ Aplicação iniciada com sucesso!', colors.bright + colors.green);
    log('\n📚 Frontend: http://localhost:5173', colors.cyan);
    log('🔧 Backend API: http://localhost:8000', colors.cyan);
    log('📖 API Docs: http://localhost:8000/docs', colors.cyan);
    log('\nPressione Ctrl+C para parar todos os serviços', colors.yellow);
    log('=' .repeat(40) + '\n', colors.cyan);
  }, 3000);

  // Lidar com encerramento gracioso
  process.on('SIGINT', () => {
    log('\n\n🛑 Encerrando aplicação...', colors.yellow);
    backend.kill();
    frontend.kill();
    setTimeout(() => process.exit(0), 1000);
  });

  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  // Manter processo rodando
  await new Promise(() => {});
}

// Iniciar aplicação
startServices().catch(err => {
  log(`\n❌ Erro fatal: ${err.message}`, colors.red);
  log('\n💡 Sugestões:', colors.yellow);
  log('1. Verifique se Python 3 está instalado', colors.reset);
  log('2. Verifique se as portas 5173 e 8000 estão livres', colors.reset);
  log('3. Execute: npm install', colors.reset);
  log('4. Verifique o arquivo .env.local', colors.reset);
  process.exit(1);
});
