-- FinanzApp Migration: Recurring Incomes
-- Run this in the Supabase SQL Editor to add recurring income support

-- ==============================================
-- 1. RECURRING INCOMES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS recurring_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  income_type VARCHAR(50) NOT NULL DEFAULT 'salary',
  is_salary BOOLEAN DEFAULT FALSE,
  salary_last_business_day BOOLEAN DEFAULT FALSE,
  payment_day INTEGER CHECK (payment_day IS NULL OR (payment_day >= 1 AND payment_day <= 31)),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_incomes_user_id ON recurring_incomes(user_id);
CREATE INDEX idx_recurring_incomes_active ON recurring_incomes(is_active);

-- ==============================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================
ALTER TABLE recurring_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring incomes"
  ON recurring_incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring incomes"
  ON recurring_incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring incomes"
  ON recurring_incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring incomes"
  ON recurring_incomes FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- 3. UPDATED_AT TRIGGER
-- ==============================================
CREATE TRIGGER update_recurring_incomes_updated_at
  BEFORE UPDATE ON recurring_incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
