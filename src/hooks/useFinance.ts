import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { todayKey, parseKey, mkKey } from '@/lib/format';

export type Category = {
  id: string; name: string; icon: string; color: string;
  subcategories: string[]; sort_order: number;
};

export type Bill = {
  id: string; month_id: string; category: string; subcategory: string | null;
  description: string; amount: number; due_day: number | null; paid: boolean;
  is_recurring: boolean; installment_current: number | null; installment_total: number | null;
  parent_id: string | null;
};

export type IncomeExtra = { id: string; month_id: string; description: string; amount: number };

export type MonthRow = {
  id: string; year_month: string; income: number; savings_contrib: number;
};

export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as Category[];
    },
  });
}

export function useMonth(monthKey: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['month', user?.id, monthKey],
    enabled: !!user,
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('months').select('*').eq('year_month', monthKey).maybeSingle();
      if (existing) return existing as MonthRow;
      const { data: created, error } = await supabase
        .from('months').insert({ user_id: user!.id, year_month: monthKey }).select('*').single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['months', user?.id] });
      return created as MonthRow;
    },
  });
}

export function useBills(monthId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bills', user?.id, monthId],
    enabled: !!user && !!monthId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills').select('*').eq('month_id', monthId!).order('due_day', { nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as Bill[];
    },
  });
}

export function useIncomesExtra(monthId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['incomes_extra', user?.id, monthId],
    enabled: !!user && !!monthId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incomes_extra').select('*').eq('month_id', monthId!).order('created_at');
      if (error) throw error;
      return (data || []) as unknown as IncomeExtra[];
    },
  });
}

export function useSavings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_log').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const total = (data || []).reduce((s, r: any) => s + (r.kind === 'add' ? Number(r.amount) : -Number(r.amount)), 0);
      return { total, log: data || [] };
    },
  });
}

export function useAllMonths() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['months', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('months').select('*').order('year_month', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MonthRow[];
    },
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => {
    qc.invalidateQueries({ queryKey: ['categories', user?.id] });
    qc.invalidateQueries({ queryKey: ['bills', user?.id] });
    qc.invalidateQueries({ queryKey: ['incomes_extra', user?.id] });
    qc.invalidateQueries({ queryKey: ['savings', user?.id] });
    qc.invalidateQueries({ queryKey: ['month', user?.id] });
    qc.invalidateQueries({ queryKey: ['months', user?.id] });
    qc.invalidateQueries({ queryKey: ['profile', user?.id] });
  };
}
