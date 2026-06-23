import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useClasses } from '@/hooks/useClasses';
import { useLearningMaterials, useUploadMaterial, useDeleteMaterial, LearningMaterial } from '@/hooks/useLearningMaterials';
import { useBranches } from '@/hooks/useBranches';
import { useActiveAcademicYear } from '@/hooks/useAcademicYears';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Download, Eye, Calendar, User, Plus, Loader2, Trash2, X, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Materials() {
  const { userRole } = useAuth();
  const { data: activeYear } = useActiveAcademicYear();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: branches } = useBranches(activeYear?.id);

  // Upload scope: 'class', 'branch', or 'all' (Chung)
  const [uploadScope, setUploadScope] = useState<'class' | 'branch' | 'chung'>('branch');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const { data: materials, isLoading: materialsLoading } = useLearningMaterials(selectedClass, selectedBranchFilter);
  const uploadMutation = useUploadMaterial();
  const deleteMutation = useDeleteMaterial();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LearningMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Fetch PDF as blob to bypass CORS/Chrome blocking
  useEffect(() => {
    if (previewMaterial?.file_url) {
      setPdfLoading(true);
      setPdfBlobUrl(null);
      
      fetch(previewMaterial.file_url)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        })
        .catch(err => {
          console.error('Error loading PDF:', err);
          toast.error('Không thể tải PDF để xem trước');
        })
        .finally(() => setPdfLoading(false));
    } else {
      setPdfBlobUrl(null);
    }
    
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [previewMaterial?.file_url]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [week, setWeek] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClassId('');
    setBranchId('');
    setWeek('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc (legacy)
      ];
      const allowedExtensions = ['.pdf', '.docx', '.doc'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
        toast.error('Chỉ hỗ trợ file PDF và Word (DOCX)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File quá lớn (tối đa 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !selectedFile) {
      toast.error('Vui lòng điền tiêu đề và chọn file');
      return;
    }
    if (uploadScope === 'class' && !classId) {
      toast.error('Vui lòng chọn chi đoàn');
      return;
    }
    if (uploadScope === 'branch' && !branchId) {
      toast.error('Vui lòng chọn ngành');
      return;
    }

    await uploadMutation.mutateAsync({
      file: selectedFile,
      title: title.trim(),
      description: description.trim() || undefined,
      classId: uploadScope === 'class' ? classId : null,
      branchId: uploadScope === 'branch' ? branchId : null,
      week: week ? parseInt(week) : undefined,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (material: LearningMaterial) => {
    if (!material.file_url) {
      toast.error('Không tìm thấy file');
      return;
    }

    try {
      toast.loading('Đang tải xuống...', { id: 'download' });
      
      const response = await fetch(material.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Detect file extension from URL or file_type
      const fileExt = material.file_type === 'docx' ? '.docx' : 
                     material.file_url.toLowerCase().includes('.docx') ? '.docx' :
                     material.file_url.toLowerCase().includes('.doc') ? '.doc' : '.pdf';
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.title}${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Tải xuống thành công!', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Lỗi tải xuống. Thử lại sau.', { id: 'download' });
    }
  };

  const isLoading = classesLoading || materialsLoading;

  return (
    <MainLayout 
      title="Tài liệu Giáo án" 
      subtitle="Upload và quản lý tài liệu học tập"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {(classes || []).map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground">
              {materials?.length || 0} tài liệu
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Upload className="mr-2 h-4 w-4" />
                Upload tài liệu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload tài liệu mới</DialogTitle>
                <DialogDescription>
                  Upload file PDF hoặc Word (DOCX) giáo án cho lớp học.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    placeholder="VD: Bài 4: Mười Điều Răn"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {/* Upload scope */}
                <div className="space-y-2">
                  <Label>Phạm vi tài liệu *</Label>
                  <Select value={uploadScope} onValueChange={(v: any) => { setUploadScope(v); setClassId(''); setBranchId(''); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chung">Chung (toàn giáo xứ)</SelectItem>
                      <SelectItem value="branch">Theo Ngành</SelectItem>
                      <SelectItem value="class">Theo Chi đoàn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {uploadScope === 'branch' && (
                  <div className="space-y-2">
                    <Label htmlFor="branchIdUpload">Ngành *</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngành" />
                      </SelectTrigger>
                      <SelectContent>
                        {(branches || []).map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {uploadScope === 'class' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="classId">Chi đoàn *</Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chi đoàn" />
                        </SelectTrigger>
                        <SelectContent>
                          {(classes || []).map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="week">Tuần</Label>
                      <Input
                        id="week"
                        type="number"
                        min="1"
                        placeholder="VD: 4"
                        value={week}
                        onChange={(e) => setWeek(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả nội dung tài liệu..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>File tài liệu *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Kéo thả file PDF hoặc Word vào đây hoặc click để chọn
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Hỗ trợ file PDF và Word (DOCX), tối đa 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending || !title || !selectedFile}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : materials && materials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <Card key={material.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{material.title}</h3>
                      {material.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {material.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {material.branches ? (
                          <Badge variant="secondary">
                            <GitBranch className="mr-1 h-3 w-3" />
                            {material.branches.name}
                          </Badge>
                        ) : material.classes ? (
                          <Badge variant="secondary">
                            {material.classes.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Chung</Badge>
                        )}
                        {material.week && (
                          <Badge variant="outline">Tuần {material.week}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(material.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                        {material.uploader?.name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {material.uploader.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewMaterial(material)}
                      disabled={!material.file_url}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Xem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(material)}
                      disabled={!material.file_url}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Tải
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="flat" className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có tài liệu</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload tài liệu giáo án PDF hoặc Word để chia sẻ với GLV và học viên
              </p>
              <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload tài liệu
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{previewMaterial?.title}</DialogTitle>
                <DialogDescription>
                  {previewMaterial?.classes?.name}
                  {previewMaterial?.week && ` • Tuần ${previewMaterial.week}`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewMaterial && handleDownload(previewMaterial)}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Tải xuống
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted relative">
            {(() => {
              const isDocx = previewMaterial?.file_type === 'docx' || 
                           previewMaterial?.file_url?.toLowerCase().includes('.docx') ||
                           previewMaterial?.file_url?.toLowerCase().includes('.doc');
              
              if (isDocx) {
                // DOCX files cannot be previewed in browser, show download option
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">File Word</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        File Word không thể xem trước trong trình duyệt.
                        <br />
                        Vui lòng tải xuống để xem nội dung.
                      </p>
                      <Button
                        onClick={() => previewMaterial && handleDownload(previewMaterial)}
                        variant="gold"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống file
                      </Button>
                    </div>
                  </div>
                );
              }
              
              // PDF preview
              if (pdfLoading) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Đang tải PDF...</p>
                    </div>
                  </div>
                );
              }
              
              if (pdfBlobUrl) {
                return (
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full h-full border-0"
                    title={previewMaterial?.title || 'PDF Preview'}
                  />
                );
              }
              
              return (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Không thể tải file</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tài liệu "{deleteTarget?.title}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
