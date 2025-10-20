import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    
    try {
      await login(formData.email, formData.password)
      toast.success('Connexion réussie!')
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8 text-white fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold drop-shadow-lg">
              Plateforme de Gestion Événementielle
            </h1>
            <p className="text-xl text-slate-300">
              Solution complète pour l'organisation d'événements et la création de stands
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="flex items-center space-x-4 glass-effect p-4 rounded-xl hover:scale-105 transition-transform duration-300">
              <div className="p-4 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Gestion ERP/CRM</h3>
                <p className="text-slate-300">Centralisez vos clients et fournisseurs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 glass-effect p-4 rounded-xl hover:scale-105 transition-transform duration-300">
              <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Simulateur de Stands</h3>
                <p className="text-slate-300">Créez et gérez vos stands événementiels</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 glass-effect p-4 rounded-xl hover:scale-105 transition-transform duration-300">
              <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Tableaux de Bord</h3>
                <p className="text-slate-300">Suivez vos KPI en temps réel</p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-slate-400 border-t border-white/20 pt-4">
            Made by Mahmoud BESBES, all rights reserved
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur-lg slide-in">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Connexion
            </CardTitle>
            <CardDescription className="text-base">
              Connectez-vous à votre compte pour accéder à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="h-11 border-2 focus:border-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  className="h-11 border-2 focus:border-slate-400"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
