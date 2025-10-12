import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Search, Package, DollarSign, Filter, Tag, Folder, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import apiService from '@/services/api'

export default function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPricingType, setFilterPricingType] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder] = useState('asc')
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    supplier_id: '',
    category_id: '',
    unit: 'Pièce',
    price: '',
    pricing_type: 'Par Jour'
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  // Load data from backend
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load products
      const productsData = await apiService.getProducts()
      setProducts(productsData || [])
      
      // Load suppliers
      const suppliersData = await apiService.getSuppliers()
      setSuppliers(suppliersData || [])
      
      // Load categories
      const categoriesData = await apiService.getCategories()
      setCategories(categoriesData || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erreur lors du chargement des données')
      setProducts([])
      setSuppliers([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user has permission to edit (Propriétaire, Commercial, or Logistique can edit products)
  const canEdit = user?.role && ['Propriétaire', 'Commercial', 'Logistique', 'admin', 'logistics'].includes(user.role)

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || product.category_id?.toString() === filterCategory
      const matchesPricing = filterPricingType === 'all' || product.pricing_type === filterPricingType
      
      return matchesSearch && matchesCategory && matchesPricing
    })

    // Sort products
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch(sortBy) {
        case 'price':
          aVal = a.price || 0
          bVal = b.price || 0
          break
        case 'category':
          aVal = a.category_name || ''
          bVal = b.category_name || ''
          break
        default: // name
          aVal = a.name || ''
          bVal = b.name || ''
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    return filtered
  }

  // Group products by category
  const getProductsByCategory = () => {
    const grouped = {}
    products.forEach(product => {
      const catName = product.category_name || 'Sans catégorie'
      if (!grouped[catName]) {
        grouped[catName] = []
      }
      grouped[catName].push(product)
    })
    return grouped
  }

  const filteredProducts = getFilteredAndSortedProducts()
  const productsByCategory = getProductsByCategory()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.supplier_id || !formData.category_id || !formData.price) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setIsLoading(true)
      
      const productData = {
        name: formData.name,
        description: formData.description,
        category_id: parseInt(formData.category_id),
        supplier_id: parseInt(formData.supplier_id),
        unit: formData.unit,
        price: parseFloat(formData.price),
        pricing_type: formData.pricing_type
      }

      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, productData)
        toast.success('Produit modifié avec succès')
      } else {
        await apiService.createProduct(productData)
        toast.success('Produit ajouté avec succès')
      }

      await loadData() // Reload products
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Erreur lors de l\'enregistrement du produit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      supplier_id: product.supplier_id?.toString() || '',
      category_id: product.category_id?.toString() || '',
      unit: product.unit,
      price: product.price?.toString() || '',
      pricing_type: product.pricing_type
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        setIsLoading(true)
        await apiService.deleteProduct(id)
        toast.success('Produit supprimé avec succès')
        await loadData() // Reload products
      } catch (error) {
        console.error('Error deleting product:', error)
        toast.error('Erreur lors de la suppression du produit')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      supplier_id: '',
      category_id: '',
      unit: 'Pièce',
      price: '',
      pricing_type: 'Par Jour'
    })
    setEditingProduct(null)
    setIsDialogOpen(false)
  }

  // Category CRUD operations
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    
    if (!categoryForm.name) {
      toast.error('Le nom de la catégorie est obligatoire')
      return
    }

    try {
      setIsLoading(true)
      
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, categoryForm)
        toast.success('Catégorie modifiée avec succès')
      } else {
        await apiService.createCategory(categoryForm)
        toast.success('Catégorie créée avec succès')
      }

      await loadData()
      resetCategoryForm()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    })
    setIsCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async (id) => {
    const productsInCategory = products.filter(p => p.category_id === id)
    if (productsInCategory.length > 0) {
      toast.error(`Impossible de supprimer: ${productsInCategory.length} produit(s) utilisent cette catégorie`)
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return
    
    try {
      setIsLoading(true)
      await apiService.deleteCategory(id)
      toast.success('Catégorie supprimée avec succès')
      await loadData()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' })
    setEditingCategory(null)
    setIsCategoryDialogOpen(false)
  }

  const getPricingTypeColor = (type) => {
    return type === 'Par Jour' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  if (isLoading && products.length === 0) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogue Produits</h1>
          <p className="text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} • {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => resetCategoryForm()}>
                  <Folder className="mr-2 h-4 w-4" />
                  Gérer Catégories
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Modifiez la catégorie' : 'Créez une nouvelle catégorie pour organiser vos produits'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Nom *</Label>
                      <Input
                        id="cat-name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        placeholder="Électronique, Mobilier..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-desc">Description</Label>
                      <Textarea
                        id="cat-desc"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="Description de la catégorie"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetCategoryForm}>Annuler</Button>
                    <Button type="submit" disabled={isLoading}>
                      {editingCategory ? 'Modifier' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Modifier Produit' : 'Nouveau Produit'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit au catalogue'}
                  </DialogDescription>
                </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du produit"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du produit"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fournisseur *</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unité de mesure</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unité">Unité</SelectItem>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="mLn">mLn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (TND) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricingType">Type de tarification</Label>
                  <Select value={formData.pricing_type} onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Par Jour">Par Jour</SelectItem>
                      <SelectItem value="Forfait">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {editingProduct ? 'Modifier' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPricingType} onValueChange={setFilterPricingType}>
              <SelectTrigger>
                <DollarSign className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tous types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="Par Jour">Par Jour</SelectItem>
                <SelectItem value="Forfait">Forfait</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products View with Tabs */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">
            <Package className="mr-2 h-4 w-4" />
            Vue Grille
          </TabsTrigger>
          <TabsTrigger value="category">
            <Tag className="mr-2 h-4 w-4" />
            Par Catégorie
          </TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid" className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  {searchTerm || filterCategory !== 'all' || filterPricingType !== 'all'
                    ? 'Aucun produit trouvé pour ces critères.' 
                    : 'Aucun produit enregistré.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {product.description || 'Pas de description'}
                        </CardDescription>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <Tag className="mr-1 h-3 w-3" />
                        {product.category_name || 'Sans catégorie'}
                      </Badge>
                      <Badge variant={product.pricing_type === 'Par Jour' ? 'default' : 'outline'}>
                        {product.pricing_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Fournisseur</p>
                        <p className="font-medium">{product.supplier_name || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Prix</p>
                        <p className="text-2xl font-bold text-primary">
                          {product.price?.toFixed(2)} TND
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unité: {product.unit || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Category View */}
        <TabsContent value="category" className="space-y-6">
          {Object.keys(productsByCategory).length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <Card key={categoryName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Folder className="mr-2 h-5 w-5" />
                        {categoryName}
                      </CardTitle>
                      <CardDescription>
                        {categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    {canEdit && categoryName !== 'Sans catégorie' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const cat = categories.find(c => c.name === categoryName)
                          if (cat) handleEditCategory(cat)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map(product => (
                      <div key={product.id} className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description || 'Pas de description'}
                            </p>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Badge variant={product.pricing_type === 'Par Jour' ? 'default' : 'outline'}>
                            {product.pricing_type}
                          </Badge>
                          <p className="text-lg font-bold text-primary">
                            {product.price?.toFixed(2)} TND
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.supplier_name} • {product.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Category Management Section */}
      {canEdit && categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Catégories</CardTitle>
            <CardDescription>Gérez les catégories de produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const count = products.filter(p => p.category_id === category.id).length
                return (
                  <div key={category.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center">
                          <Folder className="mr-2 h-4 w-4 text-primary" />
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {category.description || 'Pas de description'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={count > 0}
                        >
                          <Trash2 className={`h-3 w-3 ${count > 0 ? 'text-gray-400' : 'text-red-500'}`} />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {count} produit{count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Produits catalogués</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Prix Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length > 0 
                ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
                : 0} TND
            </div>
            <p className="text-xs text-muted-foreground">Par produit</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Catégories Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(products.map(p => p.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">Catégories utilisées</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
