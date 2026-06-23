import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LearningMaterial {
  id: string;
  class_id: string | null;
  branch_id: string | null;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string;
  week: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  classes?: {
    name: string;
  } | null;
  branches?: {
    id: string;
    name: string;
  } | null;
  uploader?: {
    name: string;
  };
}

export function useLearningMaterials(classId?: string, branchId?: string) {
  return useQuery({
    queryKey: ["learning-materials", classId, branchId],
    queryFn: async () => {
      let query = supabase
        .from("learning_materials")
        .select(
          `
          *,
          classes(name),
          branches(id, name)
        `
        )
        .order("created_at", { ascending: false });

      if (classId && classId !== "all") {
        query = query.eq("class_id", classId);
      }

      if (branchId && branchId !== "all") {
        // Show materials for this branch + Chung (null branch_id)
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch uploader names separately
      const uploaderIds = [
        ...new Set(data?.map((m) => m.uploaded_by).filter(Boolean)),
      ];
      let uploaderMap: Record<string, string> = {};

      if (uploaderIds.length > 0) {
        const { data: catechists } = await supabase
          .from("catechists")
          .select("user_id, name")
          .in("user_id", uploaderIds);

        uploaderMap = (catechists || []).reduce((acc, c) => {
          if (c.user_id) acc[c.user_id] = c.name;
          return acc;
        }, {} as Record<string, string>);
      }

      return (data || []).map((m) => ({
        ...m,
        uploader: m.uploaded_by
          ? { name: uploaderMap[m.uploaded_by] || "N/A" }
          : undefined,
      })) as LearningMaterial[];
    },
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      classId,
      branchId,
      week,
    }: {
      file: File;
      title: string;
      description?: string;
      classId?: string | null;
      branchId?: string | null;
      week?: number;
    }) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      // Upload file to storage
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const fileName = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      
      // Detect file type
      const fileType = fileExt === "docx" || fileExt === "doc" ? "docx" : "pdf";

      // Try different bucket name variations - Supabase bucket names are case-sensitive
      // Try learning_materials first (with underscore), then learning-materials (with dash)
      let bucketName = "learning_materials";
      let uploadError = null;
      
      // Try with underscore first
      let result = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      uploadError = result.error;
      
      // If that fails, try with dash
      if (uploadError && (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket"))) {
        bucketName = "learning-materials";
        result = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });
        uploadError = result.error;
      }

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const availableBuckets = buckets?.map((b) => b.name) || [];
        const bucketExists = availableBuckets.some((name) => 
          name === "learning_materials" || 
          name === "learning-materials" || 
          name === "LEARNING_MATERIALS"
        );
        
        if (!bucketExists) {
          throw new Error(
            `Bucket "learning_materials" hoặc "learning-materials" không tồn tại. ` +
            `Các bucket hiện có: ${availableBuckets.join(", ") || "không có"}. ` +
            `Vui lòng tạo bucket trong Supabase Storage Dashboard.`
          );
        }
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      // Insert record into database
      const { data, error } = await supabase
        .from("learning_materials")
        .insert({
          title,
          description: description || null,
          class_id: classId || null,
          branch_id: branchId || null,
          week: week || null,
          file_url: publicUrl,
          file_type: fileType,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
      toast.success("Upload tài liệu thành công!");
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
      toast.error("Lỗi upload: " + error.message);
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (material: LearningMaterial) => {
      // Delete file from storage if exists
      if (material.file_url) {
        // Try to detect bucket name from URL
        let filePath = null;
        let bucketName = "learning_materials";
        
        // Try with underscore first
        const urlParts1 = material.file_url.split("/learning_materials/");
        if (urlParts1[1]) {
          filePath = urlParts1[1];
          bucketName = "learning_materials";
        } else {
          // Try with dash
          const urlParts2 = material.file_url.split("/learning-materials/");
          if (urlParts2[1]) {
            filePath = urlParts2[1];
            bucketName = "learning-materials";
          }
        }
        
        if (filePath) {
          const { error: deleteError } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);
          
          // If delete fails with one bucket name, try the other
          if (deleteError && deleteError.message?.includes("not found")) {
            const altBucketName = bucketName === "learning_materials" 
              ? "learning-materials" 
              : "learning_materials";
            await supabase.storage
              .from(altBucketName)
              .remove([filePath]);
          }
        }
      }

      // Delete record from database
      const { error } = await supabase
        .from("learning_materials")
        .delete()
        .eq("id", material.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
      toast.success("Đã xóa tài liệu");
    },
    onError: (error: Error) => {
      toast.error("Lỗi xóa tài liệu: " + error.message);
    },
  });
}
