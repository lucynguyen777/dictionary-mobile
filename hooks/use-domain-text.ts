import { useCallback, useEffect, useRef, useState } from 'react';

import type { DomainTextStore, SpecializedGlossaries } from '@/data/specializedGlossaryStore';

// Per-domain text backed by a DomainTextStore (glossaries, sentence memory). Edits show at once and
// are saved after a short pause; leaving the screen saves the last edit.
export function useDomainText(store: DomainTextStore) {
  const [texts, setTexts] = useState<SpecializedGlossaries>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ domainId: string; text: string } | null>(null);

  useEffect(() => {
    const reload = () => {
      // A pending local edit is newer than anything stored; reloading now would revert it.
      if (pendingSave.current) return;
      store.loadTexts().then(setTexts).catch(() => undefined);
    };
    reload();
    const unsubscribe = store.addListener(reload);
    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Leaving the panel right after typing must not drop the last edit.
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (pending) store.saveText(pending.domainId, pending.text).catch(() => undefined);
    };
  }, [store]);

  const setText = useCallback((domainId: string, value: string) => {
    setTexts((current) => ({ ...current, [domainId]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // An unsaved edit in another domain is saved now instead of being replaced.
    const previous = pendingSave.current;
    if (previous && previous.domainId !== domainId) store.saveText(previous.domainId, previous.text).catch(() => undefined);
    pendingSave.current = { domainId, text: value };
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (pending) store.saveText(pending.domainId, pending.text).catch(() => undefined);
    }, 400);
  }, [store]);

  return [texts, setText] as const;
}
