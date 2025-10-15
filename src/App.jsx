import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Statistics from './components/Statistics'
import Suppliers from './components/Suppliers'
import Clients from './components/Clients'
import Contacts from './components/Contacts'
import Products from './components/Products'
import StandSimulator from './components/StandSimulator'
import StandCatalog from './components/StandCatalog'
import Achat from './components/Achat'
import Invoices from './components/Invoices'
import UserManagement from './components/UserManagement'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/products" element={<Products />} />
            <Route path="/stand-simulator" element={<StandSimulator />} />
            <Route path="/stand-catalog" element={<StandCatalog />} />
            <Route path="/achat" element={<Achat />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/user-management" element={<UserManagement />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
