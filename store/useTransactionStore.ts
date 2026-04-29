import transactionService from '@/services/transactionService';
import { create } from 'zustand';

export type Transaction = {
  id: number;
  user_id: number;
  category_id: number;
  category?:
    | string
    | {
        id: number;
        name: string;
        icon?: string;
        is_default?: boolean;
      };
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note?: string;
  receipt_url?: string;
  created_at: string;
};

type Store = {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
  deleteTransaction: (id: number) => Promise<void>;
  updateTransaction: (id: number, t: Partial<Transaction>) => Promise<void>;
  loadTransactions: () => Promise<void>;
};

export const useTransactionStore = create<Store>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  addTransaction: async (t) => {
    try {
      set({ isLoading: true, error: null });
      const newTransaction = await transactionService.createTransaction({
        category_id: t.category_id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        date: t.date,
        note: t.note,
        receipt_url: t.receipt_url,
      });

      set((state) => ({
        transactions: [...state.transactions, newTransaction],
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error adding transaction';
      console.error('Error adding transaction:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setTransactions: (transactions) =>
    set(() => ({
      transactions,
    })),

  deleteTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await transactionService.deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error deleting transaction';
      console.error('Error deleting transaction:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await transactionService.updateTransaction(id, updates);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error updating transaction';
      console.error('Error updating transaction:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadTransactions: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await transactionService.getTransactions();
      set(() => ({
        transactions: response.data || [],
        isLoading: false,
      }));
    } catch (error: any) {
      // Silently handle errors - show empty state instead of crashing
      console.warn('Could not load transactions:', error?.message || error);
      set({ transactions: [], isLoading: false });
    }
  },
}));
