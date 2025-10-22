import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { 
  Search, 
  Eye, 
  Download, 
  Calendar,
  User,
  DollarSign,
  Package,
  Trash2,
  Edit2
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function StandCatalog() {
  const { user, canAccess } = useAuth()
  const [stands, setStands] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStand, setSelectedStand] = useState(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEditProductsDialog, setShowEditProductsDialog] = useState(false)
  const [editingStand, setEditingStand] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    client_id: '',
    description: ''
  })
  const [editingStandItems, setEditingStandItems] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    loadStands()
  }, [])

  const loadStands = async () => {
    try {
      const standsData = await apiService.getStands()
      setStands(standsData)
    } catch (error) {
      console.error('Error loading stands:', error)
      // Fallback to localStorage for compatibility
      const savedStands = JSON.parse(localStorage.getItem('stands') || '[]')
      setStands(savedStands)
    }
  }

  const filteredStands = stands.filter(stand =>
    stand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stand.creator.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'validated_logistics': return 'bg-blue-100 text-blue-800'
      case 'validated_finance': return 'bg-purple-100 text-purple-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return '✅ Approuvé'
      case 'validated_logistics': return '📦 Validé Logistique'
      case 'validated_finance': return '💰 Validé Finance'
      case 'draft': return '📝 Brouillon'
      default: return status
    }
  }

  const canEdit = canAccess('stand-simulator') || user?.role === 'Propriétaire'
  const canView = canAccess('stand-catalog')

  const viewStandDetails = (stand) => {
    setSelectedStand(stand)
    setShowDetailsDialog(true)
  }

  const exportStandToExcel = (stand) => {
    const data = stand.items.map(item => ({
      'Produit': item.product_name || 'Unknown',
      'Quantité': item.quantity,
      'Jours': item.days || 1,
      'Prix unitaire': item.unit_price,
      'Total': item.total_price
    }))

    // Add summary row
    data.push({
      'Produit': 'TOTAL GÉNÉRAL',
      'Quantité': '',
      'Jours': '',
      'Prix unitaire': '',
      'Total': stand.total
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stand')
    
    const fileName = `Stand_${stand.name.replace(/\s+/g, '_')}_${new Date(stand.created_at).toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast.success('Stand exporté en Excel')
  }

  const deleteStand = (standId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stand ?')) {
      const updatedStands = stands.filter(stand => stand.id !== standId)
      setStands(updatedStands)
      localStorage.setItem('savedStands', JSON.stringify(updatedStands))
      toast.success('Stand supprimé avec succès')
    }
  }

  const handleEdit = (stand) => {
    setEditingStand(stand)
    setEditFormData({
      name: stand.name || '',
      client_id: stand.client_id || '',
      description: stand.description || ''
    })
    setShowEditDialog(true)
  }

  const handleUpdateStand = async () => {
    if (!editFormData.name.trim()) {
      toast.error('Veuillez saisir un nom pour le stand')
      return
    }

    try {
      await apiService.updateStand(editingStand.id, {
        name: editFormData.name,
        description: editFormData.description
      })
      
      toast.success('Stand modifié avec succès!')
      setShowEditDialog(false)
      setEditingStand(null)
      loadStands() // Reload stands to get updated data
    } catch (error) {
      console.error('Error updating stand:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  const handleEditProducts = async (stand) => {
    setEditingStand(stand)
    setLoadingProducts(true)
    
    try {
      // Load products and stand items in parallel
      const [productsData, standItemsData] = await Promise.all([
        apiService.getProducts(),
        apiService.getStandItems(stand.id)
      ])
      
      setAllProducts(productsData)
      setEditingStandItems(standItemsData)
      setShowEditProductsDialog(true)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Erreur lors du chargement des produits')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddProduct = (product) => {
    // Check if product already exists
    const exists = editingStandItems.find(item => item.product_id === product.id)
    if (exists) {
      toast.error('Ce produit est déjà dans le stand')
      return
    }

    // Add product with default values
    const newItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      days: 1,
      unit_price: product.price,
      total_price: product.price
    }
    
    setEditingStandItems(prev => [...prev, newItem])
  }

  const handleRemoveProduct = (productId) => {
    setEditingStandItems(prev => prev.filter(item => item.product_id !== productId))
  }

  const handleUpdateItemQuantity = (productId, quantity) => {
    setEditingStandItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, parseInt(quantity) || 1)
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.days * item.unit_price
        }
      }
      return item
    }))
  }

  const handleUpdateItemDays = (productId, days) => {
    setEditingStandItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newDays = Math.max(1, parseInt(days) || 1)
        return {
          ...item,
          days: newDays,
          total_price: item.quantity * newDays * item.unit_price
        }
      }
      return item
    }))
  }

  const calculateEditingTotal = () => {
    return editingStandItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleSaveProducts = async () => {
    if (editingStandItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit')
      return
    }

    try {
      await apiService.updateStandItems(editingStand.id, editingStandItems)
      toast.success('Produits mis à jour avec succès!')
      setShowEditProductsDialog(false)
      setEditingStand(null)
      setEditingStandItems([])
      loadStands() // Reload stands to get updated data
    } catch (error) {
      console.error('Error updating stand products:', error)
      toast.error('Erreur lors de la mise à jour des produits')
    }
  }

  if (!canView) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour consulter le catalogue des stands.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogue des Stands</h1>
          <p className="text-muted-foreground">
            Consultez tous les stands créés sur la plateforme
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de stand ou créateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStands.map((stand) => (
          <Card key={stand.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{stand.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-3 w-3" />
                      <span>Créé par {stand.creator}</span>
                    </div>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(stand.status)}>
                  {getStatusLabel(stand.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{stand.items.length} produits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stand.total.toFixed(2)} TND</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Créé le {new Date(stand.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewStandDetails(stand)}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportStandToExcel(stand)}
                >
                  <Download className="h-3 w-3" />
                </Button>
                {canEdit && stand.creator === user.name && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(stand)}
                      title="Modifier le nom et description"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProducts(stand)}
                      title="Modifier les produits"
                    >
                      <Package className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStand(stand.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStands.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucun stand trouvé pour cette recherche.' : 'Aucun stand enregistré.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stand Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{selectedStand?.name}</DialogTitle>
            <DialogDescription>
              Créé par {selectedStand?.creator} le {selectedStand && new Date(selectedStand.createdAt).toLocaleDateString('fr-FR')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStand && (
            <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="text-xl font-bold">{selectedStand.items.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={getStatusColor(selectedStand.status)}>
                    {selectedStand.status}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{selectedStand.total.toFixed(2)} TND</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">Produit</th>
                      <th className="border p-2 text-left">Catégorie</th>
                      <th className="border p-2 text-left">Fournisseur</th>
                      <th className="border p-2 text-left">Prix unitaire</th>
                      <th className="border p-2 text-left">Quantité</th>
                      <th className="border p-2 text-left">Jours</th>
                      <th className="border p-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStand.items.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td className="border p-2">{item.product_name || 'Unknown'}</td>
                          <td className="border p-2">{item.category_name || 'N/A'}</td>
                          <td className="border p-2">{item.supplier_name || 'N/A'}</td>
                          <td className="border p-2">{item.unit_price?.toFixed(2) || '0.00'} TND</td>
                          <td className="border p-2">{item.quantity}</td>
                          <td className="border p-2">
                            {item.days || 'N/A'}
                          </td>
                          <td className="border p-2 font-medium">{item.total_price?.toFixed(2) || '0.00'} TND</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-primary/5 font-bold">
                      <td colSpan="6" className="border p-2 text-right">TOTAL GÉNÉRAL:</td>
                      <td className="border p-2">{selectedStand.total.toFixed(2)} TND</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => exportStandToExcel(selectedStand)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter Excel
                </Button>
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Fermer
                </Button>
              </div>
            </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      {stands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Stands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stands.length}</div>
              <p className="text-xs text-muted-foreground">Stands créés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Valeur Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stands.reduce((sum, stand) => sum + stand.total, 0).toFixed(0)} TND
              </div>
              <p className="text-xs text-muted-foreground">Tous les stands</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Coût Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stands.length > 0 
                  ? Math.round(stands.reduce((sum, stand) => sum + stand.total, 0) / stands.length)
                  : 0} TND
              </div>
              <p className="text-xs text-muted-foreground">Par stand</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Créateurs Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(stands.map(stand => stand.creator)).size}
              </div>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Stand Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le Stand</DialogTitle>
            <DialogDescription>
              Modifiez les informations du stand
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du Stand *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Stand Audiovisuel"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du stand"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Note: Pour modifier les produits du stand, veuillez créer un nouveau stand.
            </p>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdateStand}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Products Dialog */}
      <Dialog open={showEditProductsDialog} onOpenChange={setShowEditProductsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les Produits du Stand</DialogTitle>
            <DialogDescription>
              {editingStand?.name} - Ajoutez, modifiez ou supprimez des produits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Products */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Produits actuels ({editingStandItems.length})</h3>
              {editingStandItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun produit sélectionné</p>
              ) : (
                <div className="space-y-2">
                  {editingStandItems.map((item) => (
                    <Card key={item.product_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Prix unitaire: {item.unit_price.toFixed(2)} {editingStand?.currency || 'TND'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div>
                              <Label className="text-xs">Quantité</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.product_id, e.target.value)}
                                className="w-20"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Jours</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.days}
                                onChange={(e) => handleUpdateItemDays(item.product_id, e.target.value)}
                                className="w-20"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Total</Label>
                              <p className="text-sm font-bold text-blue-600 mt-2">
                                {item.total_price.toFixed(2)} {editingStand?.currency || 'TND'}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.product_id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Total */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total du Stand:</span>
                  <span className="font-bold text-xl text-blue-600">
                    {calculateEditingTotal().toFixed(2)} {editingStand?.currency || 'TND'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add Products */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ajouter des Produits</h3>
              {loadingProducts ? (
                <p>Chargement des produits...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {allProducts
                    .filter(product => !editingStandItems.find(item => item.product_id === product.id))
                    .map((product) => (
                      <Card key={product.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleAddProduct(product)}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            <p className="font-bold text-sm">{product.price} TND</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditProductsDialog(false)
                  setEditingStandItems([])
                  setAllProducts([])
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveProducts}>
                <Package className="mr-2 h-4 w-4" />
                Enregistrer les Modifications
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
