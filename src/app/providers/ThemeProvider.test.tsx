import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

function TestConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolvedTheme">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders with default dark theme and adds dark class to documentElement', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('changes theme to light and removes dark class', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Set Light').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('finanzas_theme')).toBe('light');
  });

  it('throws an error when useTheme is used outside of ThemeProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow(/useTheme debe ser utilizado dentro de un ThemeProvider/i);
  });
});
