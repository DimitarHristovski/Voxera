#!/usr/bin/env node
/**
 * Standalone server starter for VOXERA
 * This script starts the Next.js server independently of the Tauri app
 * The server will continue running even if the Tauri app is closed
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine if we're in production (standalone) or development
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.argv.includes('--production');

let serverProcess;

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down server gracefully...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down server gracefully...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Start the server
function startServer() {
  if (isProduction) {
    // Production: Run the standalone server
    const standaloneDir = path.join(__dirname, '.next', 'standalone');
    const serverPath = path.join(standaloneDir, 'server.js');
    
    if (!fs.existsSync(serverPath)) {
      console.error('❌ Standalone server not found. Please run: npm run build');
      process.exit(1);
    }
    
    console.log('🚀 Starting VOXERA standalone server (production mode)...');
    console.log('📡 Server will run independently of the Tauri app');
    console.log('💡 The server will continue running even if you quit the app');
    console.log('💡 To stop the server, press Ctrl+C or close this terminal\n');
    
    // Set PORT environment variable
    process.env.PORT = process.env.PORT || '3000';
    
    serverProcess = spawn('node', [serverPath], {
      cwd: standaloneDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: process.env.PORT || '3000',
        NODE_ENV: 'production'
      }
    });
  } else {
    // Development: Run Next.js dev server
    console.log('🚀 Starting VOXERA dev server (development mode)...');
    console.log('📡 Server will run independently of the Tauri app');
    console.log('💡 The server will continue running even if you quit the app');
    console.log('💡 To stop the server, press Ctrl+C or close this terminal\n');
    
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: process.env.PORT || '3000'
      }
    });
  }
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
}

startServer();

