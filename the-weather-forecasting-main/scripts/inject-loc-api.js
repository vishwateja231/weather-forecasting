const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const key = process.env.loc_api || process.env.REACT_APP_LOC_API || '';
const dir = join(__dirname, '..', 'src', 'config');
try {
  mkdirSync(dir, { recursive: true });
} catch (_) {}
const file = join(dir, 'locApi.js');
const contents = `// Auto-generated at build time\nexport const LOC_API_FROM_ENV = ${JSON.stringify(key)};\n`;
writeFileSync(file, contents);
console.log('Injected LOC API key into src/config/locApi.js');