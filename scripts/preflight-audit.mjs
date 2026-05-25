// PREFLIGHT FIX: Automated Phase 0 audit runner (imports/routes/blur/cycles)
// NOTE: This script is for audit output only; it does not modify app code.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'constants', 'lib', 'hooks', 'utils'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function exists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}

function listFiles(dir) {
  if (!exists(path.join(ROOT, dir))) return [];
  const out = [];
  const stack = [path.join(ROOT, dir)];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        stack.push(full);
      } else if (e.isFile()) {
        if (EXTENSIONS.includes(path.extname(full))) out.push(full);
      }
    }
  }
  return out;
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function rel(p) {
  return path.relative(ROOT, p).replaceAll('\\', '/');
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('@/')) {
    const abs = path.join(ROOT, spec.replace(/^@\//, ''));
    return resolveAsFileOrDir(abs);
  }
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const abs = path.resolve(path.dirname(fromFile), spec);
    return resolveAsFileOrDir(abs);
  }
  return null; // external module
}

function resolveAsFileOrDir(baseAbs) {
  // file with extension
  if (exists(baseAbs) && fs.statSync(baseAbs).isFile()) return baseAbs;
  for (const ext of EXTENSIONS) {
    if (exists(baseAbs + ext)) return baseAbs + ext;
  }
  // directory index
  if (exists(baseAbs) && fs.statSync(baseAbs).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const idx = path.join(baseAbs, 'index' + ext);
      if (exists(idx)) return idx;
    }
  }
  return null;
}

function parseImports(source) {
  const imports = [];
  // import ... from 'x'
  const re = /import\s+[^;]*?\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) imports.push(m[1]);
  // import('x')
  const reDyn = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reDyn.exec(source))) imports.push(m[1]);
  // require('x')
  const reReq = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reReq.exec(source))) imports.push(m[1]);
  return [...new Set(imports)];
}

function parseRouteStrings(source) {
  const routes = [];
  const re = /\brouter\.(push|replace|navigate)\(\s*([`'"])(.*?)\2/g;
  let m;
  while ((m = re.exec(source))) {
    const r = m[3];
    if (typeof r === 'string' && r.startsWith('/')) routes.push(r);
  }
  return routes;
}

function routeExists(route) {
  // Expo Router: '/(tabs)' -> app/(tabs)/index.tsx (or layout), '/modals/x' -> app/modals/x.tsx
  const clean = route.replace(/\/+$/, '');
  const tryPaths = [];

  if (clean === '/(tabs)') {
    tryPaths.push('app/(tabs)/index.tsx', 'app/(tabs)/index.jsx', 'app/(tabs)/_layout.tsx');
  } else if (clean === '/(auth)') {
    tryPaths.push('app/(auth)/login.tsx', 'app/(auth)/_layout.tsx');
  } else {
    const p = clean.replace(/^\//, '');
    tryPaths.push(`app/${p}.tsx`, `app/${p}.ts`, `app/${p}.jsx`, `app/${p}.js`);
    tryPaths.push(`app/${p}/index.tsx`, `app/${p}/index.jsx`);
  }

  return tryPaths.some(tp => exists(path.join(ROOT, tp)));
}

function detectCycles(graph) {
  const visited = new Set();
  const inStack = new Set();
  const cycles = [];

  function dfs(node, chain) {
    if (inStack.has(node)) {
      const idx = chain.indexOf(node);
      if (idx !== -1) cycles.push(chain.slice(idx).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    inStack.add(node);
    const deps = graph.get(node) ?? [];
    for (const dep of deps) dfs(dep, chain.concat(dep));
    inStack.delete(node);
  }

  for (const n of graph.keys()) dfs(n, [n]);
  return cycles;
}

function main() {
  const files = SCAN_DIRS.flatMap(listFiles);

  const issues = [];
  const importGraph = new Map();

  for (const file of files) {
    const src = readText(file);
    const imps = parseImports(src);
    const resolvedDeps = [];

    for (const spec of imps) {
      const resolved = resolveImport(file, spec);
      if (resolved) resolvedDeps.push(resolved);
      if (spec === 'expo-blur' || /\bBlurView\b/.test(src)) {
        // blur is tracked separately below; keep going
      }
      if ((spec.startsWith('@/') || spec.startsWith('./') || spec.startsWith('../')) && !resolved) {
        issues.push({
          severity: 'CRITICAL',
          type: 'UNDEFINED_IMPORT_PATH',
          file: rel(file),
          detail: `Cannot resolve import: ${spec}`,
        });
      }
    }

    importGraph.set(file, resolvedDeps);

    // BlurView risk
    if (src.includes("from 'expo-blur'") || src.includes('from "expo-blur"') || src.includes('<BlurView') || src.includes('BlurViewIOS')) {
      if (src.includes("from 'expo-blur'") || src.includes('from "expo-blur"')) {
        issues.push({
          severity: 'CRITICAL',
          type: 'BLURVIEW_IMPORT',
          file: rel(file),
          detail: `Imports expo-blur (Android risk). Prefer iOS-only runtime require.`,
        });
      }
    }

    // Route existence check
    for (const r of parseRouteStrings(src)) {
      if (!routeExists(r)) {
        issues.push({
          severity: 'CRITICAL',
          type: 'INVALID_ROUTE',
          file: rel(file),
          detail: `Route does not exist: ${r}`,
        });
      }
    }
  }

  const cycles = detectCycles(importGraph);
  for (const c of cycles.slice(0, 20)) {
    issues.push({
      severity: 'MAJOR',
      type: 'CIRCULAR_DEP',
      file: rel(c[0]),
      detail: `Cycle: ${c.map(rel).join(' -> ')}`,
    });
  }

  const summary = {
    filesScanned: files.length,
    issuesFound: issues.length,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    major: issues.filter(i => i.severity === 'MAJOR').length,
    minor: issues.filter(i => i.severity === 'MINOR').length,
  };

  const payload = { summary, issues };
  const outPath = path.join(ROOT, 'preflight-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  // Keep a tiny stdout signal for CI/local runs
  console.log(`[preflight-audit] wrote ${rel(outPath)} with ${summary.issuesFound} issues`);
}

main();

