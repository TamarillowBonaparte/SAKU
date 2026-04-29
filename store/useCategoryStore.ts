import { DEFAULT_CATEGORIES } from '@/constants/categories';
import categoryService, { Category } from '@/services/categoryService';
import { create } from 'zustand';

type Store = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  getCategoriesByType: (type: 'income' | 'expense') => Category[];
  getCategoryById: (id: number) => Category | undefined;
};

export const useCategoryStore = create<Store>((set, get) => ({
  categories: DEFAULT_CATEGORIES as Category[],
  isLoading: false,
  error: null,

  loadCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      const categories = await categoryService.getCategories();
      set({
        categories: categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES as Category[],
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error loading categories';
      console.error('Error loading categories:', error);
      // Fallback ke default categories ketika error
      set({
        error: errorMessage,
        categories: DEFAULT_CATEGORIES as Category[],
        isLoading: false,
      });
    }
  },

  getCategoriesByType: (type: 'income' | 'expense') => {
    return get().categories.filter((c) => c.type === type);
  },

  getCategoryById: (id: number) => {
    return get().categories.find((c) => c.id === id);
  },
}));
