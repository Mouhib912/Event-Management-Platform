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
import { FileText, Plus, Download, CheckCircle, Clock, XCircle, User, Building2, Mail, Phone, MapPin, FileSignature, DollarSign, Search, Package, Edit2 } from 'lucide-react';
import { Separator } from './ui/separator';
import apiService from '../services/api';
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [stands, setStands] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [selectedInvoiceForSigning, setSelectedInvoiceForSigning] = useState(null);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editClientInfo, setEditClientInfo] = useState(false);
  const [editCompanyInfo, setEditCompanyInfo] = useState(false);
  const [selectedStandItems, setSelectedStandItems] = useState([]);
  const [useStand, setUseStand] = useState(true); // Toggle between stand-based and direct creation
  const [productSearch, setProductSearch] = useState(''); // Search filter for products
  const [formData, setFormData] = useState({
    stand_id: '',
    client_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_company: '',
    company_name: 'Votre Entreprise',
    company_address: '',
    company_phone: '',
    company_email: '',
    currency: 'TND',
    remise: 0,
    remise_type: 'percentage',
    tva_percentage: 19,
    product_factor: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, standsData, contactsData, productsData] = await Promise.all([
        apiService.getInvoices(),
        apiService.getStands(),
        apiService.getContacts('all'),
        apiService.getProducts()
      ]);
      
      setInvoices(invoicesData);
      
      // Only show approved stands that don't have an invoice yet
      const approvedStands = standsData.filter(stand => 
        stand.status === 'approved'
      );
      setStands(approvedStands);
      
      // Filter contacts to only show clients
      const clientContacts = contactsData.filter(c => 
        c.contact_type === 'client' || c.contact_type === 'both'
      );
      setContacts(clientContacts);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-populate client info and load stand items when stand is selected
    if (field === 'stand_id') {
      const selectedStand = stands.find(s => s.id === parseInt(value));
      if (selectedStand && selectedStand.client) {
        setSelectedClient(selectedStand.client);
        // Populate client fields from stand's client
        setFormData(prev => ({
          ...prev,
          client_id: selectedStand.client.id || '',
          client_name: selectedStand.client.name || '',
          client_email: selectedStand.client.email || '',
          client_phone: selectedStand.client.phone || '',
          client_address: selectedStand.client.address || '',
          client_company: selectedStand.client.company || ''
        }));
      } else {
        setSelectedClient(null);
        setFormData(prev => ({
          ...prev,
          client_id: '',
          client_name: '',
          client_email: '',
          client_phone: '',
          client_address: '',
          client_company: ''
        }));
      }
      
      // Load stand items with editable properties
      if (selectedStand && selectedStand.items) {
        const editableItems = selectedStand.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || 'Produit',
          quantity: item.quantity,
          days: item.days || 1,
          unit_price: item.unit_price,
          factor: 1, // Default factor is 1
          total_price: item.total_price
        }));
        setSelectedStandItems(editableItems);
      } else {
        setSelectedStandItems([]);
      }
    }
    
    // Handle direct client selection (when not using a stand)
    if (field === 'client_id' && !useStand) {
      const selectedContact = contacts.find(c => c.id === parseInt(value));
      if (selectedContact) {
        setSelectedClient(selectedContact);
        setFormData(prev => ({
          ...prev,
          client_name: selectedContact.name || '',
          client_email: selectedContact.email || '',
          client_phone: selectedContact.phone || '',
          client_address: selectedContact.address || '',
          client_company: selectedContact.company || ''
        }));
      } else {
        setSelectedClient(null);
        setFormData(prev => ({
          ...prev,
          client_name: '',
          client_email: '',
          client_phone: '',
          client_address: '',
          client_company: ''
        }));
      }
    }
  };
  
  // Filter products based on search
  const filteredProducts = products.filter(product => {
    if (productSearch === '') return true;
    const searchLower = productSearch.toLowerCase();
    const nameMatch = product.name?.toLowerCase().includes(searchLower);
    const categoryMatch = product.category_name?.toLowerCase().includes(searchLower);
    return nameMatch || categoryMatch;
  });
  
  // Remove product line
  const handleRemoveProduct = (index) => {
    setSelectedStandItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle product selection in direct mode
  const handleProductSelect = (index, productId) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    if (selectedProduct) {
      setSelectedStandItems(prev => {
        const updated = [...prev];
        
        // If index equals array length, we're adding a new item
        if (index >= updated.length) {
          updated.push({
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: 1,
            days: 1,
            unit_price: selectedProduct.price,
            factor: 1,
            total_price: 1 * 1 * selectedProduct.price * 1
          });
        } else {
          // Updating existing item
          updated[index] = {
            ...updated[index],
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            unit_price: selectedProduct.price,
            total_price: (updated[index].quantity || 1) * (updated[index].days || 1) * selectedProduct.price * (updated[index].factor || 1)
          };
        }
        
        return updated;
      });
    }
  };

  const handleProductChange = (index, field, value) => {
    setSelectedStandItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate total price for this item
      const item = updated[index];
      updated[index].total_price = item.quantity * item.days * item.unit_price * item.factor;
      
      return updated;
    });
  };

  const calculateTotal = () => {
    // Safely calculate subtotal with fallback for missing or invalid items
    const subtotal = selectedStandItems.reduce((sum, item) => {
      return sum + (item?.total_price || 0);
    }, 0);
    
    // Apply remise
    let totalHT = subtotal;
    if (formData.remise > 0) {
      if (formData.remise_type === 'percentage') {
        totalHT = subtotal - (subtotal * formData.remise / 100);
      } else {
        totalHT = subtotal - formData.remise;
      }
    }
    
    // Apply TVA
    const tvaAmount = totalHT * (formData.tva_percentage / 100);
    const totalTTC = totalHT + tvaAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      totalHT: totalHT.toFixed(2),
      tvaAmount: tvaAmount.toFixed(2),
      totalTTC: totalTTC.toFixed(2)
    };
  };

  const handleCreateInvoice = async () => {
    try {
      // Validation
      if (useStand && !formData.stand_id) {
        toast.error('Veuillez sélectionner un stand');
        return;
      }
      
      if (!useStand) {
        if (!formData.client_name) {
          toast.error('Veuillez sélectionner ou entrer un client');
          return;
        }
        if (selectedStandItems.length === 0) {
          toast.error('Veuillez ajouter au moins un produit');
          return;
        }
        // Validate all products have required fields
        const invalidProducts = selectedStandItems.filter(item => 
          !item.product_id || item.quantity <= 0 || item.unit_price <= 0
        );
        if (invalidProducts.length > 0) {
          toast.error('Veuillez remplir tous les champs des produits');
          return;
        }
      }

      // Include modified products in the invoice data
      const invoiceData = {
        ...formData,
        modified_items: selectedStandItems,
        use_stand: useStand
      };

      if (editingInvoice) {
        // Update existing invoice
        await apiService.updateInvoice(editingInvoice.id, invoiceData);
        toast.success('Facture mise à jour avec succès!');
      } else {
        // Create new invoice
        await apiService.createInvoice(invoiceData);
        toast.success('Devis créé avec succès!');
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(editingInvoice ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création du devis');
    }
  };
  
  const resetForm = () => {
    setDialogOpen(false);
    setEditingInvoice(null);
    setSelectedClient(null);
    setEditClientInfo(false);
    setEditCompanyInfo(false);
    setSelectedStandItems([]);
    setFormData({
      stand_id: '',
      client_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      client_address: '',
      client_company: '',
      company_name: 'Votre Entreprise',
      company_address: '',
      company_phone: '',
      company_email: '',
      remise: 0,
      remise_type: 'percentage',
      tva_percentage: 19,
      product_factor: 1
    });
  };

  const handleEditInvoice = async (invoice) => {
    try {
      // Set editing mode
      setEditingInvoice(invoice);
      
      // Determine if this is a stand-based or direct invoice
      const isStandBased = invoice.stand_id ? true : false;
      setUseStand(isStandBased);
      
      // Load invoice items
      const items = await apiService.getInvoiceItems(invoice.id);
      setSelectedStandItems(items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        days: item.days || 1,
        unit_price: item.unit_price,
        factor: item.factor || 1,
        total_price: item.total_price,
        pricing_type: item.pricing_type
      })));
      
      // Populate form with invoice data
      setFormData({
        stand_id: invoice.stand_id || '',
        client_id: invoice.client_id || '',
        client_name: invoice.client_name,
        client_email: invoice.client_email || '',
        client_phone: invoice.client_phone || '',
        client_address: invoice.client_address || '',
        client_company: invoice.client_company || '',
        company_name: invoice.company_name || 'Votre Entreprise',
        company_address: invoice.company_address || '',
        company_phone: invoice.company_phone || '',
        company_email: invoice.company_email || '',
        remise: invoice.remise || 0,
        remise_type: invoice.remise_type || 'percentage',
        tva_percentage: invoice.tva_percentage || 19,
        product_factor: invoice.product_factor || 1
      });
      
      // If stand-based, load the stand client info
      if (isStandBased) {
        const selectedStand = stands.find(s => s.id === invoice.stand_id);
        if (selectedStand) {
          setSelectedClient(selectedStand.client);
        }
      }
      
      // Open dialog
      setDialogOpen(true);
      
    } catch (error) {
      console.error('Error loading invoice for editing:', error);
      toast.error('Erreur lors du chargement de la facture');
    }
  };

  const handleSignDevis = (invoice) => {
    setSelectedInvoiceForSigning(invoice);
    setAdvancePayment(0);
    setSigningDialogOpen(true);
  };

  const handleConfirmSigning = async () => {
    try {
      if (!selectedInvoiceForSigning) return;

      await apiService.updateInvoiceStatus(selectedInvoiceForSigning.id, {
        status: 'facture',
        advance_payment: advancePayment
      });
      
      toast.success('Devis signé et converti en facture!');
      setSigningDialogOpen(false);
      setSelectedInvoiceForSigning(null);
      setAdvancePayment(0);
      loadData();
    } catch (error) {
      console.error('Error signing devis:', error);
      toast.error('Erreur lors de la signature du devis');
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      await apiService.downloadInvoicePDF(invoiceId);
      toast.success('PDF téléchargé avec succès!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      await apiService.updateInvoiceStatus(invoiceId, { status: newStatus });
      toast.success('Statut mis à jour!');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      devis: { label: 'Devis', variant: 'secondary', icon: FileText },
      facture: { label: 'Facture', variant: 'default', icon: FileSignature },
      paid: { label: 'Payée', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
      pending: { label: 'En attente', variant: 'secondary', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_ttc, 0);
  const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_ttc, 0);
  const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total_ttc, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factures Clients</h1>
          <p className="text-gray-500 mt-1">Gérer les factures de vos clients</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un Devis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingInvoice ? 'Modifier la Facture' : 'Créer un Nouveau Devis'}</DialogTitle>
              <DialogDescription>
                {editingInvoice ? 'Modifiez les détails de cette facture' : 'Créez un devis ou une facture pour vos clients'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
              {/* Creation Mode Toggle */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-2">
                <Label className="font-semibold">Mode de création:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={useStand ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setUseStand(true);
                      setSelectedStandItems([]);
                      setSelectedClient(null);
                    }}
                  >
                    À partir d'un Stand
                  </Button>
                  <Button
                    type="button"
                    variant={!useStand ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setUseStand(false);
                      setSelectedStandItems([]);
                      setFormData(prev => ({ ...prev, stand_id: '' }));
                    }}
                  >
                    Création Directe
                  </Button>
                </div>
              </div>

              {/* Stand Selection (if using stand mode) */}
              {useStand && (
                <div>
                  <Label htmlFor="stand">Stand *</Label>
                  <Select
                    value={formData.stand_id.toString()}
                    onValueChange={(value) => handleInputChange('stand_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un stand" />
                    </SelectTrigger>
                    <SelectContent>
                      {stands.map(stand => (
                        <SelectItem key={stand.id} value={stand.id.toString()}>
                          {stand.name} - {stand.total_amount.toFixed(2)} TND
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stands.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      Aucun stand approuvé disponible
                    </p>
                  )}
                </div>
              )}

              {/* Client Selection (if direct mode) */}
              {!useStand && (
                <div>
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id.toString()}
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.name} {contact.company && `- ${contact.company}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contacts.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      Aucun client disponible. Créez un contact de type "Client" d'abord.
                    </p>
                  )}
                </div>
              )}

              {/* Client Info (Editable) */}
              {selectedClient && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Informations Client</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditClientInfo(!editClientInfo)}
                    >
                      {editClientInfo ? 'Masquer' : 'Modifier'}
                    </Button>
                  </div>

                  {!editClientInfo ? (
                    <Card className="bg-gray-50">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formData.client_name}</span>
                        </div>
                        {formData.client_company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span>{formData.client_company}</span>
                          </div>
                        )}
                        {formData.client_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{formData.client_email}</span>
                          </div>
                        )}
                        {formData.client_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{formData.client_phone}</span>
                          </div>
                        )}
                        {formData.client_address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{formData.client_address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="client_name">Nom du Client *</Label>
                        <Input
                          id="client_name"
                          value={formData.client_name}
                          onChange={(e) => handleInputChange('client_name', e.target.value)}
                          placeholder="Nom complet"
                        />
                      </div>

                      <div>
                        <Label htmlFor="client_company">Société</Label>
                        <Input
                          id="client_company"
                          value={formData.client_company}
                          onChange={(e) => handleInputChange('client_company', e.target.value)}
                          placeholder="Nom de la société"
                        />
                      </div>

                      <div>
                        <Label htmlFor="client_email">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => handleInputChange('client_email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="client_phone">Téléphone</Label>
                        <Input
                          id="client_phone"
                          value={formData.client_phone}
                          onChange={(e) => handleInputChange('client_phone', e.target.value)}
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="client_address">Adresse</Label>
                        <Textarea
                          id="client_address"
                          value={formData.client_address}
                          onChange={(e) => handleInputChange('client_address', e.target.value)}
                          placeholder="Adresse complète"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Company Information (Editable) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Informations de Votre Entreprise</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditCompanyInfo(!editCompanyInfo)}
                  >
                    {editCompanyInfo ? 'Masquer' : 'Modifier'}
                  </Button>
                </div>

                {!editCompanyInfo ? (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{formData.company_name}</span>
                      </div>
                      {formData.company_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>{formData.company_email}</span>
                        </div>
                      )}
                      {formData.company_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>{formData.company_phone}</span>
                        </div>
                      )}
                      {formData.company_address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span>{formData.company_address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="company_name">Nom de l'Entreprise *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Nom de votre entreprise"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_email">Email Entreprise</Label>
                      <Input
                        id="company_email"
                        type="email"
                        value={formData.company_email}
                        onChange={(e) => handleInputChange('company_email', e.target.value)}
                        placeholder="contact@entreprise.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_phone">Téléphone Entreprise</Label>
                      <Input
                        id="company_phone"
                        value={formData.company_phone}
                        onChange={(e) => handleInputChange('company_phone', e.target.value)}
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="company_address">Adresse Entreprise</Label>
                      <Textarea
                        id="company_address"
                        value={formData.company_address}
                        onChange={(e) => handleInputChange('company_address', e.target.value)}
                        placeholder="Adresse complète de l'entreprise"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Products Section - For direct mode OR stand mode with items */}
              {(!useStand || selectedStandItems.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {useStand ? 'Produits du Stand' : 'Produits'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {useStand 
                          ? 'Vous pouvez modifier la quantité, le prix unitaire et le facteur de chaque produit'
                          : 'Recherchez et ajoutez des produits pour cette facture/devis'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Product Search and Add for Direct Mode */}
                  {!useStand && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Rechercher un produit par nom ou catégorie..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          
                          {productSearch && (
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                              {filteredProducts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                  <p className="font-medium">Aucun produit trouvé</p>
                                  <p className="text-sm mt-1">Essayez un autre mot-clé</p>
                                </div>
                              ) : (
                                <div className="divide-y">
                                  {filteredProducts.map(product => (
                                    <div
                                      key={product.id}
                                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                      onClick={() => {
                                        handleProductSelect(selectedStandItems.length, product.id);
                                        setProductSearch('');
                                      }}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h4 className="font-medium text-sm">{product.name}</h4>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {product.category_name && `${product.category_name} • `}
                                            {product.unit && `${product.unit} • `}
                                            {product.pricing_type}
                                          </p>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-semibold text-slate-700">{product.price} TND</p>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="mt-1 h-7"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleProductSelect(selectedStandItems.length, product.id);
                                              setProductSearch('');
                                            }}
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Ajouter
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {!productSearch && (
                            <div className="text-center py-6 text-gray-500">
                              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">Commencez à taper pour rechercher un produit</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Products Table */}
                  {selectedStandItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="w-24">Quantité</TableHead>
                          <TableHead className="w-24">Jours</TableHead>
                          <TableHead className="w-32">Prix Unit. (TND)</TableHead>
                          <TableHead className="w-32">Facteur</TableHead>
                          <TableHead className="text-right">Total (TND)</TableHead>
                          {!useStand && <TableHead className="w-16"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStandItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-medium">{item.product_name || 'Produit non sélectionné'}</div>
                                {!useStand && item.product_id && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: {item.product_id}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.days}
                                onChange={(e) => handleProductChange(index, 'days', parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => handleProductChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.factor.toString()}
                                onValueChange={(value) => handleProductChange(index, 'factor', parseFloat(value))}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">x1</SelectItem>
                                  <SelectItem value="1.5">x1.5</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.total_price.toFixed(2)}
                            </TableCell>
                            {!useStand && (
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(index)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                  
                  {selectedStandItems.length === 0 && !useStand && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <p>Aucun produit ajouté. Cliquez sur "Ajouter Produit" pour commencer.</p>
                    </div>
                  )}

                  {/* Total Summary */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total:</span>
                          <span className="font-semibold">{calculateTotal().subtotal} TND</span>
                        </div>
                        {formData.remise > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Remise ({formData.remise_type === 'percentage' ? `${formData.remise}%` : `${formData.remise} TND`}):</span>
                            <span className="font-semibold">-{(calculateTotal().subtotal - calculateTotal().totalHT).toFixed(2)} TND</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Total HT:</span>
                          <span className="font-semibold">{calculateTotal().totalHT} TND</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>TVA ({formData.tva_percentage}%):</span>
                          <span className="font-semibold">{calculateTotal().tvaAmount} TND</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold text-blue-700">
                          <span>Total TTC:</span>
                          <span>{calculateTotal().totalTTC} TND</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Invoice Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Détails du Devis</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Remise */}
                  <div>
                    <Label htmlFor="remise">Remise</Label>
                    <Input
                      id="remise"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.remise}
                      onChange={(e) => handleInputChange('remise', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  {/* Remise Type */}
                  <div>
                    <Label htmlFor="remise_type">Type de Remise</Label>
                    <Select
                      value={formData.remise_type}
                      onValueChange={(value) => handleInputChange('remise_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed">Montant Fixe (TND)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* TVA Percentage */}
                  <div>
                    <Label htmlFor="tva_percentage">TVA (%)</Label>
                    <Input
                      id="tva_percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.tva_percentage}
                      onChange={(e) => handleInputChange('tva_percentage', parseFloat(e.target.value) || 19)}
                      placeholder="19"
                    />
                  </div>

                  {/* Currency Selector */}
                  <div>
                    <Label htmlFor="currency">Devise</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
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
                </div>
              </div>
              </div>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="border-t px-6 py-4 bg-white">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateInvoice} disabled={selectedStandItems.length === 0}>
                  {editingInvoice ? 'Mettre à Jour' : 'Créer le Devis'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Signing Dialog */}
        <Dialog open={signingDialogOpen} onOpenChange={setSigningDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Signer le Devis</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Le devis sera converti en facture après signature.
              </p>
              
              {selectedInvoiceForSigning && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">N° Devis:</span>
                    <span className="text-sm">{selectedInvoiceForSigning.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Client:</span>
                    <span className="text-sm">{selectedInvoiceForSigning.client_name}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total TTC:</span>
                    <span className="text-sm font-bold text-blue-600">{selectedInvoiceForSigning.total_ttc.toFixed(2)} {selectedInvoiceForSigning.currency || 'TND'}</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="advance_payment">Montant de l'Acompte ({selectedInvoiceForSigning?.currency || 'TND'})</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="advance_payment"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedInvoiceForSigning?.total_ttc || 0}
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Montant versé en acompte par le client
                </p>
              </div>

              {/* Payment Breakdown */}
              {selectedInvoiceForSigning && advancePayment > 0 && (
                <Card className="bg-gradient-to-br from-green-50 to-orange-50 border-2">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">💰 Acompte Payé:</span>
                        <span className="text-lg font-bold text-green-600">{advancePayment.toFixed(2)} {selectedInvoiceForSigning.currency || 'TND'}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">⏳ Reste à Payer:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {(selectedInvoiceForSigning.total_ttc - advancePayment).toFixed(2)} {selectedInvoiceForSigning.currency || 'TND'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSigningDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmSigning}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Confirmer la Signature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Chiffre d'affaires Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} TND</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidRevenue.toFixed(2)} TND</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRevenue.toFixed(2)} TND</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Factures</CardTitle>
          <CardDescription>
            {invoices.length} facture(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Stand</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Total HT</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Restant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-500">
                    Aucune facture créée
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{invoice.stand_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{invoice.client_name}</span>
                        {invoice.client_email && (
                          <span className="text-xs text-gray-500">{invoice.client_email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.total_ht.toFixed(2)} {invoice.currency || 'TND'}</TableCell>
                    <TableCell>{invoice.tva_amount.toFixed(2)} {invoice.currency || 'TND'}</TableCell>
                    <TableCell className="font-bold">{invoice.total_ttc.toFixed(2)} {invoice.currency || 'TND'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {(invoice.advance_payment || 0).toFixed(2)} {invoice.currency || 'TND'}
                        </div>
                        {invoice.status === 'paid' && (
                          <div className="text-xs text-gray-500">Soldé</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {invoice.status === 'paid' ? (
                          <div className="font-medium text-gray-400">0.00 {invoice.currency || 'TND'}</div>
                        ) : (
                          <div className="font-medium text-orange-600">
                            {(invoice.total_ttc - (invoice.advance_payment || 0)).toFixed(2)} {invoice.currency || 'TND'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {/* Edit button - only for devis */}
                        {invoice.status === 'devis' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id)}
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {/* Sign devis button */}
                        {invoice.status === 'devis' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSignDevis(invoice)}
                          >
                            <FileSignature className="h-4 w-4 mr-1" />
                            Signer
                          </Button>
                        )}
                        
                        {/* Mark as paid button for facture status */}
                        {invoice.status === 'facture' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Payée
                          </Button>
                        )}
                        
                        {/* Cancel button for devis/facture */}
                        {(invoice.status === 'devis' || invoice.status === 'facture') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(invoice.id, 'cancelled')}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
