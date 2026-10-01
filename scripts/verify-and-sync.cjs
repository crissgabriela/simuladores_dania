#!/usr/bin/env node

/**
 * Agente de Verificación y Sincronización Automática con GitHub & Vercel
 * 
 * Funcionalidad:
 * 1. Comprueba el estado del repositorio local (git status)
 * 2. Ejecuta la verificación estricta de compilación TypeScript y empaquetado (npm run build)
 * 3. Añade archivos modificados y genera commit semántico
 * 4. Sube los cambios al repositorio remoto en GitHub
 * 5. Reporta el estado de despliegue en Vercel
 */

const { execSync } = require('child_process');
const path = require('path');

function run(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (err) {
    if (!silent) {
      console.error(`❌ Error al ejecutar: ${command}`);
    }
    throw err;
  }
}

console.log('====================================================');
console.log('🤖 AGENTE DE SINCRONIZACIÓN Y DESPLIEGUE (GitHub & Vercel)');
console.log('====================================================\n');

try {
  // 1. Verificación de compilación local
  console.log('🔍 Paso 1: Verificando compilación TypeScript y bundling de Vite...');
  run('npm run build');
  console.log('✅ Compilación verificada exitosamente. Sin errores de tipos ni sintaxis.\n');

  // 2. Comprobar git status
  console.log('📦 Paso 2: Verificando estado de Git...');
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();

  if (!statusOutput) {
    console.log('ℹ️ No hay modificaciones pendientes para sincronizar. El repositorio está al día.');
  } else {
    console.log('Archivos modificados detectados:');
    console.log(statusOutput);

    // 3. Stage & Commit
    console.log('\n📝 Paso 3: Agregando cambios y creando commit...');
    run('git add -A');
    const commitMsg = process.argv[2] || `Actualización del laboratorio de oscilaciones - ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    run(`git commit -m "${commitMsg}"`);
    console.log('✅ Commit creado.');

    // 4. Push a GitHub
    console.log('\n🚀 Paso 4: Enviando cambios a GitHub (crissgabriela/simuladores_dania)...');
    run('git push -u origin master');
    console.log('✅ Cambios subidos exitosamente a GitHub.');
  }

  // 5. Reporte Vercel
  console.log('\n🌐 Paso 5: Estado de Vercel');
  console.log('   Si el repositorio está conectado a Vercel, el despliegue se activa');
  console.log('   automáticamente tras el push a GitHub.');
  console.log('   Configuración: framework Vite, build: npm run build, output: dist/\n');

  console.log('🎉 Proceso completado con éxito.');
} catch (error) {
  console.error('\n❌ Hubo un error durante la verificación/sincronización:');
  console.error(error.message);
  process.exit(1);
}
