import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PWAProvider, usePWA } from './PWAProvider';

function TestConsumer() {
  const {
    isOnline,
    canInstall,
    isInstalled,
    needRefresh,
    promptInstall,
    updateServiceWorker,
  } = usePWA();

  return (
    <div>
      <span data-testid="isOnline">{isOnline ? 'online' : 'offline'}</span>
      <span data-testid="canInstall">{canInstall ? 'yes' : 'no'}</span>
      <span data-testid="isInstalled">{isInstalled ? 'yes' : 'no'}</span>
      <span data-testid="needRefresh">{needRefresh ? 'yes' : 'no'}</span>
      <button onClick={() => promptInstall()}>Install</button>
      <button onClick={() => updateServiceWorker(true)}>Update SW</button>
    </div>
  );
}

describe('PWAProvider & PWA Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides online status and updates on online/offline events', () => {
    render(
      <PWAProvider>
        <TestConsumer />
      </PWAProvider>
    );

    expect(screen.getByTestId('isOnline').textContent).toBe('online');

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTestId('isOnline').textContent).toBe('offline');

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByTestId('isOnline').textContent).toBe('online');
  });

  it('captures beforeinstallprompt and handles installation', async () => {
    render(
      <PWAProvider>
        <TestConsumer />
      </PWAProvider>
    );

    expect(screen.getByTestId('canInstall').textContent).toBe('no');

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockInstallPromptEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockInstallPromptEvent);
    });

    expect(screen.getByTestId('canInstall').textContent).toBe('yes');

    await act(async () => {
      screen.getByText('Install').click();
    });

    expect(promptMock).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(screen.getByTestId('canInstall').textContent).toBe('no');
    expect(screen.getByTestId('isInstalled').textContent).toBe('yes');
  });

  it('throws an error when usePWA is used outside of PWAProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      /usePWA debe ser utilizado dentro de un PWAProvider/i
    );
  });
});
