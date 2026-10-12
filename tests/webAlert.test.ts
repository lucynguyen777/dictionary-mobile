import { describe, expect, it, vi } from 'vitest';

import { installWebAlert, showWebAlert } from '../data/webAlert';

const fakeWindow = (confirmResult = true) => ({ alert: vi.fn(), confirm: vi.fn(() => confirmResult) });

describe('web Alert.alert', () => {
  it('shows a plain message and runs its only button', () => {
    const win = fakeWindow();
    const onPress = vi.fn();
    showWebAlert('Đã xóa', 'Pack offline đã được xóa.', [{ onPress, text: 'OK' }], win);
    expect(win.alert).toHaveBeenCalledWith('Đã xóa\n\nPack offline đã được xóa.');
    expect(onPress).toHaveBeenCalled();
    showWebAlert('Chỉ tiêu đề', undefined, undefined, win);
    expect(win.alert).toHaveBeenLastCalledWith('Chỉ tiêu đề');
  });

  it('asks for confirmation and runs the destructive action only on OK', () => {
    const remove = vi.fn();
    const cancel = vi.fn();
    const buttons = [{ onPress: cancel, style: 'cancel' as const, text: 'Hủy' }, { onPress: remove, style: 'destructive' as const, text: 'Xóa pack' }];

    const accepting = fakeWindow(true);
    showWebAlert('Xóa pack offline', 'Xóa SQLite pack?', buttons, accepting);
    expect(accepting.confirm).toHaveBeenCalledWith('Xóa pack offline\n\nXóa SQLite pack?\n\n[OK = Xóa pack]');
    expect(remove).toHaveBeenCalledTimes(1);

    showWebAlert('Xóa pack offline', 'Xóa SQLite pack?', buttons, fakeWindow(false));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('replaces the no-op Alert.alert', () => {
    const api = { alert: () => undefined as unknown };
    const win = fakeWindow();
    installWebAlert(api, win);
    (api.alert as (title: string, message?: string) => void)('Xin chào', 'Thử');
    expect(win.alert).toHaveBeenCalledWith('Xin chào\n\nThử');
  });
});
