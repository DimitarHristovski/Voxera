// Quick test to verify .env.local is being read
require('dotenv').config({ path: '.env.local' });
console.log('Environment Variables Check:');
console.log('OPEN_KEY exists:', !!process.env.OPEN_KEY);
console.log('OPEN_KEY length:', process.env.OPEN_KEY ? process.env.OPEN_KEY.length : 0);
console.log('OPEN_KEY starts with sk-:', process.env.OPEN_KEY ? process.env.OPEN_KEY.startsWith('sk-') : false);
console.log('OPENAI_API_BASE_URL:', process.env.OPENAI_API_BASE_URL || 'not set');
console.log('WHISPER_MODEL:', process.env.WHISPER_MODEL || 'not set');
