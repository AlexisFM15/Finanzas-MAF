import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App (smoke)', () => {
  it('renders the app title as the single h1', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Finanzas Personales');
  });

  it('lists the four main modules from the spec', () => {
    render(<App />);
    for (const name of ['Dashboard', 'Transacciones', 'Presupuestos y Metas', 'Cuentas']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });
});
