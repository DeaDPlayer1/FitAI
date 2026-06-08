const fs = require('fs');
const path = require('path');

const nm = path.resolve(__dirname, '..', 'node_modules');

if (!fs.existsSync(nm)) process.exit(0);

const entries = fs.readdirSync(nm, { withFileTypes: true });
for (const e of entries) {
  if (!e.isDirectory() || !e.name.startsWith('@')) continue;
  const sp = path.join(nm, e.name);
  const children = fs.readdirSync(sp, { withFileTypes: true }).filter(c => c.isDirectory());
  if (children.length === 0) {
    try { fs.rmdirSync(sp); } catch {}
  }
}

const nested = path.join(nm, 'unrs-resolver', 'node_modules', '@unrs');
if (fs.existsSync(nested)) {
  try {
    const children = fs.readdirSync(nested, { withFileTypes: true }).filter(c => c.isDirectory());
    if (children.length === 0) fs.rmdirSync(nested);
  } catch {}
}
