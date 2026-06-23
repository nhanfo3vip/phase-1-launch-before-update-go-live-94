import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BranchInfo {
  id: string;
  name: string;
  academic_year_id: string;
  leader_catechist_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  academic_years?: {
    id: string;
    name: string;
  } | null;
  catechists?: {
    id: string;
    name: string;
    user_id: string | null;
  } | null;
  classes?: { count: number }[];
}

export function useBranches(academicYearId?: string) {
  return useQuery({
    queryKey: ['branches', academicYearId],
    queryFn: async () => {
      let query = supabase
        .from('branches')
        .select(`
          *,
          academic_years (id, name),
          catechists:leader_catechist_id (id, name, user_id),
          classes (count)
        `)
        .order('name');

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BranchInfo[];
    },
  });
}

export function useMyBranch() {
  return useQuery({
    queryKey: ['my-branch'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find the catechist record for this user
      const { data: catechist } = await supabase
        .from('catechists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!catechist) return null;

      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          academic_years (id, name),
          classes (count)
        `)
        .eq('leader_catechist_id', catechist.id)
        .maybeSingle();

      if (error) throw error;
      return data as BranchInfo | null;
    },
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branch: {
      name: string;
      academic_year_id: string;
      leader_catechist_id?: string | null;
      description?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('branches')
        .insert(branch)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Tạo ngành thành công');
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('Tên ngành đã tồn tại trong niên khóa này');
      } else {
        toast.error('Lỗi tạo ngành: ' + error.message);
      }
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      leader_catechist_id?: string | null;
      description?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Cập nhật ngành thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi cập nhật ngành: ' + error.message);
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Xóa ngành thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi xóa ngành: ' + error.message);
    },
  });
}
