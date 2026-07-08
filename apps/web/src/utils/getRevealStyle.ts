import type { CSSProperties } from 'react';

export function getRevealStyle(delayMs: number) {
  return {
    '--delay': `${delayMs}ms`,
  } as CSSProperties;
}
