import { describe, expect, it, vi } from 'vitest';

import { createVoiceSearchSession, speechLocaleForLanguage, type SpeechEngine, type VoiceSearchState } from '../data/voiceSearch';

function fakeEngine(options: { available?: boolean; permission?: { canAskAgain?: boolean; granted: boolean } } = {}) {
  let handlers: Parameters<SpeechEngine['subscribe']>[0] | null = null;
  const engine: SpeechEngine & { emit: typeof emit } = {
    abort: vi.fn(() => handlers?.onError({ error: 'aborted' })),
    emit: null as never,
    isAvailable: () => options.available ?? true,
    requestPermission: vi.fn(async () => options.permission ?? { granted: true }),
    start: vi.fn(),
    stop: vi.fn(() => handlers?.onEnd()),
    subscribe: (next) => {
      handlers = next;
      return () => {
        handlers = null;
      };
    },
  };
  const emit = {
    end: () => handlers?.onEnd(),
    error: (error: Parameters<NonNullable<typeof handlers>['onError']>[0]['error']) => handlers?.onError({ error }),
    result: (transcript: string, isFinal: boolean) => handlers?.onResult({ isFinal, transcript }),
  };
  engine.emit = emit;
  return engine;
}

function run(engine: SpeechEngine | null, languageCode = 'en', isOnline = () => true) {
  const states: VoiceSearchState[] = [];
  const session = createVoiceSearchSession(engine, { isOnline, languageCode, onChange: (state) => states.push(state) });
  return { last: () => states[states.length - 1], session, states };
}

describe('voice search session', () => {
  it('turns a final transcript into lookup candidates', async () => {
    const engine = fakeEngine();
    const { last, session } = run(engine, 'vi');
    await session.start();

    expect(engine.start).toHaveBeenCalledWith({ interimResults: true, lang: 'vi-VN', requiresOnDeviceRecognition: false });
    expect(last().status).toBe('listening');
    engine.emit.result('xin', false);
    expect(last()).toMatchObject({ status: 'listening', transcript: 'xin' });
    engine.emit.result('xin chào', true);
    expect(last()).toMatchObject({ candidates: ['xin chào', 'xin', 'chào'], status: 'done' });
  });

  it('uses the partial transcript when the engine ends without a final result', async () => {
    const engine = fakeEngine();
    const { last, session } = run(engine);
    await session.start();
    engine.emit.result('articulate', false);
    session.stop();
    expect(last()).toMatchObject({ candidates: ['articulate'], status: 'done' });
  });

  it('reports unavailable engines without asking for permission', async () => {
    const engine = fakeEngine({ available: false });
    const { last, session } = run(engine);
    await session.start();
    expect(last().status).toBe('unavailable');
    expect(engine.requestPermission).not.toHaveBeenCalled();
    expect(run(null).session).toBeDefined();
  });

  it('explains a denied microphone permission, including the "denied forever" case', async () => {
    const once = run(fakeEngine({ permission: { canAskAgain: true, granted: false } }));
    await once.session.start();
    expect(once.last()).toMatchObject({ errorMessage: 'Cần quyền micro để tìm bằng giọng nói.', status: 'permission-denied' });

    const forever = run(fakeEngine({ permission: { canAskAgain: false, granted: false } }));
    await forever.session.start();
    expect(forever.last().errorMessage).toContain('Cài đặt');
  });

  it('asks for on-device recognition offline and explains a missing offline model', async () => {
    const engine = fakeEngine();
    const { last, session } = run(engine, 'fr', () => false);
    await session.start();
    expect(engine.start).toHaveBeenCalledWith(expect.objectContaining({ lang: 'fr-FR', requiresOnDeviceRecognition: true }));
    engine.emit.error('language-not-supported');
    expect(last()).toMatchObject({ status: 'error' });
    expect(last().errorMessage).toContain('offline');
  });

  it('reports silence and treats a cancel as idle, not an error', async () => {
    const silent = run(fakeEngine());
    await silent.session.start();
    silent.session.stop();
    expect(silent.last()).toMatchObject({ status: 'error' });
    expect(silent.last().errorMessage).toContain('Không nghe thấy');

    const cancelled = run(fakeEngine());
    await cancelled.session.start();
    cancelled.session.cancel();
    expect(cancelled.last().status).toBe('idle');
  });

  it('ignores events after the session finished', async () => {
    const engine = fakeEngine();
    const { session, states } = run(engine);
    await session.start();
    engine.emit.result('book', true);
    const count = states.length;
    engine.emit.result('late', true);
    engine.emit.error('network');
    expect(states).toHaveLength(count);
  });

  it('maps app languages to speech locales', () => {
    expect(speechLocaleForLanguage('en')).toBe('en-US');
    expect(speechLocaleForLanguage('kn')).toBe('kn');
  });
});
