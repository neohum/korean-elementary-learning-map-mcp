/**
 * packages/korean-elementary-learning-map-mcp/src/normalize.mjs
 * 
 * Normalization utilities for Korean elementary curriculum codes, texts, and grade bands.
 */

const ROMAN = {
  'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V', 'Ⅵ': 'VI',
  'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X', 'Ⅺ': 'XI', 'Ⅻ': 'XII',
  'ⅰ': 'I', 'ⅱ': 'II', 'ⅲ': 'III', 'ⅳ': 'IV', 'ⅴ': 'V', 'ⅵ': 'VI',
  'ⅶ': 'VII', 'ⅷ': 'VIII', 'ⅸ': 'IX', 'ⅹ': 'X', 'ⅺ': 'XI', 'ⅻ': 'XII',
};

export function normalizeRoman(value) {
  return String(value ?? '').replace(/[Ⅰ-Ⅻⅰ-ⅻ]/g, (ch) => ROMAN[ch] ?? ch);
}

export function normalizeCode(code) {
  const compact = normalizeRoman(String(code ?? '').normalize('NFC')).replace(/\s+/g, '');
  if (!compact) return compact;
  return compact.startsWith('[') ? compact : `[${compact}]`;
}

export function normalizeRawCode(code) {
  return normalizeCode(code).replace(/^\[/, '').replace(/\]$/, '');
}

export function normalizeText(value) {
  return normalizeRoman(String(value ?? '').normalize('NFC'))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function gradeBandOrder(gradeBand) {
  switch (gradeBand) {
    case '1-2': return 1;
    case '3-4': return 2;
    case '5-6': return 3;
    default: return 99;
  }
}
