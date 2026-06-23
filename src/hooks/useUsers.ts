import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'truong_nganh' | 'glv' | 'student';

export interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch catechists (admin/glv)
      const { data: catechists, error: catechistsError } = await supabase
        .from('catechists')
        .select('*')
        .eq('is_active', true);

      if (catechistsError) throw catechistsError;

      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Combine all users with roles
      const usersWithRoles: UserWithRole[] = (roles || []).map(roleRecord => {
        const catechist = catechists?.find(c => c.user_id === roleRecord.user_id);
        const student = students?.find(s => s.user_id === roleRecord.user_id);

        if (catechist) {
          return {
            id: catechist.id,
            user_id: catechist.user_id!,
            name: catechist.name,
            email: catechist.email,
            phone: catechist.phone,
            role: roleRecord.role as AppRole,
            created_at: roleRecord.created_at,
          };
        } else if (student) {
          return {
            id: student.id,
            user_id: student.user_id!,
            name: student.name,
            email: student.phone || null,
            phone: student.phone,
            role: roleRecord.role as AppRole,
            created_at: roleRecord.created_at,
          };
        } else {
          // User has role but no profile (shouldn't happen normally)
          return {
            id: roleRecord.id,
            user_id: roleRecord.user_id,
            name: 'Unknown User',
            email: null,
            phone: null,
            role: roleRecord.role as AppRole,
            created_at: roleRecord.created_at,
          };
        }
      });

      return usersWithRoles;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Get current role to check if we need to sync catechists
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Sync with catechists table
      if (newRole === 'glv' || newRole === 'admin') {
        // If new role is glv/admin, ensure catechist record exists
        const { data: catechist } = await supabase
          .from('catechists')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!catechist) {
          // Create catechist record if doesn't exist
          const { error: catechistError } = await supabase
            .from('catechists')
            .insert({
              user_id: userId,
              name: 'Unknown User',
              email: null,
              is_active: true
            });

          if (catechistError) console.error('Error creating catechist:', catechistError);
        } else {
          // Reactivate if exists
          const { error: reactivateError } = await supabase
            .from('catechists')
            .update({ is_active: true })
            .eq('user_id', userId);

          if (reactivateError) console.error('Error reactivating catechist:', reactivateError);
        }
      } else if (currentRole?.role === 'glv' || currentRole?.role === 'admin') {
        // If changing from glv/admin to student, deactivate catechist
        const { error: deactivateError } = await supabase
          .from('catechists')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (deactivateError) console.error('Error deactivating catechist:', deactivateError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['catechists'] });
      toast.success('Cập nhật vai trò thành công!');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Không thể cập nhật vai trò');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Get user role to determine which table to update
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (userRole?.role === 'student') {
        // Deactivate student
        const { error } = await supabase
          .from('students')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Deactivate catechist (admin/glv)
        const { error } = await supabase
          .from('catechists')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Xóa người dùng thành công!');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa người dùng');
    },
  });
}
