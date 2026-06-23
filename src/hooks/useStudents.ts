import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  student_id: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  phone: string | null;
  parent_phone: string | null;
  address: string | null;
  baptism_name: string | null;
  avatar_url: string | null;
  class_id: string | null;
  user_id: string | null;
  enrollment_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
  } | null;
}

export function useStudents(classId?: string) {
  return useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          classes (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Student[];
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            id,
            name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Student | null;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'classes'>) => {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Đã thêm học viên thành công');
    },
    onError: (error) => {
      console.error('Error creating student:', error);
      toast.error('Không thể thêm học viên');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
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
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Đã cập nhật học viên thành công');
    },
    onError: (error) => {
      console.error('Error updating student:', error);
      toast.error('Không thể cập nhật học viên');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Đã xóa học viên thành công');
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      toast.error('Không thể xóa học viên');
    },
  });
}
