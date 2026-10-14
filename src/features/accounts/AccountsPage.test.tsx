import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountsPage } from './AccountsPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useAccountsStore } from '@/state/useAccountsStore';

describe('AccountsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    // Preload store with memory repo
    await useAccountsStore.getState().loadAccounts(repo);
  });

  it('renders accounts list and summary from seed data', async () => {
    render(<AccountsPage repo={repo} />);

    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();
    expect(screen.getByText('Banco Popular — Visa Infinite')).toBeInTheDocument();
    expect(screen.getByText('Préstamo Vehículo')).toBeInTheDocument();
    expect(screen.getByText(/patrimonio neto/i)).toBeInTheDocument();
  });

  it('filters accounts by type tabs', async () => {
    render(<AccountsPage repo={repo} />);

    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();

    // Click "Tarjetas" tab
    const cardsTab = screen.getByRole('tab', { name: /tarjetas/i });
    fireEvent.click(cardsTab);

    expect(screen.getByText('Banco Popular — Visa Infinite')).toBeInTheDocument();
    expect(screen.queryByText('Banco BHD — Corriente')).not.toBeInTheDocument();

    // Click "Préstamos" tab
    const loansTab = screen.getByRole('tab', { name: /préstamos/i });
    fireEvent.click(loansTab);

    expect(screen.getByText('Préstamo Vehículo')).toBeInTheDocument();
    expect(screen.queryByText('Banco Popular — Visa Infinite')).not.toBeInTheDocument();
  });

  it('opens new account modal when clicking Nueva Cuenta button', async () => {
    render(<AccountsPage repo={repo} />);

    const newBtn = await screen.findByRole('button', { name: /nueva cuenta/i });
    fireEvent.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nueva cuenta/i })).toBeInTheDocument();
  });

  it('toggles archived accounts visibility', async () => {
    render(<AccountsPage repo={repo} />);

    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();

    // Click archive button on first card
    const archiveBtn = screen.getAllByRole('button', { name: /archivar cuenta/i })[0]!;
    fireEvent.click(archiveBtn);

    // By default, archived accounts are hidden
    await waitFor(() => {
      expect(screen.queryByText('Banco BHD — Corriente')).not.toBeInTheDocument();
    });

    // Toggle "Mostrar archivadas"
    const toggleArchived = screen.getByLabelText(/mostrar archivadas/i);
    fireEvent.click(toggleArchived);

    // Now it should be visible with "Archivada" badge
    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();
    expect(screen.getByText(/^archivada$/i)).toBeInTheDocument();
  });

  it('opens amortization modal when clicking tabla de amortización on loan account', async () => {
    render(<AccountsPage repo={repo} />);

    const amortBtn = await screen.findByRole('button', { name: /tabla de amortización|amortización/i });
    fireEvent.click(amortBtn);

    expect(await screen.findByRole('heading', { name: /cuadro de amortización/i })).toBeInTheDocument();
  });
});
