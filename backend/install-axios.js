// Script to install axios dependency
const { exec } = require('child_process');

console.log('Installing axios dependency...');

exec('npm install axios', (error, stdout, stderr) => {
  if (error) {
    console.error('Error installing axios:', error);
    return;
  }
  
  if (stderr) {
    console.error('stderr:', stderr);
    return;
  }
  
  console.log('✅ Axios installed successfully!');
  console.log('stdout:', stdout);
});
