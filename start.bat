@echo off
echo Starting VCTranslator in compatibility mode...
set NODE_OPTIONS=--no-node-snapshot
node src/server/index.js
