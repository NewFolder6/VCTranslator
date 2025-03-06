const fs = require('fs');
const path = require('path');

console.log('Attempting to patch ffi-napi build files...');

try {
  // Path to the problematic targets file
  const ffiTargetsPath = path.join(process.cwd(), 'node_modules', 'ffi-napi', 'build', 'deps', 'libffi', 'ffi.targets');
  
  if (!fs.existsSync(ffiTargetsPath)) {
    console.log('ffi.targets file not found. This may be expected if ffi-napi is not installed yet.');
    process.exit(0);
  }

  // Read the targets file
  let content = fs.readFileSync(ffiTargetsPath, 'utf8');
  
  // Fix the malformed command by removing one "call"
  // The original problematic line has: call "call" "../../../deps/libffi/preprocess_asm.cmd"
  content = content.replace('call "call"', 'call');
  
  // Write the fixed content back
  fs.writeFileSync(ffiTargetsPath, content, 'utf8');
  
  console.log('Successfully patched ffi-napi build file!');
  
  // Also check and fix the cmd file if it exists
  const asmCmdPath = path.join(process.cwd(), 'node_modules', 'ffi-napi', 'deps', 'libffi', 'preprocess_asm.cmd');
  
  if (fs.existsSync(asmCmdPath)) {
    console.log('Checking preprocess_asm.cmd...');
    
    let cmdContent = fs.readFileSync(asmCmdPath, 'utf8');
    
    // Make sure the cmd file is executable by checking if it has proper line endings
    if (!cmdContent.includes('\r\n')) {
      cmdContent = cmdContent.replace(/\n/g, '\r\n');
      fs.writeFileSync(asmCmdPath, cmdContent, 'utf8');
      console.log('Fixed line endings in preprocess_asm.cmd');
    }
  }

} catch (err) {
  console.error('Error while patching ffi-napi:', err);
  process.exit(1);
}
