// Incremental Server-Sent Events parser shared by the backend proxy (reading OpenAI) and the app
// (reading the proxy). Feed decoded text chunks in any split; each complete event's data is emitted.
export function createSseParser(onData: (data: string) => void) {
  let buffer = '';
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length) onData(dataLines.join('\n'));
    dataLines = [];
  };

  const consumeLine = (line: string) => {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== 'data') return;
    const value = colon === -1 ? '' : line.slice(colon + 1);
    dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      let newline = buffer.search(/\r\n|\r|\n/);
      while (newline !== -1) {
        // A trailing '\r' may be the first half of '\r\n' split across chunks; wait for more input.
        if (buffer[newline] === '\r' && newline === buffer.length - 1) break;
        const width = buffer.startsWith('\r\n', newline) ? 2 : 1;
        consumeLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + width);
        newline = buffer.search(/\r\n|\r|\n/);
      }
    },
    // Ends the stream: a final event without its blank line still counts.
    end() {
      if (buffer) consumeLine(buffer.replace(/\r$/, ''));
      buffer = '';
      dispatch();
    },
  };
}

// Reads a fetch body stream as text and feeds it to the parser.
export async function readSseStream(body: ReadableStream<Uint8Array>, onData: (data: string) => void) {
  const parser = createSseParser(onData);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    parser.push(decoder.decode());
    parser.end();
  } finally {
    reader.releaseLock();
  }
}
