
/**
 * @fileOverview Test de diagnóstico de autenticación con Puppeteer.
 * Este script lanza un navegador Chrome, navega a la página de login,
 * hace clic en el botón de Google y reporta los errores encontrados.
 * 
 * Para ejecutarlo:
 * 1. Instala Puppeteer: npm install puppeteer
 * 2. Ejecuta el script: node auth-test.js
 */
import puppeteer from 'puppeteer';

// URL del entorno de desarrollo de Firebase Studio
const APP_URL = 'http://localhost:3000/login';

async function runAuthTest() {
  console.log('--- INICIANDO TEST DE AUTENTICACIÓN ---');
  console.log(`URL de la aplicación: ${APP_URL}\n`);
  
  let browser = null;
  try {
    console.log('[1/5] Lanzando navegador...');
    browser = await puppeteer.launch({
      headless: false, // Lo hacemos visible para ver qué pasa
      slowMo: 50, // Ralentiza las operaciones para verlas mejor
      args: ['--window-size=1280,800']
    });

    const page = await browser.newPage();
    
    // Escuchar todos los errores de la consola de la página
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('--- ERROR EN CONSOLA DEL NAVEGADOR ---');
            console.error(msg.text());
            console.error('------------------------------------');
        }
    });

    console.log('[2/5] Navegando a la página de login...');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    console.log('Página cargada.');

    const loginButtonSelector = 'button'; // Selector simple para el botón de login
    console.log(`[3/5] Buscando botón de login con el selector: "${loginButtonSelector}"...`);
    await page.waitForSelector(loginButtonSelector);
    console.log('Botón de login encontrado.');

    // Adjuntar un debugger para capturar el popup
    const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));

    console.log('[4/5] Haciendo clic en el botón de login...');
    await page.click(loginButtonSelector);
    console.log('Clic realizado. Esperando popup de autenticación...');
    
    const popup = await newPagePromise;

    if (popup) {
      console.log('\n--- DIAGNÓSTICO: ÉXITO PARCIAL ---');
      console.log('✅ El popup de autenticación de Google se abrió correctamente.');
      console.log(`URL del Popup: ${popup.url()}`);
      console.log('Esto confirma que el error "auth/popup-blocked" está resuelto.');
      console.log('El problema restante (auth/unauthorized-domain) está en la configuración del SDK o del proyecto.');

    } else {
       console.error('\n--- DIAGNÓSTICO: FALLO ---');
       console.error('❌ No se detectó la apertura del popup de autenticación.');
       console.error('La causa probable sigue siendo "auth/popup-blocked".');
    }

    console.log('\n[5/5] Test completado. Esperando 15 segundos antes de cerrar...');
    await new Promise(res => setTimeout(res, 15000));

  } catch (error) {
    console.error('\n--- ERROR CATASTRÓFICO DURANTE EL TEST ---');
    console.error(error);
  } finally {
    if (browser) {
      console.log('Cerrando navegador.');
      await browser.close();
    }
    console.log('--- TEST FINALIZADO ---');
  }
}

runAuthTest();
