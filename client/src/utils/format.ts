import type { PctDirection } from '../types';

export function formatNum(n: number, digits = 2): string {
  return Number(n).toFixed(digits);
}

export function getPctDirection(pct: number): PctDirection {
  if (pct > 0) return 'up';
  if (pct < 0) return 'down';
  return 'flat';
}

export function formatChangePct(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${formatNum(pct)}%`;
}
