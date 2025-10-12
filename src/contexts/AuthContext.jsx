import React, { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      apiService.setToken(token)
      // Verify token is still valid
      apiService.request('/auth/me')
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token')
          apiService.setToken(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    apiService.logout()
    setUser(null)
  }

  const hasPermission = (requiredRole) => {
    if (!user) return false
    
    // Map backend roles to frontend roles
    const roleMapping = {
      'admin': 'Propriétaire',
      'logistics': 'Logistique',
      'finance': 'Finance',
      'commercial': 'Commercial',
      'visitor': 'Visiteur'
    }
    
    const mappedUserRole = roleMapping[user.role.toLowerCase()] || user.role
    
    const roleHierarchy = {
      'Propriétaire': 5,
      'Commercial': 4,
      'Logistique': 3,
      'Finance': 2,
      'Visiteur': 1
    }
    
    const userLevel = roleHierarchy[mappedUserRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }

  const canAccess = (module) => {
    if (!user) return false
    
    // Map backend roles to frontend roles
    const roleMapping = {
      'admin': 'Propriétaire',
      'logistics': 'Logistique',
      'finance': 'Finance',
      'commercial': 'Commercial',
      'visitor': 'Visiteur'
    }
    
    const mappedUserRole = roleMapping[user.role.toLowerCase()] || user.role
    
    const permissions = {
      'dashboard': ['Propriétaire', 'Commercial', 'Logistique', 'Finance', 'Visiteur'],
      'stand-simulator': ['Propriétaire', 'Commercial'],
      'stand-catalog': ['Propriétaire', 'Commercial', 'Logistique', 'Finance', 'Visiteur'],
      'achat': ['Propriétaire', 'Commercial', 'Logistique', 'Finance'],
      'invoices': ['Propriétaire', 'Commercial', 'Finance'],
      'statistics': ['Propriétaire', 'Commercial', 'Finance', 'Visiteur'],
      'products': ['Propriétaire', 'Commercial', 'Logistique'],
      'suppliers': ['Propriétaire', 'Logistique'],
      'categories': ['Propriétaire'],
      'user-management': ['Propriétaire']
    }
    
    return permissions[module]?.includes(mappedUserRole) || false
  }

  const value = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    canAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
