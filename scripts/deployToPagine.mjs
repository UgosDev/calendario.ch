import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function deploy() {
  const pchPath = path.resolve(rootDir, 'pch.json');
  const pch = fs.existsSync(pchPath)
    ? JSON.parse(fs.readFileSync(pchPath, 'utf8'))
    : {
        projectId: 'calendario',
        name: 'calendario.ch Sovereign Scheduling App',
        framework: 'static',
        outputDir: 'dist'
      };

  console.log('🚀 1/3 Compilazione di produzione in corso (npm run build)...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

  const outputDir = path.resolve(rootDir, pch.outputDir || 'dist');
  if (!fs.existsSync(outputDir)) {
    console.error('❌ Cartella di output non trovata:', outputDir);
    process.exit(1);
  }

  const zipPath = path.resolve(rootDir, 'calendario-deploy.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log(`📦 2/3 Creazione archivio zip da ${pch.outputDir}...`);
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${outputDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd "${outputDir}" && zip -r "${zipPath}" ./*`, { stdio: 'inherit' });
  }

  const stat = fs.statSync(zipPath);
  console.log(`📦 Dimensione archivio: ${(stat.size / 1024).toFixed(2)} KB`);

  console.log('🇨🇭 3/3 Invio bundle al cluster sovrano https://pagine.ch/api/deploy...');
  const fileBuffer = fs.readFileSync(zipPath);
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  const fd = new FormData();
  fd.append('projectId', pch.projectId);
  fd.append('name', pch.name);
  fd.append('framework', pch.framework || 'static');
  fd.append('deployedBy', 'UnHub');
  fd.append('customDomain', 'calendario.ch');
  fd.append('bundle', blob, `${pch.projectId}.zip`);

  const res = await fetch('https://pagine.ch/api/deploy', {
    method: 'POST',
    body: fd
  });

  if (fs.existsSync(zipPath)) {
    try {
      fs.unlinkSync(zipPath);
    } catch {}
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Deploy fallito su pagine.ch (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  console.log('✅ DEPLOY COMPLETATO CON SUCCESSO!');
  console.log(`🔗 URL Primario: ${data.primaryUrl}`);
  console.log(`🆔 Deployment ID: ${data.deploymentId}`);
  if (data.aliasUrls && data.aliasUrls.length > 0) {
    console.log(`🌐 Domini Collegati: ${data.aliasUrls.join(', ')}`);
  }
}

deploy().catch((err) => {
  console.error('❌ Errore durante il deploy:', err.message);
  process.exit(1);
});
