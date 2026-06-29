import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Activity,
  Calendar,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

const navItems = [
  { label: 'Analytics', icon: LayoutDashboard, path: '/iaccess/dashboard' },
  { label: 'Patients', icon: Users, path: '/iaccess/patients' },
  { label: 'Sugar Range', icon: Activity, path: '/iaccess/sugar-range' },
  { label: 'Appointments', icon: Calendar, path: '/iaccess/appointments' },
  { label: 'Chat', icon: MessageSquare, path: '/iaccess/chat' },
  { label: 'Settings', icon: Settings, path: '/iaccess/settings' },
]

function SidebarContent({ expanded, onNavClick, admin, location }) {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const isSuperAdmin = admin?.role === 'superadmin'

  const handleLogout = () => {
    logout()
    navigate('/iaccess/login')
  }

  function renderNavItem({ label, icon: Icon, path, isAdminItem }) {
    const isActive = location.pathname === path
    const button = (
      <Button
        key={path}
        variant="ghost"
        onClick={() => onNavClick(path)}
        className={cn(
          'w-full justify-start gap-3 px-3 text-zinc-400 hover:text-zinc-100',
          !expanded && 'justify-center px-0',
          isActive
            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400'
            : 'hover:bg-zinc-800/50'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {expanded && <span>{label}</span>}
      </Button>
    )

    if (!expanded) {
      return (
        <Tooltip key={path}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-800 text-zinc-100">
            {label}
          </TooltipContent>
        </Tooltip>
      )
    }
    return button
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-4">
        <Activity className="h-6 w-6 shrink-0 text-emerald-400" />
        {expanded && <span className="text-lg font-semibold">SugarCare</span>}
      </div>

      <Separator className="bg-zinc-800" />

      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => renderNavItem(item))}

          {isSuperAdmin && (
            <>
              <Separator className="my-2 bg-zinc-800" />
              {renderNavItem({
                label: 'Admin Management',
                icon: Shield,
                path: '/iaccess/admins',
                isAdminItem: true,
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      <Separator className="bg-zinc-800" />

      <div className="p-3">
        {renderNavItem({
          label: 'Logout',
          icon: LogOut,
          path: '#',
        })}
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleNavClick = (path) => {
    if (path === '#') {
      logout()
      navigate('/iaccess/login')
      return
    }
    navigate(path)
    setMobileOpen(false)
  }

  const getInitials = (name) => {
    if (admin?.firstName) {
      return ((admin.firstName[0] || '') + (admin.lastName?.[0] || '')).toUpperCase()
    }
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastLogin = (date) => {
    if (!date) return null
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const sharedSidebarProps = { expanded, onNavClick: handleNavClick, admin, location }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-zinc-950 text-zinc-100">
        <aside
          className={cn(
            'fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-zinc-800 bg-zinc-900/50 transition-all duration-300 lg:flex',
            expanded ? 'w-60' : 'w-16'
          )}
        >
          <SidebarContent {...sharedSidebarProps} />

          <div className="absolute -right-3 top-20 z-40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((prev) => !prev)}
              className="hidden h-6 w-6 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 lg:flex"
            >
              {expanded ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
        </aside>

        <div
          className={cn(
            'flex flex-1 flex-col transition-all duration-300',
            expanded ? 'lg:pl-60' : 'lg:pl-16'
          )}
        >
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 backdrop-blur lg:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-zinc-100 lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-64 border-r-zinc-800 bg-zinc-900 p-0"
                >
                  <SidebarContent
                    expanded={true}
                    onNavClick={handleNavClick}
                    admin={admin}
                    location={location}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 md:flex">
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-100">
                    {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}` : admin?.name || 'Admin'}
                  </p>
                  {admin?.last_login && (
                    <p className="text-xs text-zinc-500">
                      Last login: {formatLastLogin(admin.last_login)}
                    </p>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  {admin?.avatar && (
                    <AvatarImage src={admin.avatar} alt={admin.name} />
                  )}
                  <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
                    {getInitials(admin?.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout()
                  navigate('/iaccess/login')
                }}
                className="text-zinc-400 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
