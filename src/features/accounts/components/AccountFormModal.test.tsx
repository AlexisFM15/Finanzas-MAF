import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountFormModal } from './AccountFormModal';
import type { Account } from '@/domain/models';

describe('AccountFormModal', () => {
  it('submits valid new cash account data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AccountFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/nueva cuenta/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre de la cuenta/i), {
      target: { value: 'Billetera Principal' },
    });
    fireEvent.change(screen.getByLabelText(/saldo inicial/i), {
      target: { value: '1500,50' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cuenta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Billetera Principal',
          openingBalance: 150050,
          currency: 'DOP',
          archived: false,
        }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('displays loan fields when loan type is selected and submits loan data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AccountFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const typeSelect = screen.getByLabelText(/tipo de cuenta/i);
    fireEvent.change(typeSelect, { target: { value: 'loan' } });

    expect(screen.getByLabelText(/monto del préstamo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tasa de interés anual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/plazo en meses/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre de la cuenta/i), {
      target: { value: 'Préstamo Auto' },
    });
    fireEvent.change(screen.getByLabelText(/monto del préstamo/i), {
      target: { value: '50000' },
    });
    fireEvent.change(screen.getByLabelText(/tasa de interés anual/i), {
      target: { value: '12' }, // 12%
    });
    fireEvent.change(screen.getByLabelText(/plazo en meses/i), {
      target: { value: '36' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cuenta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Préstamo Auto',
          type: 'loan',
          openingBalance: -5000000, // Loans start as negative debt
          loan: expect.objectContaining({
            principal: 5000000,
            annualRate: 0.12,
            termMonths: 36,
          }),
        }),
      );
    });
  });

  it('pre-populates form in edit mode and updates account', async () => {
    const accountToEdit: Account = {
      id: 'acc-edit-1',
      name: 'Banco Popular Ahorro',
      type: 'savings',
      currency: 'DOP',
      openingBalance: 300000,
      institution: 'Banco Popular',
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    };

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AccountFormModal
        isOpen={true}
        onClose={onClose}
        accountToEdit={accountToEdit}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/editar cuenta/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/nombre de la cuenta/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Banco Popular Ahorro');

    fireEvent.change(nameInput, { target: { value: 'Banco Popular Nómina' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cuenta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Banco Popular Nómina',
        }),
      );
    });
  });
});
