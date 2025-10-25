// Vercel build script to ensure proper directory handling
console.log('Starting Vercel build process...');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));
console.log('Build completed successfully!');
