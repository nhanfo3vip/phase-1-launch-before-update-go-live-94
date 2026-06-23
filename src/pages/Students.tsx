import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStudents, useCreateStudent, useUpdateStudent, Student } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { useClasses } from '@/hooks/useClasses';
import { Plus, Search, Eye, Pencil, User, Phone, MapPin, Calendar, Loader2, Database, Upload, Download, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { ImportStudentsDialog } from '@/components/students/ImportStudentsDialog';
import { generateStudentCSV, downloadCSV, StudentImportData } from '@/utils/csvUtils';

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const { data: classes } = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    birth_date: '',
    gender: 'male' as 'male' | 'female',
    class_id: '',
    baptism_name: '',
    phone: '',
    parent_phone: '',
    address: ''
  });

  const filteredStudents = (students || []).filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.birth_date || !newStudent.class_id) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const studentId = `HS${new Date().getFullYear()}${String((students?.length || 0) + 1).padStart(3, '0')}`;

    createStudent.mutate({
      student_id: studentId,
      name: newStudent.name,
      birth_date: newStudent.birth_date,
      gender: newStudent.gender,
      class_id: newStudent.class_id,
      baptism_name: newStudent.baptism_name || null,
      phone: newStudent.phone || null,
      parent_phone: newStudent.parent_phone || null,
      address: newStudent.address || null,
      enrollment_date: new Date().toISOString().split('T')[0],
      is_active: true,
      avatar_url: null,
      user_id: null,
    }, {
      onSuccess: async (data) => {
        // Auto-create auth account for student
        try {
          const { error } = await supabase.functions.invoke('create-student-account', {
            body: { 
              student_id: studentId,
              student_db_id: data.id 
            }
          });
          
          if (error) {
            console.error('Error creating student account:', error);
            toast.warning(`Học viên đã được thêm nhưng không tạo được tài khoản đăng nhập`);
          } else {
            toast.success(`Tài khoản: ${studentId} | Mật khẩu: 123456`);
          }
        } catch (err) {
          console.error('Error calling edge function:', err);
        }

        setNewStudent({
          name: '',
          birth_date: '',
          gender: 'male',
          class_id: '',
          baptism_name: '',
          phone: '',
          parent_phone: '',
          address: ''
        });
        setIsDialogOpen(false);
      }
    });
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;

    updateStudent.mutate({
      id: editingStudent.id,
      name: editingStudent.name,
      birth_date: editingStudent.birth_date,
      gender: editingStudent.gender,
      class_id: editingStudent.class_id,
      baptism_name: editingStudent.baptism_name,
      phone: editingStudent.phone,
      parent_phone: editingStudent.parent_phone,
      address: editingStudent.address,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingStudent(null);
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Import students from CSV
  const handleImportStudents = async (importData: Array<StudentImportData & { class_id: string }>) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const studentData of importData) {
      try {
        const studentId = `HS${new Date().getFullYear()}${String((students?.length || 0) + successCount + 1).padStart(3, '0')}`;
        
        const { data, error } = await supabase
          .from('students')
          .insert({
            student_id: studentId,
            name: studentData.name,
            birth_date: studentData.birth_date,
            gender: studentData.gender,
            class_id: studentData.class_id,
            baptism_name: studentData.baptism_name || null,
            address: studentData.address || null,
            enrollment_date: new Date().toISOString().split('T')[0],
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Create auth account and wait for result
        const { data: accountResult, error: accountError } = await supabase.functions.invoke('create-student-account', {
          body: { student_id: studentId, student_db_id: data.id }
        });

        if (accountError) {
          console.error('Edge function error:', accountError);
          errors.push(`${studentData.name}: Không tạo được tài khoản`);
        } else if (accountResult?.error) {
          console.error('Account creation error:', accountResult.error);
          errors.push(`${studentData.name}: ${accountResult.error}`);
        } else {
          console.log('Account created successfully for', studentId, accountResult);
        }

        successCount++;
      } catch (error) {
        console.error('Error importing student:', error);
        errors.push(`${studentData.name}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        errorCount++;
      }
    }

    // Refetch students
    await supabase.from('students').select('id').limit(1);
    window.location.reload();

    if (successCount > 0) {
      toast.success(`Đã import thành công ${successCount} học viên`);
    }
    if (errors.length > 0) {
      console.error('Import errors:', errors);
      toast.error(`Lỗi với ${errors.length} học viên. Xem console để biết chi tiết.`);
    }
  };

  // Export students to CSV
  const handleExportStudents = () => {
    if (!filteredStudents.length) {
      toast.error('Không có học viên để xuất');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = filteredStudents.map(student => ({
        baptism_name: student.baptism_name,
        name: student.name,
        gender: student.gender,
        birth_date: student.birth_date,
        address: student.address,
        class_name: student.classes?.name || ''
      }));

      const csvContent = generateStudentCSV(exportData);
      const className = selectedClass !== 'all' 
        ? classes?.find(c => c.id === selectedClass)?.name?.replace(/\s+/g, '_') || 'all'
        : 'tat_ca';
      downloadCSV(csvContent, `danh_sach_hoc_vien_${className}.csv`);
      
      toast.success('Xuất danh sách thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất danh sách');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout 
      title="Quản lý Học viên" 
      subtitle="Danh sách và thông tin học viên"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card variant="flat" className="border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên hoặc mã HV..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Thêm
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)} disabled={!classes || classes.length === 0}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import từ CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportStudents} disabled={isExporting || !filteredStudents.length}>
                      <Download className="mr-2 h-4 w-4" />
                      Xuất danh sách
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gold" disabled={!classes || classes.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm học viên
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Thêm học viên mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin để thêm học viên vào lớp.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Họ và tên *</Label>
                        <Input
                          id="studentName"
                          placeholder="Nguyễn Văn A"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="baptismName">Tên Thánh</Label>
                        <Input
                          id="baptismName"
                          placeholder="Giuse"
                          value={newStudent.baptism_name}
                          onChange={(e) => setNewStudent({ ...newStudent, baptism_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Ngày sinh *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={newStudent.birth_date}
                          onChange={(e) => setNewStudent({ ...newStudent, birth_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select
                          value={newStudent.gender}
                          onValueChange={(value: 'male' | 'female') => setNewStudent({ ...newStudent, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="female">Nữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classId">Lớp học *</Label>
                      <Select
                        value={newStudent.class_id}
                        onValueChange={(value) => setNewStudent({ ...newStudent, class_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp" />
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">SĐT học viên</Label>
                        <Input
                          id="phone"
                          placeholder="0901234567"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentPhone">SĐT phụ huynh</Label>
                        <Input
                          id="parentPhone"
                          placeholder="0901234567"
                          value={newStudent.parent_phone}
                          onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        placeholder="123 Đường ABC, Quận XYZ"
                        value={newStudent.address}
                        onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleCreateStudent} disabled={createStudent.isPending}>
                      {createStudent.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang thêm...
                        </>
                      ) : (
                        'Thêm học viên'
                      )}
                    </Button>
                  </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <ImportStudentsDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          classes={classes || []}
          onImport={handleImportStudents}
        />

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Tìm thấy {filteredStudents.length} học viên
        </p>

        {/* Students Table */}
        <Card variant="elevated">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã HV</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Tên Thánh</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Giới tính</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow 
                      key={student.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.baptism_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.classes?.name || 'Chưa xếp lớp'}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(student.birth_date)}</TableCell>
                      <TableCell>
                        <Badge variant={student.gender === 'male' ? 'default' : 'gold'}>
                          {student.gender === 'male' ? 'Nam' : 'Nữ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingStudent(student);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Chưa có học viên nào</p>
                <p className="text-sm text-muted-foreground">
                  {!classes || classes.length === 0 
                    ? 'Hãy tạo lớp học trước khi thêm học viên'
                    : 'Nhấn "Thêm học viên" để bắt đầu'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {editingStudent && (
              <>
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa thông tin học viên</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ và tên *</Label>
                      <Input
                        value={editingStudent.name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tên Thánh</Label>
                      <Input
                        value={editingStudent.baptism_name || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, baptism_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ngày sinh *</Label>
                      <Input
                        type="date"
                        value={editingStudent.birth_date}
                        onChange={(e) => setEditingStudent({ ...editingStudent, birth_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Giới tính</Label>
                      <Select
                        value={editingStudent.gender}
                        onValueChange={(value: 'male' | 'female') => setEditingStudent({ ...editingStudent, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lớp học *</Label>
                    <Select
                      value={editingStudent.class_id || ''}
                      onValueChange={(value) => setEditingStudent({ ...editingStudent, class_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SĐT học viên</Label>
                      <Input
                        value={editingStudent.phone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SĐT phụ huynh</Label>
                      <Input
                        value={editingStudent.parent_phone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parent_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Địa chỉ</Label>
                    <Input
                      value={editingStudent.address || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleUpdateStudent} disabled={updateStudent.isPending}>
                    {updateStudent.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Student Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle>Hồ sơ học viên</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedStudent.baptism_name} {selectedStudent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedStudent.student_id}</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ngày sinh</p>
                        <p className="font-medium">{formatDate(selectedStudent.birth_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lớp</p>
                        <p className="font-medium">{selectedStudent.classes?.name || 'Chưa xếp lớp'}</p>
                      </div>
                    </div>
                    {selectedStudent.phone && (
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{selectedStudent.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedStudent.address && (
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Địa chỉ</p>
                          <p className="font-medium">{selectedStudent.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
