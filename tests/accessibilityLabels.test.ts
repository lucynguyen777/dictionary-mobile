import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Plan 3.7: a button whose only content is an icon must carry an accessibilityLabel, or screen
// readers announce just "button". Wrappers that only stop propagation and the primitives
// themselves are exempt.
const EXEMPT_FILES = new Set(['components/app/Touchable.tsx', 'components/app/MotionPressable.tsx']);

function listTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listTsx(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

function openingTagEnd(source: string, start: number) {
  for (let index = start; index < source.length; index += 1) {
    if (source[index] !== '>' || source[index - 1] === '=') continue;
    const segment = source.slice(start, index);
    if (segment.split('{').length === segment.split('}').length) return index;
  }
  return -1;
}

function findUnlabeledIconButtons(file: string) {
  const source = readFileSync(file, 'utf8');
  const problems: string[] = [];
  for (const match of source.matchAll(/<(Touchable|Pressable|MotionPressable)\b/g)) {
    const start = match.index ?? 0;
    const end = openingTagEnd(source, start);
    const opening = source.slice(start, end + 1);
    if (/accessibilityLabel|aria-label|stopPropagation|[Bb]ackdrop/.test(opening)) continue;
    const body = opening.endsWith('/>') ? '' : source.slice(end + 1, source.indexOf(`</${match[1]}>`, end));
    if (/<Text\b/.test(body)) continue;
    problems.push(`${file}:${source.slice(0, start).split('\n').length}`);
  }
  return problems;
}

describe('icon-only buttons', () => {
  it('all have an accessibility label', () => {
    const files = [...listTsx('app'), ...listTsx('components')].filter((file) => !EXEMPT_FILES.has(file));
    expect(files.flatMap(findUnlabeledIconButtons)).toEqual([]);
  });
});
