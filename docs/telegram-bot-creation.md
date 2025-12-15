# Configuración de Telegram para Creación Automática de Bots

OrderFlow API incluye una funcionalidad para crear bots de Telegram automáticamente cuando se registra una nueva tienda. Esta característica utiliza la API MTProto de Telegram para interactuar con BotFather y configurar los webhooks automáticamente.

## Requisitos

Para utilizar esta funcionalidad, necesitas configurar tres variables de entorno:

1. `TELEGRAM_API_ID`: ID numérico de tu aplicación Telegram
2. `TELEGRAM_API_HASH`: Hash de tu aplicación Telegram
3. `TELEGRAM_SESSION`: Cadena de sesión para autenticación

## Paso 1: Obtener API ID y API Hash

1. Visita [https://my.telegram.org](https://my.telegram.org) e inicia sesión con tu cuenta de Telegram
2. Haz clic en "API development tools"
3. Completa el formulario con la siguiente información:
   - **App title**: OrderFlow API (o el nombre que prefieras)
   - **Short name**: orderflow (sin espacios)
   - **Platform**: Web
   - **Description**: Bot management for OrderFlow e-commerce platform
   - **URL**: La URL de tu aplicación (puede ser localhost durante desarrollo)
4. Haz clic en "Create Application"
5. Anota los valores de `api_id` y `api_hash` que se te proporcionarán

## Paso 2: Generar una StringSession

Hemos incluido un script para generar fácilmente la cadena de sesión:

1. Asegúrate de tener las dependencias instaladas, incluyendo el paquete 'input' que es necesario para este script:
   ```bash
   npm install
   npm install input
   ```

2. Ejecuta el script de generación de sesión:
   ```bash
   node scripts/generate-telegram-session.js
   ```

3. Sigue las instrucciones en pantalla:
   - Ingresa tu API ID y API Hash (o configúralos en el archivo .env primero)
   - Ingresa tu número de teléfono con código de país (ej: +573001234567)
   - Ingresa el código de verificación que recibirás en Telegram
   - Si tienes verificación en dos pasos, ingresa tu contraseña

4. El script generará una cadena larga que será tu `TELEGRAM_SESSION`

## Paso 3: Configurar Variables de Entorno

Añade estas variables a tu archivo `.env`:

```
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_SESSION=1BQANOTEuMTM4LjEzMC4xMTkBu0Gta7QXX...
```

## Uso de la Funcionalidad

Una vez configuradas las variables, puedes crear bots automáticamente a través del endpoint:

```
POST /api/bot/create
```

Con el siguiente payload:
```json
{
  "storeName": "Nombre de la Tienda",
  "storeId": "uuid-de-la-tienda",
  "proposedUsername": "NombreSugeridoBot" // Opcional
}
```

El sistema:
1. Interactuará con BotFather para crear un nuevo bot
2. Configurará automáticamente el webhook para recibir mensajes
3. Actualizará la tienda con el token del bot generado

## Consideraciones de Seguridad

- Las credenciales de Telegram son sensibles y no deben compartirse
- La StringSession contiene información de autenticación, trátala como una contraseña
- Considera usar un sistema de gestión de secretos para entornos de producción
- La aplicación puede iniciarse sin estas credenciales, pero la funcionalidad de creación automática de bots no estará disponible

## Solución de Problemas

Si encuentras errores como:
- "Telegram API ID or Hash not provided"
- "Telegram client not initialized"

Verifica que las variables de entorno estén correctamente configuradas.
