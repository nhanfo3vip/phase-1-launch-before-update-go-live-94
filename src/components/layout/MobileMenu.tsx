import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Users,
  ClipboardCheck,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Star,
  UserCheck,
  Home
} from 'lucide-react';

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Tổng quan', 
    path: '/dashboard',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: CalendarDays, 
    label: 'Niên khóa', 
    path: '/academic-years',
    roles: ['admin']
  },
  { 
    icon: GraduationCap, 
    label: 'Chi đoàn', 
    path: '/classes',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: UserCheck, 
    label: 'Giáo lý viên', 
    path: '/catechists',
    roles: ['admin', 'truong_nganh']
  },
  { 
    icon: Users, 
    label: 'Đoàn viên', 
    path: '/students',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: ClipboardCheck, 
    label: 'Điểm danh', 
    path: '/attendance',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: Star, 
    label: 'Điểm số', 
    path: '/scores',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: BookOpen, 
    label: 'Tài liệu', 
    path: '/materials',
    roles: ['admin', 'truong_nganh', 'glv']
  },
  { 
    icon: BarChart3, 
    label: 'Báo cáo', 
    path: '/reports',
    roles: ['admin', 'truong_nganh']
  },
  { 
    icon: Settings, 
    label: 'Cài đặt', 
    path: '/settings',
    roles: ['admin']
  },
];

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const location = useLocation();
  const { user, signOut, hasRole, userRole } = useAuth();

  const filteredMenu = menuItems.filter(item => 
    hasRole(item.roles as any[])
  );

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Người dùng';
  const roleLabel = userRole === 'admin' ? 'Quản trị viên' : userRole === 'truong_nganh' ? 'Trưởng Ngành' : userRole === 'glv' ? 'Giáo lý viên' : 'Học viên';

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle className="flex items-center gap-3 text-sidebar-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-gold">
              <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-semibold">Giáo Lý</span>
              <span className="text-xs text-sidebar-foreground/60">Xóm Chiếu</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* User info */}
        {user && (
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
