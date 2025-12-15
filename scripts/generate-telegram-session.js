/**
 * Script para generar una StringSession de Telegram para la API MTProto
 * 
 * Este script te ayudará a generar la variable TELEGRAM_SESSION necesaria
 * para la funcionalidad de creación automática de bots de Telegram.
 * 
 * Uso:
 * 1. Asegúrate de tener las variables TELEGRAM_API_ID y TELEGRAM_API_HASH en tu .env
 *    o ingrésalas cuando el script te las solicite
 * 2. Ejecuta: node scripts/generate-telegram-session.js
 * 3. Sigue las instrucciones para ingresar tu número de teléfono y código de verificación
 * 4. Copia la cadena generada a tu variable TELEGRAM_SESSION en .env
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm install input
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env si existe
dotenv.config();

// Función para solicitar input si no está en variables de entorno
async function getInput(envVar, promptText) {
  if (process.env[envVar]) {
    return process.env[envVar];
  }
  return await input.text(promptText);
}

(async () => {
  console.log('='.repeat(50));
  console.log('GENERADOR DE SESIÓN DE TELEGRAM PARA ORDERFLOW API');
  console.log('='.repeat(50));
  console.log('\nEste script generará la variable TELEGRAM_SESSION necesaria');
  console.log('para la funcionalidad de creación automática de bots.\n');

  try {
    // Obtener API ID y Hash
    const apiIdStr = await getInput('TELEGRAM_API_ID', 'Ingresa tu API ID (de my.telegram.org): ');
    const apiId = parseInt(apiIdStr);
    const apiHash = await getInput('TELEGRAM_API_HASH', 'Ingresa tu API Hash (de my.telegram.org): ');

    if (!apiId || !apiHash) {
      console.error('Error: API ID y API Hash son obligatorios');
      process.exit(1);
    }

    console.log('\nIniciando cliente de Telegram...');
    const stringSession = new StringSession(''); // Iniciar con sesión vacía
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log('Iniciando sesión en Telegram...');
    await client.start({
      phoneNumber: async () => await input.text('Número de teléfono (con código de país, ej: +573001234567): '),
      password: async () => await input.text('Contraseña (si tienes verificación en dos pasos): '),
      phoneCode: async () => await input.text('Código recibido en Telegram: '),
      onError: (err) => console.log('Error:', err),
    });

    // Guardar la sesión
    const sessionString = client.session.save();
    console.log('\n='.repeat(50));
    console.log('¡SESIÓN GENERADA EXITOSAMENTE!');
    console.log('='.repeat(50));
    console.log('\nCopia esta cadena a tu variable TELEGRAM_SESSION en .env:');
    console.log('\n' + sessionString + '\n');
    console.log('Ejemplo para tu archivo .env:');
    console.log(`TELEGRAM_API_ID=${apiId}`);
    console.log(`TELEGRAM_API_HASH=${apiHash}`);
    console.log(`TELEGRAM_SESSION=${sessionString}`);
    console.log('\n¡No compartas estas credenciales con nadie!');

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error al generar la sesión:', error);
    process.exit(1);
  }
})();
