import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, Plus, Download, CheckCircle, Clock, XCircle, User, Building2, Mail, Phone, MapPin, FileSignature, DollarSign } from 'lucide-react';
import { Separator } from './ui/separator';
import apiService from '../services/api';
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [selectedInvoiceForSigning, setSelectedInvoiceForSigning] = useState(null);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    stand_id: '',
    remise: 0,
    remise_type: 'percentage',
    tva_percentage: 19,
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, standsData] = await Promise.all([
        apiService.getInvoices(),
        apiService.getStands()
      ]);
      
      setInvoices(invoicesData);
      
      // Only show approved stands that don't have an invoice yet
      const approvedStands = standsData.filter(stand => 
        stand.status === 'approved'
      );
      setStands(approvedStands);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-populate client info when stand is selected
    if (field === 'stand_id') {
      const selectedStand = stands.find(s => s.id === parseInt(value));
      if (selectedStand && selectedStand.client) {
        setSelectedClient(selectedStand.client);
      } else {
        setSelectedClient(null);
      }
    }
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.stand_id) {
        toast.error('Veuillez sélectionner un stand');
        return;
      }

      await apiService.createInvoice(formData);
      toast.success('Devis créé avec succès!');
      
      setDialogOpen(false);
      setSelectedClient(null);
      setFormData({
        stand_id: '',
        remise: 0,
        remise_type: 'percentage',
        tva_percentage: 19,
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erreur lors de la création du devis');
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
      await apiService.updateInvoiceStatus(invoiceId, newStatus);
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Devis</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Stand Selection */}
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

              {/* Client Info (Auto-populated) */}
              {selectedClient && (
                <Card className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informations Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedClient.name}</span>
                    </div>
                    {selectedClient.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{selectedClient.company}</span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                </div>
              </div>

              <Separator />

              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations de Votre Entreprise</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="company_name">Nom de l'Entreprise</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Votre Entreprise"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="company_address">Adresse</Label>
                    <Textarea
                      id="company_address"
                      value={formData.company_address}
                      onChange={(e) => handleInputChange('company_address', e.target.value)}
                      placeholder="Adresse de votre entreprise"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_phone">Téléphone</Label>
                    <Input
                      id="company_phone"
                      value={formData.company_phone}
                      onChange={(e) => handleInputChange('company_phone', e.target.value)}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_email">Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => handleInputChange('company_email', e.target.value)}
                      placeholder="contact@entreprise.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateInvoice}>
                  Créer le Devis
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
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total TTC:</span>
                    <span className="text-sm font-bold">{selectedInvoiceForSigning.total_ttc.toFixed(2)} TND</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="advance_payment">Montant de l'Acompte (TND)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="advance_payment"
                    type="number"
                    step="0.01"
                    min="0"
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
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
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
                    <TableCell>{invoice.total_ht.toFixed(2)} TND</TableCell>
                    <TableCell>{invoice.tva_amount.toFixed(2)} TND</TableCell>
                    <TableCell className="font-bold">{invoice.total_ttc.toFixed(2)} TND</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id)}
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
