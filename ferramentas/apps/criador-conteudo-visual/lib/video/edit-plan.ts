// Plano de edição derivado de INTERVALOS de tempo — fonte única da verdade.
// Roda igual no editor (preview + trilha) e na composição Remotion (render).
// Puro, sem dependências de Node.

export type EditWord = { text: string; start: number; end: number; removed?: boolean }
export type Range = { start: number; end: number }
export type Zoom = { start: number; end: number; scale: number; x: number; y: number }
export type OutWord = { text: string; outStart: number; outEnd: number }
export type Segment = { start: number; end: number }
export type EditPlan = { segments: Segment[]; outWords: OutWord[]; outDuration: number }

const EPS = 0.001

// ── Utilitários de intervalos ──
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.filter((r) => r.end - r.start > EPS).sort((a, b) => a.start - b.start)
  if (!sorted.length) return []
  const out: Range[] = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1]
    if (sorted[i].start <= last.end + EPS) last.end = Math.max(last.end, sorted[i].end)
    else out.push({ ...sorted[i] })
  }
  return out
}

// Subtrai `cuts` de `base` → trechos restantes.
export function subtractRanges(base: Range[], cuts: Range[]): Range[] {
  const merged = mergeRanges(cuts)
  let result: Range[] = base.map((b) => ({ ...b }))
  for (const cut of merged) {
    const next: Range[] = []
    for (const seg of result) {
      if (cut.end <= seg.start || cut.start >= seg.end) { next.push(seg); continue }
      if (cut.start > seg.start) next.push({ start: seg.start, end: cut.start })
      if (cut.end < seg.end) next.push({ start: cut.end, end: seg.end })
    }
    result = next
  }
  return result.filter((s) => s.end - s.start > 0.02)
}

export function addCut(cuts: Range[], range: Range): Range[] {
  return mergeRanges([...cuts, range])
}

export function removeCutAt(cuts: Range[], t: number): Range[] {
  return cuts.filter((c) => !(t >= c.start && t < c.end))
}

export function isCut(cuts: Range[], t: number): boolean {
  return cuts.some((c) => t >= c.start && t < c.end)
}

// Fração de [start,end] coberta pelos cortes (0..1) — p/ riscar só palavra de fato cortada.
export function coveredFraction(cuts: Range[], start: number, end: number): number {
  const span = end - start
  if (span <= 0) return 0
  let covered = 0
  for (const c of cuts) {
    const a = Math.max(start, c.start)
    const b = Math.min(end, c.end)
    if (b > a) covered += b - a
  }
  return Math.min(1, covered / span)
}

// Clique no chip: corta a palavra ou restaura (se já cortada).
export function toggleCutForWord(cuts: Range[], word: { start: number; end: number }): Range[] {
  const mid = (word.start + word.end) / 2
  const covered = cuts.some((c) => mid >= c.start && mid < c.end)
  return covered
    ? subtractRanges(cuts, [{ start: word.start, end: word.end }])
    : mergeRanges([...cuts, { start: word.start, end: word.end }])
}

// ── Plano de edição ──
export function buildEditPlan(words: EditWord[], sourceDuration: number, cuts: Range[]): EditPlan {
  const segments = subtractRanges([{ start: 0, end: sourceDuration }], cuts)
  if (!segments.length) {
    return { segments: [{ start: 0, end: sourceDuration }], outWords: [], outDuration: sourceDuration }
  }
  const outWords: OutWord[] = []
  let offset = 0
  for (const seg of segments) {
    for (const w of words) {
      const mid = (w.start + w.end) / 2
      if (mid >= seg.start && mid < seg.end) {
        outWords.push({
          text: w.text,
          outStart: offset + Math.max(0, w.start - seg.start),
          outEnd: offset + Math.min(w.end, seg.end) - seg.start,
        })
      }
    }
    offset += seg.end - seg.start
  }
  return { segments, outWords, outDuration: offset }
}

// ── Mapeamento trilha (tempo de FONTE) ↔ player (tempo de SAÍDA) ──
export function outputTimeToSourceTime(plan: EditPlan, tOut: number): number {
  let offset = 0
  for (const seg of plan.segments) {
    const dur = seg.end - seg.start
    if (tOut < offset + dur) return seg.start + (tOut - offset)
    offset += dur
  }
  const last = plan.segments[plan.segments.length - 1]
  return last ? last.end : 0
}

export function sourceTimeToOutputFrame(plan: EditPlan, s: number, fps: number): number {
  let offset = 0
  for (const seg of plan.segments) {
    if (s < seg.start) return Math.round(offset * fps) // s caiu num corte → snap p/ início do trecho
    if (s < seg.end) return Math.round((offset + (s - seg.start)) * fps)
    offset += seg.end - seg.start
  }
  return Math.round(offset * fps)
}

// ── Mapear frase (texto) → intervalo de tempo na transcrição ──
function normWord(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '')
}

// Acha a sequência de palavras de `phrase` na transcrição; devolve o intervalo
// [início da 1ª palavra, fim da última]. Null se não encontrar.
export function findPhraseRange(words: EditWord[], phrase: string): Range | null {
  const target = phrase.split(/\s+/).map(normWord).filter(Boolean)
  if (!target.length) return null
  const norm = words.map((w) => normWord(w.text))
  for (let i = 0; i + target.length <= norm.length; i++) {
    let ok = true
    for (let j = 0; j < target.length; j++) {
      if (norm[i + j] !== target[j]) { ok = false; break }
    }
    if (ok) return { start: words[i].start, end: words[i + target.length - 1].end }
  }
  // fallback: 1 palavra-chave isolada (a mais longa do alvo)
  if (target.length === 1) {
    const k = norm.indexOf(target[0])
    if (k >= 0) return { start: words[k].start, end: words[k].end }
  }
  return null
}

// ── Auto-zoom dinâmico (estilo Reel) ──
// Agrupa palavras em frases (gap > 0.6s) e põe zoom em ~cada 2ª frase ≥1.2s.
export function autoZoomRegions(words: EditWord[]): Zoom[] {
  const kept = words.filter((w) => !w.removed)
  if (!kept.length) return []
  const sentences: { start: number; end: number }[] = []
  let cur = { start: kept[0].start, end: kept[0].end }
  for (let i = 1; i < kept.length; i++) {
    if (kept[i].start - cur.end > 0.6) { sentences.push(cur); cur = { start: kept[i].start, end: kept[i].end } }
    else cur.end = kept[i].end
  }
  sentences.push(cur)

  const scales = [1.3, 1.45, 1.5]
  const zooms: Zoom[] = []
  let pick = 0
  sentences.forEach((s, idx) => {
    if (s.end - s.start < 1.2) return
    if (idx % 2 !== 0) return // ~cada 2ª frase (denso = dinâmico)
    const end = Math.min(s.end, s.start + 2.5)
    if (end - s.start < 0.8) return
    zooms.push({ start: s.start, end, scale: scales[pick % scales.length], x: 0, y: 0 })
    pick++
  })
  return zooms
}
