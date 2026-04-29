/**
 * Default category mapping dengan emoji dan warna latar
 * Source of truth untuk semua kategori di aplikasi
 */
export const CATEGORY_MAP: Record<string, { emoji: string; bg: string }> = {
  MAKANAN: { emoji: '🍽️', bg: '#FEF3C7' },
  TRANSPORTASI: { emoji: '🚗', bg: '#D1FAE5' },
  BELANJA: { emoji: '🛍️', bg: '#FEE2E2' },
  TAGIHAN: { emoji: '🧾', bg: '#E0E7FF' },
  HIBURAN: { emoji: '🎮', bg: '#FCE7F3' },
  KESEHATAN: { emoji: '💊', bg: '#ECFDF5' },
  PENDIDIKAN: { emoji: '📚', bg: '#EFF6FF' },
  GAJI: { emoji: '💰', bg: '#F0FDF4' },
  INVESTASI: { emoji: '📈', bg: '#F0FDF4' },
  BISNIS: { emoji: '💼', bg: '#FFF7ED' },
  DEFAULT: { emoji: '📦', bg: '#F3F4F6' },
};

/**
 * Dapatkan metadata (emoji & warna) untuk kategori tertentu
 */
export const getCategoryMeta = (name: string) =>
  CATEGORY_MAP[name.toUpperCase()] ?? CATEGORY_MAP['DEFAULT'];

/**
 * Default categories untuk income
 */
export const DEFAULT_INCOME_CATEGORIES = [
  { id: 1, name: 'GAJI', type: 'income' as const },
  { id: 2, name: 'INVESTASI', type: 'income' as const },
  { id: 3, name: 'BISNIS', type: 'income' as const },
];

/**
 * Default categories untuk expense
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 11, name: 'MAKANAN', type: 'expense' as const },
  { id: 12, name: 'TRANSPORTASI', type: 'expense' as const },
  { id: 13, name: 'BELANJA', type: 'expense' as const },
  { id: 14, name: 'TAGIHAN', type: 'expense' as const },
  { id: 15, name: 'HIBURAN', type: 'expense' as const },
  { id: 16, name: 'KESEHATAN', type: 'expense' as const },
  { id: 17, name: 'PENDIDIKAN', type: 'expense' as const },
];

/**
 * Semua default categories
 */
export const DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
