const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '../certs');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

async function generate() {
  try {
    console.log('Generating self-signed certificate for localhost...');
    const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
      days: 365,
      keySize: 2048,
      algorithm: 'sha256'
    });
    console.log('Generated pems:', typeof pems);
    console.log('private:', pems.private ? 'exists' : 'undefined');
    console.log('cert:', pems.cert ? 'exists' : 'undefined');
    
    if (pems.private && pems.cert) {
      fs.writeFileSync(keyPath, pems.private);
      fs.writeFileSync(certPath, pems.cert);
    } else {
      console.log('pems:', pems);
      throw new Error('Unexpected response from selfsigned.generate');
    }
    
    console.log(`Certificate saved to ${certDir}`);
    console.log(`Key: ${keyPath}`);
    console.log(`Cert: ${certPath}`);
  } catch (error) {
    console.error('Failed to generate certificate:', error);
    process.exit(1);
  }
}

generate();