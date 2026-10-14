import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PWAProvider } from '../providers/PWAProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { AppLayout } from './AppLayout';

function renderShell(initialPath = '/') {
  return render(
    <ThemeProvider defaultTheme="dark">
      <PWAProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div data-testid="page-content">Dashboard View</div>} />
              <Route
                path="/transactions"
                element={<div data-testid="page-content">Transactions View</div>}
              />
              <Route
                path="/budgets"
                element={<div data-testid="page-content">Budgets View</div>}
              />
              <Route
                path="/accounts"
                element={<div data-testid="page-content">Accounts View</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </PWAProvider>
    </ThemeProvider>
  );
}

describe('AppLayout & Layout Components', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders topbar branding, content outlet and navigation', () => {
    renderShell('/');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('BPE')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toHaveTextContent('Dashboard View');
    expect(screen.getByRole('navigation', { name: /navegación móvil/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navegación de escritorio/i })).toBeInTheDocument();
  });

  it('toggles theme through the topbar button', () => {
    renderShell('/');

    const themeToggle = screen.getByRole('button', { name: /cambiar tema/i });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      themeToggle.click();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('displays offline banner when network disconnects', () => {
    renderShell('/');

    expect(screen.queryByText(/modo sin conexión/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/modo sin conexión/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText(/modo sin conexión/i)).not.toBeInTheDocument();
  });

  it('renders and triggers install button when PWA installation is available', () => {
    renderShell('/');

    expect(screen.queryByRole('button', { name: /instalar app/i })).not.toBeInTheDocument();

    act(() => {
      const mockEvent = Object.assign(new Event('beforeinstallprompt'), {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: 'accepted' }),
        preventDefault: () => {},
      });
      window.dispatchEvent(mockEvent);
    });

    expect(screen.getByRole('button', { name: /instalar app/i })).toBeInTheDocument();
  });
});
