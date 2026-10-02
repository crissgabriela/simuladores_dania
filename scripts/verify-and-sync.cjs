#!/usr/bin/env node

/**
 * AGENTE REVISOR Y DE DESPLIEGUE CONTINUO (GitHub & Vercel)
 * 
 * Este script actúa como un agente de control de calidad autónomo:
 * 1. Verifica la integridad del código ejecutando el compilador de TypeScript y Vite.
 * 2. Comprueba el estado del repositorio Git y detecta archivos modificados/nuevos.
 * 3. Crea commits con mensajes semánticos estructurados.
 * 4. Envía los cambios al repositorio remoto en GitHub.
 * 5. Notifica el estado para el despliegue automático en Vercel.
 */

const { execSync } = require('child_process');
const readline = require('readline');

function run(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (err) {
    if (!silent) {
      console.error(`\n❌ Error ejecutando el comando: ${command}`);
    }
    throw err;
  }
}

function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  console.log('\n================================================================');
  console.log('🤖 AGENTE REVISOR DE CALIDAD Y DESPLIEGUE (GitHub & Vercel)');
  console.log('================================================================\n');

  try {
    // 1. Verificación preliminar de Git
    console.log('🔍 Paso 1: Verificando configuración de Git...');
    try {
      execSync('git config user.name', { stdio: 'pipe' });
    } catch (_) {
      console.log('   ⚠️ Configurando autor predeterminado de Git para este proyecto...');
      run('git config user.name "Profesora - Laboratorio de Oscilaciones"', true);
      run('git config user.email "profesora@educacion.local"', true);
    }

    // 2. Comprobar si hay cambios
    console.log('📦 Paso 2: Analizando archivos modificados o creados...');
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();

    if (!statusOutput) {
      console.log('   ✅ No hay cambios pendientes. El proyecto está sincronizado y al día.');
      console.log('\n================================================================');
      console.log('🎉 Todo el repositorio ya coincide con la última versión.');
      console.log('================================================================\n');
      return;
    }

    console.log('   Archivos con modificaciones detectados:');
    statusOutput.split('\n').forEach(line => console.log('   -> ' + line));

    // 3. Verificación estricta de compilación TypeScript & Vite
    console.log('\n🛠️ Paso 3: Verificando compilación TypeScript y empaquetado (npm run build)...');
    console.log('   (El agente comprueba que no existan errores de código o tipos antes de subir)');
    
    run('npm run build');
    console.log('   ✅ Compilación 100% exitosa. Sin errores de sintaxis ni de tipos.\n');

    // 4. Obtener mensaje del commit
    let commitMsg = process.argv.slice(2).join(' ').trim();
    if (!commitMsg) {
      if (process.stdin.isTTY) {
        console.log('💡 Escribe un breve resumen de los cambios que hiciste (o presiona ENTER para mensaje automático):');
        commitMsg = await promptUser('   Mensaje: ');
      }
      if (!commitMsg) {
        commitMsg = `Actualización de simulación - ${new Date().toLocaleString('es-ES')}`;
      }
    }

    // 5. Stage y Commit
    console.log(`\n📝 Paso 4: Creando commit seguro con el mensaje: "${commitMsg}"...`);
    run('git add -A');
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    console.log('   ✅ Commit registrado localmente.');

    // 6. Push a GitHub
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main';
    console.log(`\n🚀 Paso 5: Enviando cambios a GitHub en la rama '${currentBranch}'...`);
    
    try {
      run(`git push origin ${currentBranch}`);
      console.log('   ✅ Cambios subidos exitosamente a GitHub.');
    } catch (pushErr) {
      console.log('   ⚠️ Intentando establecer upstream para la rama...');
      run(`git push -u origin ${currentBranch}`);
      console.log('   ✅ Cambios subidos exitosamente a GitHub.');
    }

    // 7. Notificación de Vercel
    console.log('\n🌐 Paso 6: Despliegue en la Nube (Vercel)');
    console.log('   ------------------------------------------------------------');
    console.log('   ✓ GitHub ha recibido la nueva versión.');
    console.log('   ✓ Si Vercel está conectado a este repositorio, el despliegue');
    console.log('     se activó AUTOMÁTICAMENTE en segundo plano.');
    console.log('   ✓ La versión en línea se actualizará en aproximadamente 1 minuto.');
    console.log('   ------------------------------------------------------------\n');

    console.log('================================================================');
    console.log('🎉 ¡PROCESO DE ACTUALIZACIÓN COMPLETADO CON ÉXITO!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA REVISIÓN O SINCRONIZACIÓN:');
    console.error('   ' + (error.message || error));
    console.error('\n💡 Sugerencia: Revisa que el código no tenga errores o que tengas conexión a internet.\n');
    process.exit(1);
  }
}

main();
