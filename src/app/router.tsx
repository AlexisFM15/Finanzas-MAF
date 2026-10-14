import { createBrowserRouter } from 'react-router';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { AppLayout } from './layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'budgets',
        element: <BudgetsPage />,
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
    ],
  },
]);
