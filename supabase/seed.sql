-- ==============================================================================
-- PAISAWISE: Seed Data for Categories
-- ==============================================================================

-- Standard Expense Categories (user_id IS NULL implies system-wide default)
INSERT INTO public.categories (name, type, icon, color) VALUES
('Food & Dining', 'expense', 'Utensils', '#f97316'),
('Groceries', 'expense', 'ShoppingBag', '#84cc16'),
('Transport', 'expense', 'Car', '#06b6d4'),
('Shopping', 'expense', 'ShoppingBag', '#ec4899'),
('Entertainment', 'expense', 'Film', '#8b5cf6'),
('Bills & Utilities', 'expense', 'Zap', '#eab308'),
('Healthcare', 'expense', 'Activity', '#ef4444'),
('Education', 'expense', 'BookOpen', '#3b82f6'),
('Rent & Housing', 'expense', 'Home', '#6366f1'),
('Subscriptions', 'expense', 'CreditCard', '#a855f7'),
('Travel', 'expense', 'Compass', '#14b8a6'),
('Other Expense', 'expense', 'MoreHorizontal', '#64748b')
ON CONFLICT DO NOTHING;

-- Standard Income Categories
INSERT INTO public.categories (name, type, icon, color) VALUES
('Salary', 'income', 'Briefcase', '#10b981'),
('Freelance', 'income', 'Laptop', '#059669'),
('Business', 'income', 'Building', '#047857'),
('Investments & Interest', 'income', 'TrendingUp', '#3b82f6'),
('Gifts & Bonuses', 'income', 'Gift', '#ec4899'),
('Other Income', 'income', 'DollarSign', '#64748b')
ON CONFLICT DO NOTHING;
