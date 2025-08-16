const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/crm/shared/email-template-dialog/email-template-dialog.component.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove all console.log statements (including multi-line ones)
content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
content = content.replace(/^\s*console\.log\([^)]*,\s*\{[^}]*\}\s*\);?\s*$/gm, '');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Removed console.log statements from email-template-dialog.component.ts');
