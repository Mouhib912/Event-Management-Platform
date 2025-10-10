import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Users, 
  Shield,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import toast from 'react-hot-toast'

function UserManagement({ user }) {
  const [users, setUsers] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  })

  const roles = [
    { 
      value: 'Commercial', 
      label: 'Commercial', 
      description: 'Création/édition/validation stands',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      value: 'Logistique', 
      label: 'Logistique', 
      description: 'Validation logistique',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'Finance', 
      label: 'Finance', 
      description: 'Validation coûts',
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      value: 'Visiteur', 
      label: 'Visiteur', 
      description: 'Lecture seule',
      color: 'bg-gray-100 text-gray-800'
    }
  ]

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: 'Jean Dupont',
        email: 'jean.dupont@company.com',
        role: 'Commercial',
        created_at: '2024-01-15T10:30:00Z',
        last_login: '2024-10-07T09:15:00Z'
      },
      {
        id: 2,
        name: 'Marie Martin',
        email: 'marie.martin@company.com',
        role: 'Logistique',
        created_at: '2024-02-20T14:20:00Z',
        last_login: '2024-10-06T16:45:00Z'
      },
      {
        id: 3,
        name: 'Pierre Durand',
        email: 'pierre.durand@company.com',
        role: 'Finance',
        created_at: '2024-03-10T11:00:00Z',
        last_login: '2024-10-05T13:30:00Z'
      },
      {
        id: 4,
        name: 'Sophie Leroy',
        email: 'sophie.leroy@company.com',
        role: 'Visiteur',
        created_at: '2024-04-05T16:15:00Z',
        last_login: '2024-10-04T10:20:00Z'
      }
    ]
    setUsers(mockUsers)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('Le mot de passe est obligatoire pour un nouveau utilisateur')
      return
    }

    try {
      if (editingUser) {
        // Update user
        const updatedUsers = users.map(u => 
          u.id === editingUser.id 
            ? { ...u, name: formData.name, email: formData.email, role: formData.role }
            : u
        )
        setUsers(updatedUsers)
        toast.success('Utilisateur modifié avec succès!')
      } else {
        // Create new user
        const newUser = {
          id: users.length + 1,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          created_at: new Date().toISOString(),
          last_login: null
        }
        setUsers([...users, newUser])
        toast.success('Utilisateur créé avec succès!')
      }

      setShowCreateDialog(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: '' })
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setUsers(users.filter(u => u.id !== userId))
        toast.success('Utilisateur supprimé avec succès!')
      } catch (error) {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const getRoleInfo = (roleName) => {
    return roles.find(r => r.value === roleName) || roles[3]
  }

  const getRoleStats = () => {
    return roles.map(role => ({
      ...role,
      count: users.filter(u => u.role === role.value).length
    }))
  }

  // Only owners can access this component
  if (user?.role !== 'Propriétaire') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Accès non autorisé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Seuls les propriétaires peuvent gérer les utilisateurs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les rôles et permissions de votre équipe</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setEditingUser(null)
            setFormData({ name: '', email: '', password: '', role: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifiez les informations de l\'utilisateur' : 'Ajoutez un nouveau membre à votre équipe'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe {!editingUser && '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                  required={!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingUser ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {getRoleStats().map((role) => (
          <Card key={role.value}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{role.label}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{role.count}</div>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>Gérez les membres de votre équipe et leurs permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Aucun utilisateur</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par créer votre premier utilisateur.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((userData) => {
                const roleInfo = getRoleInfo(userData.role)
                return (
                  <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{userData.name}</h3>
                        <Badge className={roleInfo.color}>
                          {roleInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {userData.email}
                      </p>
                      <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                        <span>Créé le {new Date(userData.created_at).toLocaleDateString('fr-FR')}</span>
                        {userData.last_login && (
                          <span>Dernière connexion: {new Date(userData.last_login).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(userData)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(userData.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions par Rôle</CardTitle>
          <CardDescription>Détail des permissions accordées à chaque rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div key={role.value} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={role.color}>{role.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="text-xs text-muted-foreground">
                  {role.value === 'Commercial' && '• Création et édition de stands\n• Validation des stands créés'}
                  {role.value === 'Logistique' && '• Validation logistique des stands\n• Accès aux informations produits'}
                  {role.value === 'Finance' && '• Validation des coûts\n• Accès aux rapports financiers'}
                  {role.value === 'Visiteur' && '• Consultation des stands approuvés\n• Accès en lecture seule'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserManagement
