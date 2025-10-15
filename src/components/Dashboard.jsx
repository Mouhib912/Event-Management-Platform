import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Hammer,
  BookOpen
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const stats = [
    {
      title: 'Stands Créés',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: Hammer,
      description: 'Ce mois'
    },
    {
      title: 'Fournisseurs Actifs',
      value: '18',
      change: '+3',
      changeType: 'positive',
      icon: Users,
      description: 'Nouveaux ce mois'
    },
    {
      title: 'Produits Catalogués',
      value: '156',
      change: '+8%',
      changeType: 'positive',
      icon: Package,
      description: 'Total disponible'
    },
    {
      title: 'Chiffre d\'Affaires',
      value: '45,230 TND',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'Ce mois'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'stand_created',
      title: 'Nouveau stand créé',
      description: 'Stand Expo Tech 2024 par Commercial A',
      time: 'Il y a 2 heures',
      status: 'success'
    },
    {
      id: 2,
      type: 'supplier_added',
      title: 'Fournisseur ajouté',
      description: 'TechnoDisplay Solutions',
      time: 'Il y a 4 heures',
      status: 'info'
    },
    {
      id: 3,
      type: 'order_validated',
      title: 'Commande validée',
      description: 'Bon de commande #BC-2024-001',
      time: 'Il y a 6 heures',
      status: 'success'
    },
    {
      id: 4,
      type: 'product_updated',
      title: 'Produit mis à jour',
      description: 'Écran LED 55" - Prix modifié',
      time: 'Il y a 1 jour',
      status: 'warning'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const quickActions = [
    {
      title: 'Créer un Stand',
      description: 'Nouveau simulateur de stand',
      icon: Hammer,
      href: '/stand-simulator',
      color: 'bg-blue-500'
    },
    {
      title: 'Voir Statistiques',
      description: 'Tableaux de bord et KPI',
      icon: BarChart3,
      href: '/statistics',
      color: 'bg-green-500'
    },
    {
      title: 'Catalogue Stands',
      description: 'Parcourir les stands existants',
      icon: BookOpen,
      href: '/stand-catalog',
      color: 'bg-purple-500'
    },
    {
      title: 'Gérer Produits',
      description: 'Ajouter/modifier produits',
      icon: Package,
      href: '/products',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-8 text-white shadow-2xl fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Bienvenue, {user?.name || 'Utilisateur'}
            </h1>
            <p className="text-slate-300 text-lg">
              Connecté en tant que {user?.role || 'Utilisateur'} • Tableau de bord principal
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="card-hover border-0 shadow-lg bg-white/80 backdrop-blur-sm slide-in" style={{animationDelay: `${index * 0.1}s`}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  index === 0 ? 'bg-slate-100' :
                  index === 1 ? 'bg-green-100' :
                  index === 2 ? 'bg-amber-100' :
                  'bg-emerald-100'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    index === 0 ? 'text-slate-700' :
                    index === 1 ? 'text-green-600' :
                    index === 2 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.description}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Hammer className="h-5 w-5 text-slate-700" />
              Actions Rapides
            </CardTitle>
            <CardDescription>
              Accès direct aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <a
                    key={index}
                    href={action.href}
                    className="group flex flex-col items-center p-5 rounded-xl border-2 border-gray-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className={`p-4 rounded-2xl ${action.color} text-white mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-sm text-center text-gray-900">{action.title}</h3>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {action.description}
                    </p>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-slate-700" />
              Activités Récentes
            </CardTitle>
            <CardDescription>
              Dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-slate-50 hover:to-gray-50 transition-all duration-300 border border-gray-100 hover:border-slate-300 hover:shadow-md">
                  <Badge className={`${getStatusColor(activity.status)} shrink-0 mt-0.5 shadow-sm`}>
                    {activity.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Spécifiques au Rôle</CardTitle>
          <CardDescription>
            Fonctionnalités disponibles pour votre rôle : {user?.role || 'Utilisateur'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Votre Rôle</h4>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {user?.role || 'Utilisateur'}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Modules Accessibles</h4>
              <p className="text-sm text-muted-foreground">
                Consultez la navigation latérale pour voir tous les modules disponibles selon votre rôle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
