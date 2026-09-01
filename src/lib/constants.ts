export const INCOME_TYPES = [
  { value: 'salary', label: 'Salario' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Negocio' },
  { value: 'investments', label: 'Inversiones' },
  { value: 'bonus', label: 'Bonificaciones' },
  { value: 'other', label: 'Otros' },
] as const;

export const EXPENSE_TYPE_LABELS = {
  fixed: 'Fijo',
  variable: 'Variable',
} as const;

export const FREQUENCY_LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
} as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', icon: 'briefcase' },
  { name: 'Freelance', icon: 'laptop' },
  { name: 'Negocio', icon: 'building' },
  { name: 'Inversiones', icon: 'trending-up' },
  { name: 'Bonificaciones', icon: 'gift' },
  { name: 'Otros', icon: 'circle-dot' },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: 'utensils' },
  { name: 'Transporte', icon: 'car' },
  { name: 'Vivienda', icon: 'home' },
  { name: 'Entretenimiento', icon: 'gamepad-2' },
  { name: 'Salud', icon: 'heart-pulse' },
  { name: 'Educación', icon: 'graduation-cap' },
  { name: 'Internet', icon: 'wifi' },
  { name: 'Telefonía', icon: 'smartphone' },
  { name: 'Suscripciones', icon: 'repeat' },
  { name: 'Seguros', icon: 'shield' },
  { name: 'Préstamos', icon: 'landmark' },
  { name: 'Compras', icon: 'shopping-bag' },
  { name: 'Otros', icon: 'circle-dot' },
] as const;

export const PAGE_SIZE = 10;

export const CHART_COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  savings: '#6366f1',
  fixed: '#f59e0b',
  variable: '#8b5cf6',
} as const;

export const CATEGORY_CHART_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#06b6d4',
  '#e11d48',
  '#a855f7',
] as const;
