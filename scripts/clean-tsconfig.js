// Remove .next/types/**/*.ts from tsconfig.json before build for seamless Next.js deployment
const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');

function cleanTsconfig() {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (tsconfig.include) {
    tsconfig.include = tsconfig.include.filter(
      (item) => item !== '.next/types/**/*.ts'
    );
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('Cleaned .next/types/**/*.ts from tsconfig.json');
  }
}

cleanTsconfig();
