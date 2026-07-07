import type { CSSProperties } from 'react';

export function getRevealStyle(delayMs: number): CSSProperties {
  return {
    '--delay': `${delayMs}ms`,
  } as CSSProperties;
}
