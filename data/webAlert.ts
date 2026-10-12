// React Native Web ships Alert.alert as an empty function, so on the web build every confirmation,
// error and "done" message was silently dropped. This maps it onto the browser's dialogs.
export type AlertButtonLike = { onPress?: (value?: string) => void; style?: 'default' | 'cancel' | 'destructive'; text?: string };

type DialogWindow = { alert: (message: string) => void; confirm: (message: string) => boolean };

export function showWebAlert(title: string, message: string | undefined, buttons: AlertButtonLike[] | undefined, win: DialogWindow) {
  const text = [title, message].filter((part) => part && part.trim()).join('\n\n');
  const list = buttons ?? [];
  const cancel = list.find((button) => button.style === 'cancel');
  const actions = list.filter((button) => button !== cancel);

  if (!cancel && actions.length <= 1) {
    win.alert(text);
    actions[0]?.onPress?.();
    return;
  }
  // A browser dialog has two outcomes: OK runs the first action (destructive first), Cancel the rest.
  const primary = actions.find((button) => button.style === 'destructive') ?? actions[0];
  const label = primary?.text ? `\n\n[OK = ${primary.text}]` : '';
  if (win.confirm(text + label)) primary?.onPress?.();
  else cancel?.onPress?.();
}

export function installWebAlert(alertApi: { alert: unknown }, win: DialogWindow) {
  alertApi.alert = (title: string, message?: string, buttons?: AlertButtonLike[]) => showWebAlert(title, message, buttons, win);
}
