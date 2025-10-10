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
import { FileText, Plus, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import apiService from '../services/api';
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    stand_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    total_ht: 0
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
    
    // Auto-calculate total_ht when stand is selected
    if (field === 'stand_id') {
      const selectedStand = stands.find(s => s.id === parseInt(value));
      if (selectedStand) {
        setFormData(prev => ({ ...prev, total_ht: selectedStand.total_amount }));
      }
    }
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.stand_id || !formData.client_name) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      await apiService.createInvoice(formData);
      toast.success('Facture créée avec succès!');
      
      setDialogOpen(false);
      setFormData({
        stand_id: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        total_ht: 0
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Erreur lors de la création de la facture');
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
      pending: { label: 'En attente', variant: 'secondary', icon: Clock },
      paid: { label: 'Payée', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle }
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
              Créer une Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Facture</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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

                <div className="col-span-2">
                  <Label htmlFor="client_name">Nom du Client *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Nom complet du client"
                  />
                </div>

                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="client@example.com"
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
                    placeholder="Adresse complète du client"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="total_ht">Total HT (TND)</Label>
                  <Input
                    id="total_ht"
                    type="number"
                    step="0.01"
                    value={formData.total_ht}
                    onChange={(e) => handleInputChange('total_ht', parseFloat(e.target.value))}
                    disabled
                  />
                </div>

                <div>
                  <Label>Total TTC (TND)</Label>
                  <Input
                    value={(formData.total_ht * 1.19).toFixed(2)}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">TVA 19% incluse</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateInvoice}>
                  Créer la Facture
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                          >
                            Marquer payée
                          </Button>
                        )}
                        
                        {invoice.status === 'pending' && (
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
