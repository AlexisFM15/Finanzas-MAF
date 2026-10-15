import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetsPage } from './BudgetsPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useBudgetsStore } from '@/state/useBudgetsStore';

describe('BudgetsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useBudgetsStore.getState().loadData(repo);
  });

  it('renders budgets list and switches to goals tab', async () => {
    render(<BudgetsPage repo={repo} />);

    expect(await screen.findByText(/presupuestos y metas/i)).toBeInTheDocument();
    expect(screen.getByText(/total presupuestado/i)).toBeInTheDocument();

    const goalsTab = screen.getByRole('tab', { name: /metas de ahorro/i });
    fireEvent.click(goalsTab);

    expect(await screen.findByText(/Fondo de Emergencia/i)).toBeInTheDocument();
  });

  it('opens new budget modal when clicking Nuevo Presupuesto button', async () => {
    render(<BudgetsPage repo={repo} />);

    const newBtn = await screen.findByRole('button', { name: /nuevo presupuesto/i });
    fireEvent.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nuevo presupuesto/i })).toBeInTheDocument();
  });
});
