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
  ContactRound
} from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const getNavigationItems = () => {
    const items = []

    // Dashboard - available to all
    if (canAccess('dashboard')) {
      items.push({ 
        path: '/dashboard', 
        label: 'Tableau de Bord', 
        icon: LayoutDashboard
      })
    }

    // User Management - Owner only
    if (canAccess('user-management')) {
      items.push({ 
        path: '/user-management', 
        label: 'Gestion Utilisateurs', 
        icon: UserPlus 
      })
    }

    // Stand Simulator
    if (canAccess('stand-simulator')) {
      items.push({ 
        path: '/stand-simulator', 
        label: 'Créer un Stand', 
        icon: Hammer 
      })
    }

    // Stand Catalog
    if (canAccess('stand-catalog')) {
      items.push({ 
        path: '/stand-catalog', 
        label: 'Catalogue des Stands', 
        icon: FolderOpen 
      })
    }

    // Purchase Module
    if (canAccess('achat')) {
      items.push({ 
        path: '/achat', 
        label: 'Module Achat', 
        icon: ShoppingCart 
      })
    }

    // Invoices
    if (canAccess('invoices')) {
      items.push({ 
        path: '/invoices', 
        label: 'Factures Clients', 
        icon: FileText 
      })
    }

    // Statistics
    if (canAccess('statistics')) {
      items.push({ 
        path: '/statistics', 
        label: 'Statistiques', 
        icon: BarChart3 
      })
    }

    // Contacts (unified view - replaces Suppliers and Clients)
    if (canAccess('suppliers') || canAccess('clients')) {
      items.push({ 
        path: '/contacts', 
        label: 'Contacts', 
        icon: ContactRound 
      })
    }

    // Products (includes category management)
    if (canAccess('products')) {
      items.push({ 
        path: '/products', 
        label: 'Produits', 
        icon: Package 
      })
    }

    return items
  }

  const navigationItems = getNavigationItems()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-600 via-purple-600 to-purple-700 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
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
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-white text-purple-700 shadow-lg'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
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
              <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {navigationItems.find(item => isActive(item.path))?.label || 'Tableau de Bord'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
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
