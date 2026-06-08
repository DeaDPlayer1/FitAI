export interface TextChunk {
  id: string;
  text: string;
  source: string;
  metadata: Record<string, any>;
  embedding: number[];
  createdAt: string;
  accessCount: number;
  lastAccessed: string;
}

export interface SearchResult {
  chunk: TextChunk;
  score: number;
}

function nGramHash(text: string, n: number = 3): Map<string, number> {
  const map = new Map<string, number>();
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  for (let i = 0; i <= cleaned.length - n; i++) {
    const gram = cleaned.substring(i, i + n);
    map.set(gram, (map.get(gram) || 0) + 1);
  }
  return map;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function buildEmbedding(text: string, dims: number = 64): number[] {
  const hashes = nGramHash(text, 3);
  const vec = new Array(dims).fill(0);
  for (const [gram, count] of hashes) {
    let hash = 0;
    for (let i = 0; i < gram.length; i++) {
      hash = ((hash << 5) - hash) + gram.charCodeAt(i);
      hash = hash & hash;
    }
    const idx = Math.abs(hash) % dims;
    vec[idx] += count;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vec.map(v => v / mag) : vec;
}

let chunks: TextChunk[] = [];
let idCounter = 0;

const MAX_CHUNKS = 500;
const DECAY_ACCESS_LIMIT = 10;

export function clearStore(): void {
  chunks = [];
  idCounter = 0;
}

export function chunkText(text: string, source: string, maxLen: number = 500, overlap: number = 50): TextChunk[] {
  if (!text || text.trim().length === 0) return [];
  const words = text.split(/\s+/);
  const result: TextChunk[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxLen, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(' ');

    result.push({
      id: `chunk_${idCounter++}_${Date.now()}`,
      text: chunkText,
      source,
      metadata: { wordStart: start, wordEnd: end, totalWords: words.length },
      embedding: buildEmbedding(chunkText),
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
    });

    const prevStart = start;
    start = end - overlap;
    // Break if start hasn't advanced (entire text fits in maxLen, or remaining < overlap)
    if (start >= words.length || start <= prevStart) break;
  }

  return result;
}

export function storeChunks(newChunks: TextChunk[]): void {
  chunks.push(...newChunks);
  if (chunks.length > MAX_CHUNKS) {
    chunks.sort((a, b) => a.accessCount - b.accessCount);
    chunks = chunks.slice(-MAX_CHUNKS);
  }
}

export function storeText(text: string, source: string, maxLen?: number, overlap?: number): TextChunk[] {
  if (!text || text.trim().length === 0) return [];
  const newChunks = chunkText(text, source, maxLen, overlap);
  storeChunks(newChunks);
  return newChunks;
}

export function searchSimilar(query: string, topK: number = 5): SearchResult[] {
  const queryEmb = buildEmbedding(query);
  const scored: SearchResult[] = chunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmb, chunk.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);

  const results = scored.slice(0, topK);
  for (const r of results) {
    r.chunk.accessCount++;
    r.chunk.lastAccessed = new Date().toISOString();
  }
  return results;
}

export function retrieveContext(query: string, topK: number = 3): string {
  const results = searchSimilar(query, topK);
  if (results.length === 0) return '';
  const filtered = results.filter(r => r.score > 0.15);
  if (filtered.length === 0) return '';
  return filtered.map(r => `[${r.chunk.source}] ${r.chunk.text}`).join('\n\n');
}

export function consolidate(): void {
  if (chunks.length < 100) return;

  const grouped = new Map<string, TextChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.source;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(chunk);
  }

  const newChunks: TextChunk[] = [];
  for (const [source, group] of grouped) {
    const mergedText = group.map(c => c.text).join(' ');
    if (mergedText.split(/\s+/).length > 100) {
      newChunks.push(...chunkText(mergedText, source, 400, 40));
    } else {
      newChunks.push(...group);
    }
  }
  chunks = newChunks;
}

export function getStats(): { total: number; bySource: Record<string, number> } {
  const bySource: Record<string, number> = {};
  for (const c of chunks) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }
  return { total: chunks.length, bySource };
}
