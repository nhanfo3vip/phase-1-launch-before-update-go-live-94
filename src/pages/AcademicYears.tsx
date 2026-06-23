import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useAcademicYears, useCreateAcademicYear, useUpdateAcademicYear, useDeleteAcademicYear } from '@/hooks/useAcademicYears';
import { useClasses } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { useBranches, useUpdateBranch } from '@/hooks/useBranches';
import { useCatechists } from '@/hooks/useCatechists';
import { Plus, Calendar, Users, GraduationCap, MoreVertical, Pencil, Trash2, Loader2, Database, ChevronDown, ChevronRight, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const BRANCH_COLORS: Record<string, string> = {
  'Chiên Con': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Ấu Nhi': 'bg-pink-100 text-pink-800 border-pink-200',
  'Thiếu Nhi': 'bg-blue-100 text-blue-800 border-blue-200',
  'Nghĩa Sĩ': 'bg-green-100 text-green-800 border-green-200',
  'Hiệp Sĩ': 'bg-purple-100 text-purple-800 border-purple-200',
  'Dự Trưởng': 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AcademicYears() {
  const { data: academicYears, isLoading } = useAcademicYears();
  const { data: classes } = useClasses();
  const { data: students } = useStudents();
  const { data: catechists } = useCatechists();
  const createAcademicYear = useCreateAcademicYear();
  const updateAcademicYear = useUpdateAcademicYear();
  const deleteAcademicYear = useDeleteAcademicYear();
  const updateBranch = useUpdateBranch();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedYearId, setExpandedYearId] = useState<string | null>(null);
  const [newYear, setNewYear] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  // Branches for expanded year
  const { data: expandedBranches } = useBranches(expandedYearId ?? undefined);

  const handleCreateYear = async () => {
    if (!newYear.name || !newYear.start_date || !newYear.end_date) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    createAcademicYear.mutate({
      name: newYear.name,
      start_date: newYear.start_date,
      end_date: newYear.end_date,
      is_active: !academicYears || academicYears.length === 0,
    }, {
      onSuccess: () => {
        setNewYear({ name: '', start_date: '', end_date: '' });
        setIsDialogOpen(false);
      }
    });
  };

  const handleSetActive = (id: string) => {
    updateAcademicYear.mutate({ id, is_active: true });
  };

  const handleDelete = (id: string) => {
    deleteAcademicYear.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getYearStats = (yearId: string) => {
    const yearClasses = (classes || []).filter(c => c.academic_year_id === yearId);
    const classIds = yearClasses.map(c => c.id);
    const yearStudents = (students || []).filter(s => s.class_id && classIds.includes(s.class_id));
    return {
      classCount: yearClasses.length,
      studentCount: yearStudents.length
    };
  };

  const handleAssignLeader = (branchId: string, catechistId: string | null) => {
    updateBranch.mutate({
      id: branchId,
      leader_catechist_id: catechistId || null,
    });
  };

  return (
    <MainLayout 
      title="Quản lý Niên khóa" 
      subtitle="Tạo và quản lý các niên khóa học — Tự động tạo 6 ngành mỗi niên khóa"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Tổng cộng {academicYears?.length || 0} niên khóa
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="mr-2 h-4 w-4" />
                Tạo niên khóa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo niên khóa mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin niên khóa mới. Hệ thống sẽ tự động tạo 6 ngành: Chiên Con, Ấu Nhi, Thiếu Nhi, Nghĩa Sĩ, Hiệp Sĩ, Dự Trưởng.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="yearName">Tên niên khóa</Label>
                  <Input
                    id="yearName"
                    placeholder="VD: 2025-2026"
                    value={newYear.name}
                    onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newYear.start_date}
                      onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newYear.end_date}
                      onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateYear} disabled={createAcademicYear.isPending}>
                  {createAcademicYear.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo niên khóa'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Academic Years Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : academicYears && academicYears.length > 0 ? (
          <div className="space-y-4">
            {academicYears.map((year, index) => {
              const stats = getYearStats(year.id);
              const isExpanded = expandedYearId === year.id;
              return (
                <Card 
                  key={year.id} 
                  variant={year.is_active ? 'gold' : 'elevated'}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {year.name}
                        {year.is_active && (
                          <Badge variant="success">Đang hoạt động</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(year.start_date)} - {formatDate(year.end_date)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedYearId(isExpanded ? null : year.id)}
                        className="text-muted-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        {isExpanded ? 'Ẩn ngành' : 'Xem ngành'}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!year.is_active && (
                            <DropdownMenuItem onClick={() => handleSetActive(year.id)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Kích hoạt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(year.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{stats.classCount}</p>
                          <p className="text-xs text-muted-foreground">Chi đoàn</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{stats.studentCount}</p>
                          <p className="text-xs text-muted-foreground">Đoàn viên</p>
                        </div>
                      </div>
                    </div>

                    {/* Branches expanded view */}
                    {isExpanded && (
                      <div className="mt-2 border-t pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4" />
                          Các ngành trong niên khóa
                        </h4>
                        {expandedBranches ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {expandedBranches.map((branch) => {
                              const colorClass = BRANCH_COLORS[branch.name] || 'bg-gray-100 text-gray-800 border-gray-200';
                              const branchClasses = (classes || []).filter(c => c.branch_id === branch.id);
                              return (
                                <div
                                  key={branch.id}
                                  className={`rounded-lg border p-3 ${colorClass} space-y-2`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm">{branch.name}</span>
                                    <span className="text-xs font-medium">{branchClasses.length} chi đoàn</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                                    <Select
                                      value={branch.leader_catechist_id || 'none'}
                                      onValueChange={(val) => handleAssignLeader(branch.id, val === 'none' ? null : val)}
                                    >
                                      <SelectTrigger className="h-7 text-xs border-0 bg-white/50 px-2">
                                        <SelectValue placeholder="Chọn trưởng ngành..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">— Chưa phân công —</SelectItem>
                                        {(catechists || []).map(cat => (
                                          <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card variant="flat" className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có niên khóa nào</h3>
              <p className="text-muted-foreground text-center mb-4">
                Bắt đầu bằng việc tạo niên khóa đầu tiên. Hệ thống sẽ tự động tạo 6 ngành!
              </p>
              <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo niên khóa đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
