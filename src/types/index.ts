export type ExpenseType = 'fixed' | 'variable';
export type CategoryType = 'income' | 'expense';
export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  income_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  expense_type: ExpenseType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MonthlyReport {
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  savings: number;
  savings_percentage: number;
  fixed_expenses: number;
  variable_expenses: number;
}

export interface AnnualReport {
  year: number;
  total_income: number;
  total_expenses: number;
  savings: number;
  savings_percentage: number;
  monthly_data: MonthlyReport[];
}

export interface DashboardData {
  current_month: MonthlyReport;
  previous_month: MonthlyReport | null;
  income_change: number | null;
  expense_change: number | null;
  savings_change: number | null;
}

export interface CategoryBreakdown {
  category_name: string;
  category_icon: string | null;
  total: number;
  percentage: number;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  expenseType?: ExpenseType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}
