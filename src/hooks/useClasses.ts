import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassInfo {
  id: string;
  name: string;
  academic_year_id: string;
  branch_id: string | null;
  description: string | null;
  schedule: string | null;
  created_at: string;
  updated_at: string;
  academic_years?: {
    id: string;
    name: string;
  } | null;
  branches?: {
    id: string;
    name: string;
  } | null;
  class_catechists?: {
    id: string;
    is_primary: boolean;
    catechists: {
      id: string;
      name: string;
    };
  }[];
  students?: { count: number }[];
}

export function useClasses(academicYearId?: string, branchId?: string) {
  return useQuery({
    queryKey: ['classes', academicYearId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          academic_years (
            id,
            name
          ),
          branches (
            id,
            name
          ),
          class_catechists (
            id,
            is_primary,
            catechists (
              id,
              name
            )
          ),
          students (count)
        `)
        .order('name');

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as ClassInfo[];
    },
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['class', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          academic_years (
            id,
            name
          ),
          class_catechists (
            id,
            is_primary,
            catechists (
              id,
              name,
              phone,
              email
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classData: { name: string; academic_year_id: string; branch_id?: string | null; description?: string; schedule?: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Đã tạo lớp học thành công');
    },
    onError: (error) => {
      console.error('Error creating class:', error);
      toast.error('Không thể tạo lớp học');
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; schedule?: string; academic_year_id?: string; branch_id?: string | null }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Đã cập nhật lớp học thành công');
    },
    onError: (error) => {
      console.error('Error updating class:', error);
      toast.error('Không thể cập nhật lớp học');
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Đã xóa lớp học thành công');
    },
    onError: (error) => {
      console.error('Error deleting class:', error);
      toast.error('Không thể xóa lớp học');
    },
  });
}

export function useAssignCatechist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, catechistId, isPrimary = false }: { classId: string; catechistId: string; isPrimary?: boolean }) => {
      const { data, error } = await supabase
        .from('class_catechists')
        .insert({
          class_id: classId,
          catechist_id: catechistId,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class'] });
      toast.success('Đã gán giáo lý viên thành công');
    },
    onError: (error) => {
      console.error('Error assigning catechist:', error);
      toast.error('Không thể gán giáo lý viên');
    },
  });
}

export function useRemoveCatechist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, catechistId }: { classId: string; catechistId: string }) => {
      const { error } = await supabase
        .from('class_catechists')
        .delete()
        .eq('class_id', classId)
        .eq('catechist_id', catechistId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class'] });
      toast.success('Đã xóa giáo lý viên khỏi lớp');
    },
    onError: (error) => {
      console.error('Error removing catechist:', error);
      toast.error('Không thể xóa giáo lý viên');
    },
  });
}
