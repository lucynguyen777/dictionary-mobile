import { describe, expect, it } from 'vitest';

import { createSseParser, readSseStream } from '../data/sseParser';

function parseAll(chunks: string[]) {
  const events: string[] = [];
  const parser = createSseParser((data) => events.push(data));
  chunks.forEach((chunk) => parser.push(chunk));
  parser.end();
  return events;
}

describe('createSseParser', () => {
  it('emits one event per blank-line separated block', () => {
    expect(parseAll(['data: {"a":1}\n\ndata: {"b":2}\n\n'])).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('reassembles events split at any byte', () => {
    const text = 'data: first\r\n\r\n: keep-alive\n\nevent: x\ndata: line one\ndata: line two\n\n';
    const whole = parseAll([text]);
    for (let cut = 1; cut < text.length; cut += 1) {
      expect(parseAll([text.slice(0, cut), text.slice(cut)])).toEqual(whole);
    }
    expect(whole).toEqual(['first', 'line one\nline two']);
  });

  it('flushes a final event that lacks its blank line', () => {
    expect(parseAll(['data: [DONE]'])).toEqual(['[DONE]']);
  });

  it('keeps leading spaces beyond the first and ignores other fields', () => {
    expect(parseAll(['id: 1\nretry: 10\ndata:  two spaces\n\n'])).toEqual([' two spaces']);
  });
});

describe('readSseStream', () => {
  it('decodes multi-byte characters split across chunks', async () => {
    const bytes = new TextEncoder().encode('data: Tiếng Việt ¿qué?\n\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    const events: string[] = [];
    await readSseStream(stream, (data) => events.push(data));
    expect(events).toEqual(['Tiếng Việt ¿qué?']);
  });
});
