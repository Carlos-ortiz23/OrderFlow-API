/**
 * Script to generate a Telegram StringSession for the MTProto API
 * 
 * This script will help you generate the TELEGRAM_SESSION variable required
 * for the automatic Telegram bot creation functionality.
 * 
 * Usage:
 * 1. Make sure you have TELEGRAM_API_ID and TELEGRAM_API_HASH in your .env
 *    or enter them when prompted by the script
 * 2. Run: node scripts/generate-telegram-session.js
 * 3. Follow the instructions to enter your phone number and verification code
 * 4. Copy the generated string to your TELEGRAM_SESSION variable in .env
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm install input
const dotenv = require('dotenv');

// Load environment variables from .env if it exists
dotenv.config();

// Function to request input if not in environment variables
async function getInput(envVar, promptText) {
  if (process.env[envVar]) {
    return process.env[envVar];
  }
  return await input.text(promptText);
}

(async () => {
  console.log('='.repeat(50));
  console.log('TELEGRAM SESSION GENERATOR FOR ORDERFLOW API');
  console.log('='.repeat(50));
  console.log('\nThis script will generate the TELEGRAM_SESSION variable required');
  console.log('for the automatic bot creation functionality.\n');

  try {
    // Get API ID and Hash
    const apiIdStr = await getInput('TELEGRAM_API_ID', 'Enter your API ID (from my.telegram.org): ');
    const apiId = parseInt(apiIdStr);
    const apiHash = await getInput('TELEGRAM_API_HASH', 'Enter your API Hash (from my.telegram.org): ');

    if (!apiId || !apiHash) {
      console.error('Error: API ID and API Hash are required');
      process.exit(1);
    }

    console.log('\nInitializing Telegram client...');
    const stringSession = new StringSession(''); // Start with empty session
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log('Logging into Telegram...');
    await client.start({
      phoneNumber: async () => await input.text('Phone number (with country code, e.g.: +1234567890): '),
      password: async () => await input.text('Password (if you have two-step verification): '),
      phoneCode: async () => await input.text('Verification code received on Telegram: '),
      onError: (err) => console.log('Error:', err),
    });

    // Save the session
    const sessionString = client.session.save();
    console.log('\n' + '='.repeat(50));
    console.log('SESSION GENERATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\nCopy this string to your TELEGRAM_SESSION variable in .env:');
    console.log('\n' + sessionString + '\n');
    console.log('Example for your .env file:');
    console.log(`TELEGRAM_API_ID=${apiId}`);
    console.log(`TELEGRAM_API_HASH=${apiHash}`);
    console.log(`TELEGRAM_SESSION=${sessionString}`);
    console.log('\nDo not share these credentials with anyone!');

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error generating session:', error);
    process.exit(1);
  }
})();
