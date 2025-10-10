import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, Plus, Download, Eye, Trash2, ShoppingCart, Package, Building2 } from 'lucide-react';
import apiService from '../services/api';
import { toast } from 'sonner';

const Achat = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [notes, setNotes] = useState('');

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [purchasesData, suppliersData, productsData] = await Promise.all([
        apiService.getPurchases(),
        apiService.getSuppliers(),
        apiService.getProducts()
      ]);
      
      setPurchases(purchasesData || []);
      setSuppliers(suppliersData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const getSupplierProducts = (supplierId) => {
    if (!supplierId) return [];
    return products.filter(p => p.supplier_id === parseInt(supplierId));
  };

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;

    const existingItem = purchaseItems.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.error('Ce produit est déjà dans la commande');
      return;
    }

    const newItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      days: product.pricing_type === 'Par Jour' ? 1 : 1,
      unit_price: product.price,
      total_price: product.price,
      pricing_type: product.pricing_type
    };

    setPurchaseItems([...purchaseItems, newItem]);
  };

  const updateItemQuantity = (productId, quantity) => {
    setPurchaseItems(items => 
      items.map(item => {
        if (item.product_id === productId) {
          const newQuantity = Math.max(1, parseInt(quantity) || 1);
          const totalPrice = newQuantity * item.unit_price * item.days;
          return { ...item, quantity: newQuantity, total_price: totalPrice };
        }
        return item;
      })
    );
  };

  const updateItemDays = (productId, days) => {
    setPurchaseItems(items => 
      items.map(item => {
        if (item.product_id === productId && item.pricing_type === 'Par Jour') {
          const newDays = Math.max(1, parseInt(days) || 1);
          const totalPrice = item.quantity * item.unit_price * newDays;
          return { ...item, days: newDays, total_price: totalPrice };
        }
        return item;
      })
    );
  };

  const removeItem = (productId) => {
    setPurchaseItems(items => items.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleCreatePurchase = async () => {
    if (!selectedSupplier) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (purchaseItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    setIsLoading(true);

    try {
      const purchaseData = {
        supplier_id: parseInt(selectedSupplier),
        total_amount: calculateTotal(),
        notes: notes,
        items: purchaseItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          days: item.days || 1,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      };

      await apiService.createPurchase(purchaseData);
      
      toast.success('Bon de commande créé avec succès!');
      
      await loadData();
      
      setShowCreateDialog(false);
      setSelectedSupplier('');
      setPurchaseItems([]);
      setNotes('');
    } catch (err) {
      console.error('Error creating purchase:', err);
      toast.error('Erreur lors de la création du bon de commande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (purchaseId) => {
    try {
      toast.loading('Génération du PDF en cours...');
      await apiService.downloadPurchasePDF(purchaseId);
      toast.dismiss();
      toast.success('PDF téléchargé avec succès!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de la génération du PDF');
      console.error('PDF generation error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'En attente' },
      approved: { variant: 'default', label: 'Approuvé' },
      sent: { variant: 'outline', label: 'Envoyé' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Achat</h1>
          <p className="text-muted-foreground">Créer des bons de commande pour vos fournisseurs</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Bon de Commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Bon de Commande</DialogTitle>
              <DialogDescription>
                Sélectionnez un fournisseur et ajoutez des produits à commander
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Supplier Selection */}
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
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

              {/* Product Selection */}
              {selectedSupplier && (
                <div className="space-y-2">
                  <Label htmlFor="product">Ajouter un produit</Label>
                  <Select onValueChange={addProductToOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSupplierProducts(selectedSupplier).map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.price} TND ({product.pricing_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Items Table */}
              {purchaseItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Produits à commander</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="w-24">Quantité</TableHead>
                          <TableHead className="w-24">Jours</TableHead>
                          <TableHead className="w-32">Prix Unit.</TableHead>
                          <TableHead className="w-32">Total</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground">{item.pricing_type}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.product_id, e.target.value)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              {item.pricing_type === 'Par Jour' ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.days}
                                  onChange={(e) => updateItemDays(item.product_id, e.target.value)}
                                  className="w-20"
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{item.unit_price.toFixed(2)} TND</TableCell>
                            <TableCell className="font-bold">{item.total_price.toFixed(2)} TND</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.product_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                          <TableCell className="font-bold text-lg">{calculateTotal().toFixed(2)} TND</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes pour ce bon de commande..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreatePurchase} 
                  disabled={!selectedSupplier || purchaseItems.length === 0 || isLoading}
                >
                  {isLoading ? 'Création...' : 'Créer le Bon de Commande'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bons de Commande</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">Total créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.reduce((total, p) => total + p.total_amount, 0).toFixed(2)} TND
            </div>
            <p className="text-xs text-muted-foreground">Tous les bons</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Bons de Commande</CardTitle>
          <CardDescription>Gérez vos bons de commande et générez les PDF</CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun bon de commande</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par créer votre premier bon de commande.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold">{purchase.purchase_number}</h3>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {purchase.supplier_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créé le {new Date(purchase.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{purchase.total_amount.toFixed(2)} TND</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadPDF(purchase.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Achat;