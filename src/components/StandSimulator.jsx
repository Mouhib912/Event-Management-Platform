import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import apiService from '../services/api'
import { Plus, Minus, Save, ShoppingCart, Search, Filter, ArrowUpDown, DollarSign } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import toast from 'react-hot-toast'

export default function StandSimulator() {
  const [standName, setStandName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [currency, setCurrency] = useState('TND')
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPricingType, setFilterPricingType] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, contactsData, categoriesData] = await Promise.all([
        apiService.getProducts(),
        apiService.getContacts('all'), // Get ALL contacts, then filter
        apiService.getCategories()
      ])
      setProducts(productsData)
      // Filter active contacts that are clients or both
      setClients(contactsData.filter(c => 
        c.status === 'Actif' && (c.contact_type === 'client' || c.contact_type === 'both')
      ))
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === 'all' || product.category_id === parseInt(filterCategory)
      const matchesPricingType = filterPricingType === 'all' || product.pricing_type === filterPricingType
      
      const matchesMinPrice = !minPrice || product.price >= parseFloat(minPrice)
      const matchesMaxPrice = !maxPrice || product.price <= parseFloat(maxPrice)
      
      return matchesSearch && matchesCategory && matchesPricingType && matchesMinPrice && matchesMaxPrice
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'category':
          return (a.category_name || '').localeCompare(b.category_name || '')
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }

  const filteredProducts = getFilteredAndSortedProducts()

  // Group products by category for category view
  const getProductsByCategory = () => {
    const productsByCategory = {}
    filteredProducts.forEach(product => {
      const categoryName = product.category_name || 'Sans catégorie'
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = []
      }
      productsByCategory[categoryName].push(product)
    })
    return productsByCategory
  }

  const addProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id)
    
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      )
    } else {
      setSelectedProducts(prev => [...prev, { 
        ...product, 
        quantity: 1, 
        days: product.pricing_type === 'Par Jour' ? 1 : 0 
      }])
    }
    
    toast.success(`${product.name} ajouté au stand`)
  }

  const updateQuantity = (productId, change) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.max(1, p.quantity + change) }
          : p
      )
    )
  }

  const updateDays = (productId, days) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, days: Math.max(1, parseInt(days) || 1) }
          : p
      )
    )
  }

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId))
    toast.success('Produit retiré du stand')
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      const basePrice = product.price * product.quantity
      const finalPrice = product.pricing_type === 'Par Jour' 
        ? basePrice * (product.days || 1)
        : basePrice
      return total + finalPrice
    }, 0)
  }

  const saveStand = async () => {
    if (!standName.trim()) {
      toast.error('Veuillez saisir un nom pour le stand')
      return
    }

    if (!clientId) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    if (selectedProducts.length === 0) {
      toast.error('Veuillez ajouter au moins un produit')
      return
    }

    try {
      const standData = {
        name: standName,
        client_id: parseInt(clientId),
        description: `Stand avec ${selectedProducts.length} produit(s)`,
        total_amount: calculateTotal(),
        currency: currency,
        items: selectedProducts.map(product => ({
          product_id: product.id,
          quantity: product.quantity,
          days: product.days || 1,
          unit_price: product.price,
          total_price: product.price * product.quantity * (product.days || 1)
        }))
      }

      await apiService.createStand(standData)
      toast.success('Stand sauvegardé avec succès!')
      
      // Reset form
      setStandName('')
      setClientId('')
      setCurrency('TND')
      setSelectedProducts([])
    } catch (error) {
      console.error('Error saving stand:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulateur de Stand</h1>
          <p className="text-gray-600">
            Créez et configurez votre stand événementiel • {selectedProducts.length} produit(s) sélectionné(s)
          </p>
        </div>
        {selectedProducts.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Total estimé</p>
            <p className="text-2xl font-bold text-blue-600">{calculateTotal().toFixed(2)} TND</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Catalog - Wider column */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Catalogue Produits</CardTitle>
            <CardDescription>Sélectionnez les produits pour votre stand ({filteredProducts.length} produit(s))</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters Section */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres et Tri
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing Type Filter */}
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Select value={filterPricingType} onValueChange={setFilterPricingType}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Type de tarification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="Par Jour">Par Jour</SelectItem>
                      <SelectItem value="Forfait">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom (A-Z)</SelectItem>
                      <SelectItem value="price-asc">Prix croissant</SelectItem>
                      <SelectItem value="price-desc">Prix décroissant</SelectItem>
                      <SelectItem value="category">Catégorie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Prix min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Prix max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>

                {/* Clear Filters */}
                {(searchTerm || filterCategory !== 'all' || filterPricingType !== 'all' || minPrice || maxPrice) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterCategory('all')
                      setFilterPricingType('all')
                      setMinPrice('')
                      setMaxPrice('')
                      setSortBy('name')
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </div>

            {/* Products Display */}
            <Tabs defaultValue="grid" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">Vue Grille</TabsTrigger>
                <TabsTrigger value="category">Par Catégorie</TabsTrigger>
              </TabsList>

              {/* Grid View */}
              <TabsContent value="grid" className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{product.category_name}</Badge>
                        <Badge variant="secondary">{product.pricing_type}</Badge>
                        {selectedProducts.find(p => p.id === product.id) && (
                          <Badge className="bg-green-500">Dans le stand</Badge>
                        )}
                      </div>
                      <p className="font-bold text-blue-600 mt-1">
                        {product.price.toFixed(2)} TND {product.pricing_type === 'Par Jour' ? '/jour' : ''}
                      </p>
                    </div>
                    <Button 
                      onClick={() => addProduct(product)}
                      size="sm"
                      className="ml-4"
                      disabled={selectedProducts.find(p => p.id === product.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun produit trouvé</p>
                    <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </TabsContent>

              {/* Category View */}
              <TabsContent value="category" className="space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(getProductsByCategory()).map(([categoryName, categoryProducts]) => (
                  <Card key={categoryName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{categoryName}</CardTitle>
                      <CardDescription>{categoryProducts.length} produit(s)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{product.pricing_type}</Badge>
                              {selectedProducts.find(p => p.id === product.id) && (
                                <Badge className="bg-green-500 text-xs">Ajouté</Badge>
                              )}
                            </div>
                            <p className="font-bold text-blue-600 text-sm mt-1">
                              {product.price.toFixed(2)} TND {product.pricing_type === 'Par Jour' ? '/jour' : ''}
                            </p>
                          </div>
                          <Button 
                            onClick={() => addProduct(product)}
                            size="sm"
                            disabled={selectedProducts.find(p => p.id === product.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                
                {Object.keys(getProductsByCategory()).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun produit trouvé</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stand Configuration - Sticky sidebar */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader>
            <CardTitle>Configuration du Stand</CardTitle>
            <CardDescription>Configurez votre stand et calculez le coût</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="standName">Nom du Stand *</Label>
                <Input
                  id="standName"
                  value={standName}
                  onChange={(e) => setStandName(e.target.value)}
                  placeholder="Saisissez le nom du stand"
                />
              </div>

              <div>
                <Label htmlFor="currency">Devise *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                    <SelectItem value="GBP">GBP - Livre Sterling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">Client *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un client par nom, email ou entreprise..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Selected Client Display */}
                  {clientId && !clientSearch && (
                    <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">
                            {clients.find(c => c.id.toString() === clientId)?.name}
                          </p>
                          {clients.find(c => c.id.toString() === clientId)?.company && (
                            <p className="text-sm text-blue-600">
                              {clients.find(c => c.id.toString() === clientId)?.company}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClientId('')
                            setClientSearch('')
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Changer
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Client Search Results */}
                  {clientSearch && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {clients
                        .filter(client => {
                          const search = clientSearch.toLowerCase()
                          return (
                            client.name.toLowerCase().includes(search) ||
                            client.email?.toLowerCase().includes(search) ||
                            client.company?.toLowerCase().includes(search) ||
                            client.phone?.includes(search)
                          )
                        })
                        .map(client => (
                          <div
                            key={client.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setClientId(client.id.toString())
                              setClientSearch('')
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{client.name}</p>
                                {client.company && (
                                  <p className="text-sm text-gray-600">{client.company}</p>
                                )}
                                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                  {client.email && <span>📧 {client.email}</span>}
                                  {client.phone && <span>📱 {client.phone}</span>}
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                Sélectionner
                              </Button>
                            </div>
                          </div>
                        ))}
                      {clients.filter(client => {
                        const search = clientSearch.toLowerCase()
                        return (
                          client.name.toLowerCase().includes(search) ||
                          client.email?.toLowerCase().includes(search) ||
                          client.company?.toLowerCase().includes(search)
                        )
                      }).length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                          <p>Aucun client trouvé</p>
                          <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Produits Sélectionnés ({selectedProducts.length})</h3>
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Quantité:</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(product.id, -1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{product.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(product.id, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {product.pricing_type === 'Par Jour' && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Jours:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={product.days}
                                onChange={(e) => updateDays(product.id, e.target.value)}
                                className="w-16 h-7 text-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-right">
                          <span className="font-bold text-blue-600 text-sm">
                            {(product.price * product.quantity * (product.pricing_type === 'Par Jour' ? product.days : 1)).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">{calculateTotal().toFixed(2)} {currency}</span>
                    </div>
                  </div>

                  <Button onClick={saveStand} className="w-full" size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder le Stand
                  </Button>
                </div>
              )}

              {selectedProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun produit sélectionné</p>
                  <p className="text-sm">Ajoutez des produits depuis le catalogue</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
