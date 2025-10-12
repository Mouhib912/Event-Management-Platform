import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { Plus, Minus, Save, ShoppingCart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import toast from 'react-hot-toast'

export default function StandSimulator() {
  const { user } = useAuth()
  const [standName, setStandName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, clientsData] = await Promise.all([
        apiService.getProducts(),
        apiService.getClients()
      ])
      setProducts(productsData)
      setClients(clientsData.filter(c => c.status === 'Actif'))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-600">Créez et configurez votre stand événementiel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Catalog */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue Produits</CardTitle>
            <CardDescription>Sélectionnez les produits pour votre stand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{product.category_name}</Badge>
                      <Badge variant="secondary">{product.pricing_type}</Badge>
                    </div>
                    <p className="font-bold text-blue-600 mt-1">
                      {product.price.toFixed(2)} TND {product.pricing_type === 'Par Jour' ? '/jour' : ''}
                    </p>
                  </div>
                  <Button 
                    onClick={() => addProduct(product)}
                    size="sm"
                    className="ml-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stand Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration du Stand</CardTitle>
            <CardDescription>Configurez votre stand et calculez le coût</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="standName">Nom du Stand</Label>
                <Input
                  id="standName"
                  value={standName}
                  onChange={(e) => setStandName(e.target.value)}
                  placeholder="Saisissez le nom du stand"
                />
              </div>

              <div>
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} {client.company && `- ${client.company}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Produits Sélectionnés</h3>
                  {selectedProducts.map(product => (
                    <div key={product.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{product.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label>Quantité:</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{product.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {product.pricing_type === 'Par Jour' && (
                          <div className="flex items-center gap-2">
                            <Label>Jours:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={product.days}
                              onChange={(e) => updateDays(product.id, e.target.value)}
                              className="w-16"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-right">
                        <span className="font-bold text-blue-600">
                          {(product.price * product.quantity * (product.pricing_type === 'Par Jour' ? product.days : 1)).toFixed(2)} TND
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">{calculateTotal().toFixed(2)} TND</span>
                    </div>
                  </div>

                  <Button onClick={saveStand} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder le Stand
                  </Button>
                </div>
              )}

              {selectedProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit sélectionné</p>
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
