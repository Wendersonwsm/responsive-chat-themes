import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Investment } from '@/lib/investments';

export function useInvestments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['investments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('investments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Investment[];
    },
  });
}

export function useInvestment(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['investment', user?.id, id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as unknown as Investment | null;
    },
  });
}

export function useCreateInvestment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Sem usuário');
      const { data, error } = await supabase.from('investments').insert({ ...input, user_id: user.id }).select('*').single();
      if (error) throw error;
      return data as unknown as Investment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', user?.id] }),
    meta: { successMessage: 'Investimento criado!' },
  });
}

export function useDeleteInvestment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', user?.id] }),
    meta: { successMessage: 'Investimento removido' },
  });
}
