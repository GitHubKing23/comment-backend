const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.resolve('C:/Users/User/comment-backend/server.js'),
  path.resolve('C:/Users/User/comment-backend/models/EthComment.js'),
  path.resolve('C:/Users/User/comment-backend/.env'),
  path.resolve('C:/Users/User/comment-backend/package.json')
];

const outputFile = 'extractedCommentBackendFiles.txt';
let output = '';

filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // If it's .env, replace JWT_SECRET if needed
    if (filePath.endsWith('.env')) {
      const lines = content.split('\n');
      content = lines
        .map(line => line.startsWith('JWT_SECRET=') ? 'JWT_SECRET=yourSuperSecretKey' : line)
        .join('\n');
    }

    output += `=== FILE: ${filePath} ===\n\n${content}\n\n`;
  } else {
    output += `=== FILE: ${filePath} NOT FOUND ===\n\n`;
  }
});

fs.writeFileSync(outputFile, output, 'utf-8');
console.log(`✅ Done. Output written to ${outputFile}`);
