#!/usr/bin/env node
/**
 * Script para gerar a versão automaticamente a partir de package.json + git commit SHA
 * Executa durante o build do Next.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getVersion() {
  try {
    // Ler versão do package.json
    const packageJson = require('../package.json');
    const baseVersion = packageJson.version || '1.0.0';

    // Tentar obter commit SHA curto
    let commitSha = 'dev';
    try {
      commitSha = execSync('git rev-parse --short HEAD', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
    } catch {
      // Se não estiver em um repositório git, usar 'dev'
      commitSha = 'dev';
    }

    return `${baseVersion}-${commitSha}`;
  } catch (error) {
    console.error('Erro ao gerar versão:', error.message);
    return '1.0.0-dev';
  }
}

function updateEnvLocal() {
  const version = getVersion();
  const envLocalPath = path.join(__dirname, '../.env.local');
  
  let envContent = '';
  
  // Ler .env.local se existir
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf-8');
  }
  
  // Remover linha existente de NEXT_PUBLIC_APP_VERSION
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('NEXT_PUBLIC_APP_VERSION='))
    .join('\n')
    .trim();
  
  // Adicionar nova versão
  envContent += `\nNEXT_PUBLIC_APP_VERSION=${version}\n`;
  
  // Escrever .env.local
  fs.writeFileSync(envLocalPath, envContent, 'utf-8');
  
  console.log(`✓ Versão atualizada: ${version}`);
}

// Executar
updateEnvLocal();
