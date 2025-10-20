import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Package, 
  Tags, 
  Hammer, 
  FolderOpen,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
  UserPlus,
  ContactRound,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openModules, setOpenModules] = useState({
    'stands': true,
    'achat': true,
    'clients': true
  })
  const location = useLocation()
  const { user, logout, canAccess } = useAuth()

  // Map backend roles to display names
  const getRoleDisplayName = (role) => {
    const roleMapping = {
      'admin': 'Administrateur',
      'logistics': 'Logistique',
      'finance': 'Finance',
      'commercial': 'Commercial',
      'visitor': 'Visiteur'
    }
    return roleMapping[role?.toLowerCase()] || role
  }

  const toggleModule = (moduleKey) => {
    setOpenModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }))
  }

  const getModularNavigation = () => {
    const modules = []

    // Dashboard - standalone
    if (canAccess('dashboard')) {
      modules.push({ 
        type: 'single',
        path: '/dashboard', 
        label: 'Tableau de Bord', 
        icon: LayoutDashboard
      })
    }

    // User Management - standalone (Owner only)
    if (canAccess('user-management')) {
      modules.push({ 
        type: 'single',
        path: '/user-management', 
        label: 'Gestion Utilisateurs', 
        icon: UserPlus 
      })
    }

    // Module Stands
    if (canAccess('stand-simulator') || canAccess('stand-catalog')) {
      modules.push({
        type: 'module',
        key: 'stands',
        label: 'Module Stands',
        icon: Hammer,
        items: [
          ...(canAccess('stand-catalog') ? [{ 
            path: '/stand-catalog', 
            label: 'Catalogue des Stands', 
            icon: FolderOpen 
          }] : []),
          ...(canAccess('stand-simulator') ? [{ 
            path: '/stand-simulator', 
            label: 'Créer un Stand', 
            icon: Hammer 
          }] : [])
        ]
      })
    }

    // Module Achat
    if (canAccess('achat') || canAccess('products')) {
      modules.push({
        type: 'module',
        key: 'achat',
        label: 'Module Achat',
        icon: ShoppingCart,
        items: [
          ...(canAccess('products') ? [{ 
            path: '/products', 
            label: 'Produits', 
            icon: Package 
          }] : []),
          ...(canAccess('products') ? [{ 
            path: '/categories', 
            label: 'Catégories', 
            icon: Tags 
          }] : []),
          ...(canAccess('achat') ? [{ 
            path: '/achat', 
            label: 'Bons d\'Achat', 
            icon: ShoppingCart 
          }] : [])
        ]
      })
    }

    // Module Clients & Facturation
    if (canAccess('suppliers') || canAccess('clients') || canAccess('invoices')) {
      modules.push({
        type: 'module',
        key: 'clients',
        label: 'Clients & Facturation',
        icon: Building2,
        items: [
          ...(canAccess('suppliers') || canAccess('clients') ? [{ 
            path: '/contacts', 
            label: 'Contacts', 
            icon: ContactRound 
          }] : []),
          ...(canAccess('invoices') ? [{ 
            path: '/invoices', 
            label: 'Factures Clients', 
            icon: FileText 
          }] : [])
        ]
      })
    }

    // Statistics - standalone
    if (canAccess('statistics')) {
      modules.push({ 
        type: 'single',
        path: '/statistics', 
        label: 'Statistiques', 
        icon: BarChart3 
      })
    }

    return modules
  }

  const navigationModules = getModularNavigation()

  const isActive = (path) => {
    return location.pathname === path
  }

  const isModuleActive = (items) => {
    return items.some(item => location.pathname === item.path)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Hammer className="h-6 w-6" />
            Gestion Événementielle
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3 overflow-y-auto max-h-[calc(100vh-5rem)]">
          <div className="space-y-2">
            {navigationModules.map((module) => (
              module.type === 'single' ? (
                // Single navigation item
                <Link
                  key={module.path}
                  to={module.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(module.path)
                      ? 'bg-white text-slate-900 shadow-lg'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <module.icon className="mr-3 h-5 w-5" />
                  {module.label}
                </Link>
              ) : (
                // Module with collapsible sub-items
                <Collapsible
                  key={module.key}
                  open={openModules[module.key]}
                  onOpenChange={() => toggleModule(module.key)}
                >
                  <CollapsibleTrigger className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isModuleActive(module.items)
                      ? 'bg-white/10 text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}>
                    <div className="flex items-center">
                      <module.icon className="mr-3 h-5 w-5" />
                      {module.label}
                    </div>
                    {openModules[module.key] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 ml-4 space-y-1">
                    {module.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? 'bg-white text-slate-900 shadow-lg'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                {(() => {
                  // Find the active module or single item
                  for (const module of navigationModules) {
                    if (module.type === 'single' && isActive(module.path)) {
                      return module.label
                    } else if (module.type === 'module') {
                      const activeItem = module.items.find(item => isActive(item.path))
                      if (activeItem) return activeItem.label
                    }
                  }
                  return 'Tableau de Bord'
                })()}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full">
                <Badge variant="secondary" className="bg-white/50">
                  {getRoleDisplayName(user?.role)}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Utilisateur'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
