// This is an auto-generated script to start VCTranslator in compatibility mode
// Created by setup-all.js
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting VCTranslator in compatibility mode for Node.js v22.13.0...');
const env = { ...process.env, NODE_OPTIONS: '--no-node-snapshot' };
const child = spawn('node', ['src/server/index.js'], { 
  stdio: 'inherit',
  env: env 
});

child.on('exit', (code) => {
  process.exit(code);
});