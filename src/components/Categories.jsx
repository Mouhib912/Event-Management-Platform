import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import apiService from '@/services/api'

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8884d8'
  })

  // Load categories from backend
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiService.getCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des catégories')
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only Propriétaire/Admin can edit categories
  const canEdit = user?.role === 'Propriétaire' || user?.role === 'Admin' || user?.role === 'admin'

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const colorOptions = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Veuillez saisir un nom de catégorie')
      return
    }

    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, formData)
        toast.success('Catégorie modifiée avec succès')
      } else {
        await apiService.createCategory(formData)
        toast.success('Catégorie ajoutée avec succès')
      }

      await loadCategories()
      resetForm()
    } catch (error) {
      toast.error(editingCategory ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout')
      console.error('Failed to save category:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id)
    if (category && category.product_count > 0) {
      toast.error('Impossible de supprimer une catégorie contenant des produits')
      return
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await apiService.deleteCategory(id)
        toast.success('Catégorie supprimée avec succès')
        await loadCategories()
      } catch (error) {
        toast.error('Erreur lors de la suppression')
        console.error('Failed to delete category:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#8884d8'
    })
    setEditingCategory(null)
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Catégories</h1>
          <p className="text-muted-foreground">
            Organisez vos produits par catégories
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Modifiez les informations de la catégorie' : 'Ajoutez une nouvelle catégorie de produits'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la catégorie *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Audiovisuel, Mobilier..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la catégorie"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {category.product_count || 0} produit{(category.product_count || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <Badge variant="secondary">
                  {(category.product_count || 0) > 0 ? 'Utilisée' : 'Vide'}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Créée le {new Date(category.created_at).toLocaleDateString('fr-FR')}
              </div>
              
              {canEdit && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={(category.product_count || 0) > 0}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Supprimer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucune catégorie trouvée pour cette recherche.' : 'Aucune catégorie enregistrée.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des Catégories</CardTitle>
          <CardDescription>Répartition des produits par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        backgroundColor: category.color,
                        width: `${Math.max(((category.product_count || 0) / Math.max(...categories.map(c => c.product_count || 0))) * 100, 5)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {category.product_count || 0} produits
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
