import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Calendar, TrendingUp, Users, Package, DollarSign, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import apiService from '@/services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function Statistics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    stands: [],
    products: [],
    suppliers: [],
    categories: [],
    purchases: []
  })

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      
      // Load all data from backend
      const [standsData, productsData, suppliersData, categoriesData, purchasesData] = await Promise.all([
        apiService.getStands().catch(() => []),
        apiService.getProducts().catch(() => []),
        apiService.getSuppliers().catch(() => []),
        apiService.getCategories().catch(() => []),
        apiService.getPurchases().catch(() => [])
      ])

      setStats({
        stands: standsData || [],
        products: productsData || [],
        suppliers: suppliersData || [],
        categories: categoriesData || [],
        purchases: purchasesData || []
      })

      console.log('📊 Statistics loaded:', {
        stands: standsData?.length || 0,
        products: productsData?.length || 0,
        suppliers: suppliersData?.length || 0,
        categories: categoriesData?.length || 0,
        purchases: purchasesData?.length || 0
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics from real data
  const totalStands = stats.stands.length
  const totalProducts = stats.products.length
  const totalSuppliers = stats.suppliers.length
  const totalRevenue = stats.stands.reduce((sum, stand) => sum + (stand.total_amount || 0), 0)
  const averageStandCost = totalStands > 0 ? totalRevenue / totalStands : 0
  
  // Approved stands
  const approvedStands = stats.stands.filter(s => s.status === 'approved')
  
  // Stands by creator
  const standsByCreator = stats.stands.reduce((acc, stand) => {
    const creator = stand.creator || 'Unknown'
    if (!acc[creator]) {
      acc[creator] = { name: creator, stands: 0, total: 0 }
    }
    acc[creator].stands++
    acc[creator].total += stand.total_amount || 0
    return acc
  }, {})
  
  const standCreatorsData = Object.values(standsByCreator).sort((a, b) => b.stands - a.stands)
  
  // Stands by status
  const standsByStatus = stats.stands.reduce((acc, stand) => {
    const status = stand.status || 'draft'
    if (!acc[status]) {
      acc[status] = 0
    }
    acc[status]++
    return acc
  }, {})
  
  const standStatusData = [
    { status: 'Brouillon', count: standsByStatus.draft || 0, color: '#ffc658' },
    { status: 'Validé Logistique', count: standsByStatus.validated_logistics || 0, color: '#ff7300' },
    { status: 'Validé Finance', count: standsByStatus.validated_finance || 0, color: '#00C49F' },
    { status: 'Approuvé', count: standsByStatus.approved || 0, color: '#82ca9d' }
  ].filter(item => item.count > 0)
  
  // Top expensive stands
  const expensiveStands = [...stats.stands]
    .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
    .slice(0, 5)
  
  // Product usage statistics
  const productUsage = {}
  stats.stands.forEach(stand => {
    stand.items?.forEach(item => {
      const productName = item.product_name || 'Unknown'
      if (!productUsage[productName]) {
        productUsage[productName] = {
          name: productName,
          usage: 0,
          totalQuantity: 0,
          category: item.category_name || 'N/A'
        }
      }
      productUsage[productName].usage++
      productUsage[productName].totalQuantity += item.quantity || 0
    })
  })
  
  const popularProducts = Object.values(productUsage)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10)
  
  // Expenses by supplier
  const supplierExpenses = {}
  stats.stands.forEach(stand => {
    stand.items?.forEach(item => {
      const supplierName = item.supplier_name || 'Unknown'
      if (!supplierExpenses[supplierName]) {
        supplierExpenses[supplierName] = {
          name: supplierName,
          amount: 0
        }
      }
      supplierExpenses[supplierName].amount += item.total_price || 0
    })
  })
  
  const supplierExpensesData = Object.values(supplierExpenses)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'][index]
    }))
  
  // Expenses by category
  const categoryExpenses = {}
  stats.stands.forEach(stand => {
    stand.items?.forEach(item => {
      const categoryName = item.category_name || 'Unknown'
      if (!categoryExpenses[categoryName]) {
        categoryExpenses[categoryName] = {
          name: categoryName,
          amount: 0
        }
      }
      categoryExpenses[categoryName].amount += item.total_price || 0
    })
  })
  
  const categoryExpensesData = Object.values(categoryExpenses)
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      ...item,
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'][index]
    }))

  // Excel export function
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new()
      
      // Sheet 1: Overview / Vue d'ensemble
      const overviewData = [
        ['STATISTIQUES GÉNÉRALES'],
        [''],
        ['Métrique', 'Valeur'],
        ['Total Stands', totalStands],
        ['Stands Approuvés', approvedStands.length],
        ['Chiffre d\'affaires Total', `${totalRevenue.toFixed(2)} TND`],
        ['Coût Moyen par Stand', `${averageStandCost.toFixed(2)} TND`],
        ['Total Produits', totalProducts],
        ['Total Fournisseurs', totalSuppliers],
        ['Total Bons d\'Achat', stats.purchases.length]
      ]
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble')
      
      // Sheet 2: Stands Details
      const standsData = [
        ['NOM', 'CRÉATEUR', 'STATUT', 'MONTANT TOTAL (TND)', 'NOMBRE PRODUITS', 'DATE CRÉATION']
      ]
      stats.stands.forEach(stand => {
        standsData.push([
          stand.name || 'N/A',
          stand.creator || 'N/A',
          stand.status || 'draft',
          stand.total_amount?.toFixed(2) || '0.00',
          stand.items?.length || 0,
          stand.created_at ? new Date(stand.created_at).toLocaleDateString('fr-FR') : 'N/A'
        ])
      })
      const wsStands = XLSX.utils.aoa_to_sheet(standsData)
      XLSX.utils.book_append_sheet(wb, wsStands, 'Stands')
      
      // Sheet 3: Products Usage
      const productsData = [
        ['PRODUIT', 'CATÉGORIE', 'UTILISATIONS', 'QUANTITÉ TOTALE']
      ]
      popularProducts.forEach(product => {
        productsData.push([
          product.name,
          product.category,
          product.usage,
          product.totalQuantity
        ])
      })
      const wsProducts = XLSX.utils.aoa_to_sheet(productsData)
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Produits Populaires')
      
      // Sheet 4: Supplier Expenses
      const suppliersData = [
        ['FOURNISSEUR', 'DÉPENSES TOTALES (TND)']
      ]
      supplierExpensesData.forEach(supplier => {
        suppliersData.push([
          supplier.name,
          supplier.amount.toFixed(2)
        ])
      })
      const wsSuppliers = XLSX.utils.aoa_to_sheet(suppliersData)
      XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Dépenses Fournisseurs')
      
      // Sheet 5: Category Expenses
      const categoriesData = [
        ['CATÉGORIE', 'DÉPENSES TOTALES (TND)']
      ]
      categoryExpensesData.forEach(category => {
        categoriesData.push([
          category.name,
          category.amount.toFixed(2)
        ])
      })
      const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData)
      XLSX.utils.book_append_sheet(wb, wsCategories, 'Dépenses Catégories')
      
      // Sheet 6: Creators Performance
      const creatorsData = [
        ['CRÉATEUR', 'NOMBRE DE STANDS', 'MONTANT TOTAL (TND)', 'MOYENNE PAR STAND (TND)']
      ]
      standCreatorsData.forEach(creator => {
        creatorsData.push([
          creator.name,
          creator.stands,
          creator.total.toFixed(2),
          (creator.total / creator.stands).toFixed(2)
        ])
      })
      const wsCreators = XLSX.utils.aoa_to_sheet(creatorsData)
      XLSX.utils.book_append_sheet(wb, wsCreators, 'Performance Créateurs')
      
      // Sheet 7: Purchases
      if (stats.purchases.length > 0) {
        const purchasesData = [
          ['N° BON', 'STAND', 'FOURNISSEUR', 'MONTANT (TND)', 'STATUT', 'DATE']
        ]
        stats.purchases.forEach(purchase => {
          purchasesData.push([
            purchase.purchase_number || 'N/A',
            purchase.stand_name || 'N/A',
            purchase.supplier_name || 'N/A',
            purchase.total_amount?.toFixed(2) || '0.00',
            purchase.status || 'pending',
            purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('fr-FR') : 'N/A'
          ])
        })
        const wsPurchases = XLSX.utils.aoa_to_sheet(purchasesData)
        XLSX.utils.book_append_sheet(wb, wsPurchases, 'Bons d\'Achat')
      }
      
      // Generate filename with date
      const fileName = `Statistiques_Event_Management_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      toast.success('Statistiques exportées avec succès!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Erreur lors de l\'export Excel')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'validated_logistics': return 'bg-blue-100 text-blue-800'
      case 'validated_finance': return 'bg-purple-100 text-purple-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">
            Tableaux de bord et indicateurs de performance - Données en temps réel
          </p>
        </div>
        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Moyen par Stand</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStandCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND</div>
            <p className="text-xs text-muted-foreground">Basé sur {totalStands} stand(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stands</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStands}</div>
            <p className="text-xs text-muted-foreground">{approvedStands.length} approuvé(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standCreatorsData.length}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND</div>
            <p className="text-xs text-muted-foreground">Total cumulé</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="creators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="creators">Créateurs</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Créateurs les Plus Actifs</CardTitle>
                <CardDescription>Nombre de stands créés par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={standCreatorsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stands" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut des Stands</CardTitle>
                <CardDescription>Répartition par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={standStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {standStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dépenses par Fournisseur</CardTitle>
                <CardDescription>Total des dépenses en TND</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={supplierExpensesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="amount"
                      label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                    >
                      {supplierExpensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} TND`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dépenses par Catégorie</CardTitle>
                <CardDescription>Répartition des coûts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryExpensesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} TND`} />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produits les Plus Utilisés</CardTitle>
              <CardDescription>Fréquence d'utilisation dans les stands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{product.usage} utilisations</div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(product.usage / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé Global</CardTitle>
                <CardDescription>Vue d'ensemble du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground">Total Stands</span>
                    <span className="font-bold text-lg">{totalStands}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground">Stands Approuvés</span>
                    <span className="font-bold text-lg text-green-600">{approvedStands.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground">Total Produits</span>
                    <span className="font-bold text-lg">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground">Total Fournisseurs</span>
                    <span className="font-bold text-lg">{totalSuppliers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground">Bons d'Achat</span>
                    <span className="font-bold text-lg">{stats.purchases.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded">
                    <span className="font-medium">Chiffre d'Affaires Total</span>
                    <span className="font-bold text-xl text-primary">{totalRevenue.toLocaleString('fr-FR')} TND</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Créateurs</CardTitle>
                <CardDescription>Performance par montant total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {standCreatorsData.slice(0, 5).map((creator, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{creator.stands} stand(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{creator.total.toLocaleString('fr-FR')} TND</p>
                        <p className="text-xs text-muted-foreground">
                          Moy: {(creator.total / creator.stands).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Stands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stands les Plus Chers</CardTitle>
          <CardDescription>Top 5 des stands par coût total</CardDescription>
        </CardHeader>
        <CardContent>
          {expensiveStands.length > 0 ? (
            <div className="space-y-4">
              {expensiveStands.map((stand) => (
                <div key={stand.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{stand.name}</h4>
                    <p className="text-sm text-muted-foreground">Créé par {stand.creator}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(stand.status)}>
                      {stand.status}
                    </Badge>
                    <div className="text-right">
                      <div className="font-medium">{(stand.total_amount || 0).toLocaleString('fr-FR')} TND</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun stand enregistré
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
