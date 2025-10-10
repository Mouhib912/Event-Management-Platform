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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bienvenue, {user?.name || 'Utilisateur'}
        </h1>
        <p className="text-blue-100">
          Connecté en tant que {user?.role || 'Utilisateur'} • Tableau de bord principal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stat.change}
                  </span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
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
                    className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className={`p-3 rounded-full ${action.color} text-white mb-2`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-sm text-center">{action.title}</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {action.description}
                    </p>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
            <CardDescription>
              Dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
