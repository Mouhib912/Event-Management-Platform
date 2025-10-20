import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Users, Building2, ShoppingBag, RefreshCcw, Mail, Phone, MapPin, User, History, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import apiService from '../services/api';
import { toast } from 'sonner';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [enterprises, setEnterprises] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedContactHistory, setSelectedContactHistory] = useState(null);
  const [contactStands, setContactStands] = useState([]);
  const [contactInvoices, setContactInvoices] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_type: 'client',
    contact_nature: 'person',
    status: 'Actif',
    notes: '',
    
    // Enterprise-specific fields
    matricule_fiscal: '',
    code_tva: '',
    code_douane: '',
    registre_commerce: '',
    legal_form: '',
    capital: '',
    website: '',
    
    // Person-specific fields
    enterprise_id: null,
    position: '',
    
    // Legacy fields (keep for backward compatibility)
    contact_person: '',
    company: '',
    speciality: ''
  });

  useEffect(() => {
    loadContacts();
    loadEnterprises();
  }, []);

  const loadEnterprises = async () => {
    try {
      const data = await apiService.getEnterprises();
      setEnterprises(data);
    } catch (error) {
      console.error('Error loading enterprises:', error);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = useCallback(() => {
    let filtered = contacts;

    // Filter by tab (contact type and nature)
    if (activeTab === 'enterprises') {
      filtered = filtered.filter(c => c.contact_nature === 'enterprise');
    } else if (activeTab === 'persons') {
      filtered = filtered.filter(c => c.contact_nature === 'person');
    } else if (activeTab !== 'all') {
      // Filter by contact_type (client/fournisseur/both)
      filtered = filtered.filter(c => c.contact_type === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search) ||
        c.company?.toLowerCase().includes(search) ||
        c.contact_person?.toLowerCase().includes(search) ||
        c.matricule_fiscal?.toLowerCase().includes(search) ||
        c.position?.toLowerCase().includes(search)
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, activeTab]);

  useEffect(() => {
    filterContacts();
  }, [filterContacts]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast.error('Le nom est requis');
        return;
      }

      if (editingContact) {
        await apiService.updateContact(editingContact.id, formData);
        toast.success('Contact mis à jour avec succès');
      } else {
        await apiService.createContact(formData);
        toast.success('Contact créé avec succès');
      }

      setDialogOpen(false);
      setEditingContact(null);
      resetForm();
      loadContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      // Common fields
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      contact_type: contact.contact_type || 'client',
      contact_nature: contact.contact_nature || 'person',
      status: contact.status || 'Actif',
      notes: contact.notes || '',
      
      // Enterprise-specific
      matricule_fiscal: contact.matricule_fiscal || '',
      code_tva: contact.code_tva || '',
      code_douane: contact.code_douane || '',
      registre_commerce: contact.registre_commerce || '',
      legal_form: contact.legal_form || '',
      capital: contact.capital || '',
      website: contact.website || '',
      
      // Person-specific
      enterprise_id: contact.enterprise_id || null,
      position: contact.position || '',
      
      // Legacy fields
      contact_person: contact.contact_person || '',
      company: contact.company || '',
      speciality: contact.speciality || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contact?')) {
      return;
    }

    try {
      await apiService.deleteContact(contactId);
      toast.success('Contact supprimé avec succès');
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewHistory = async (contact) => {
    try {
      setSelectedContactHistory(contact);
      setHistoryDialogOpen(true);
      setLoadingHistory(true);
      
      // Fetch stands and invoices for this contact
      const [stands, invoices] = await Promise.all([
        apiService.getStands(),
        apiService.getInvoices()
      ]);
      
      // Filter stands for this contact
      const contactStandsFiltered = stands.filter(stand => 
        stand.client_id === contact.id || stand.client?.id === contact.id
      );
      
      // Filter invoices for this contact
      const contactInvoicesFiltered = invoices.filter(invoice => 
        invoice.client_id === contact.id
      );
      
      setContactStands(contactStandsFiltered);
      setContactInvoices(contactInvoicesFiltered);
    } catch (error) {
      console.error('Error loading contact history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateHistoryStats = () => {
    const totalRevenue = contactInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
    const paidAmount = contactInvoices.reduce((sum, inv) => sum + (inv.advance_payment || 0), 0);
    const pendingAmount = totalRevenue - paidAmount;
    
    return {
      totalStands: contactStands.length,
      totalInvoices: contactInvoices.length,
      totalRevenue: totalRevenue.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      devisCount: contactInvoices.filter(inv => inv.status === 'devis').length,
      factureCount: contactInvoices.filter(inv => inv.status === 'facture').length,
      paidCount: contactInvoices.filter(inv => inv.status === 'paid').length
    };
  };

  const resetForm = () => {
    setFormData({
      // Common fields
      name: '',
      email: '',
      phone: '',
      address: '',
      contact_type: 'client',
      contact_nature: 'person',
      status: 'Actif',
      notes: '',
      
      // Enterprise-specific
      matricule_fiscal: '',
      code_tva: '',
      code_douane: '',
      registre_commerce: '',
      legal_form: '',
      capital: '',
      website: '',
      
      // Person-specific
      enterprise_id: null,
      position: '',
      
      // Legacy fields
      contact_person: '',
      company: '',
      speciality: ''
    });
  };

  const getContactTypeBadge = (type) => {
    const configs = {
      client: { label: 'Client', variant: 'default', icon: User, color: 'bg-blue-100 text-blue-700 border-blue-300' },
      fournisseur: { label: 'Fournisseur', variant: 'secondary', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700 border-orange-300' },
      both: { label: 'Client & Fournisseur', variant: 'success', icon: RefreshCcw, color: 'bg-green-100 text-green-700 border-green-300' }
    };

    const config = configs[type] || configs.client;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStats = () => {
    return {
      total: contacts.length,
      clients: contacts.filter(c => c.contact_type === 'client').length,
      fournisseurs: contacts.filter(c => c.contact_type === 'fournisseur').length,
      both: contacts.filter(c => c.contact_type === 'both').length,
      enterprises: contacts.filter(c => c.contact_nature === 'enterprise').length,
      persons: contacts.filter(c => c.contact_nature === 'person').length
    };
  };

  const stats = getStats();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-500 mt-1">Gérer tous vos contacts professionnels</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingContact(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>{editingContact ? 'Modifier le Contact' : 'Nouveau Contact'}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Contact Nature Toggle */}
              <div className="space-y-2">
                <Label>Nature du Contact *</Label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.contact_nature === 'person' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="contact_nature"
                      value="person"
                      checked={formData.contact_nature === 'person'}
                      onChange={(e) => handleInputChange('contact_nature', e.target.value)}
                      className="sr-only"
                    />
                    <User className="h-5 w-5" />
                    <span className="font-medium">Personne</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.contact_nature === 'enterprise' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="contact_nature"
                      value="enterprise"
                      checked={formData.contact_nature === 'enterprise'}
                      onChange={(e) => handleInputChange('contact_nature', e.target.value)}
                      className="sr-only"
                    />
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Entreprise</span>
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">
                    {formData.contact_nature === 'enterprise' ? 'Nom de l\'Entreprise *' : 'Nom de la Personne *'}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={formData.contact_nature === 'enterprise' ? 'Nom de l\'entreprise' : 'Nom complet'}
                  />
                </div>

                {/* Enterprise-specific fields */}
                {formData.contact_nature === 'enterprise' && (
                  <>
                    <div>
                      <Label htmlFor="matricule_fiscal">Matricule Fiscal</Label>
                      <Input
                        id="matricule_fiscal"
                        value={formData.matricule_fiscal}
                        onChange={(e) => handleInputChange('matricule_fiscal', e.target.value)}
                        placeholder="Ex: 123456ABC"
                      />
                    </div>

                    <div>
                      <Label htmlFor="code_tva">Code TVA</Label>
                      <Input
                        id="code_tva"
                        value={formData.code_tva}
                        onChange={(e) => handleInputChange('code_tva', e.target.value)}
                        placeholder="Ex: TN123456"
                      />
                    </div>

                    <div>
                      <Label htmlFor="code_douane">Code Douane</Label>
                      <Input
                        id="code_douane"
                        value={formData.code_douane}
                        onChange={(e) => handleInputChange('code_douane', e.target.value)}
                        placeholder="Code douane"
                      />
                    </div>

                    <div>
                      <Label htmlFor="registre_commerce">Registre de Commerce</Label>
                      <Input
                        id="registre_commerce"
                        value={formData.registre_commerce}
                        onChange={(e) => handleInputChange('registre_commerce', e.target.value)}
                        placeholder="Numéro RC"
                      />
                    </div>

                    <div>
                      <Label htmlFor="legal_form">Forme Juridique</Label>
                      <Select
                        value={formData.legal_form}
                        onValueChange={(value) => handleInputChange('legal_form', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SARL">SARL</SelectItem>
                          <SelectItem value="SA">SA</SelectItem>
                          <SelectItem value="SUARL">SUARL</SelectItem>
                          <SelectItem value="SNC">SNC</SelectItem>
                          <SelectItem value="Entreprise Individuelle">Entreprise Individuelle</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="capital">Capital Social</Label>
                      <Input
                        id="capital"
                        value={formData.capital}
                        onChange={(e) => handleInputChange('capital', e.target.value)}
                        placeholder="Ex: 10000"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="website">Site Web</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </>
                )}

                {/* Person-specific fields */}
                {formData.contact_nature === 'person' && (
                  <>
                    <div>
                      <Label htmlFor="enterprise_id">Entreprise</Label>
                      <Select
                        value={formData.enterprise_id?.toString() || ''}
                        onValueChange={(value) => handleInputChange('enterprise_id', value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une entreprise (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune</SelectItem>
                          {enterprises.map(ent => (
                            <SelectItem key={ent.id} value={ent.id.toString()}>
                              {ent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="position">Poste</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        placeholder="Ex: Directeur Commercial"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Adresse complète"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_type">Type de Contact *</Label>
                  <Select
                    value={formData.contact_type}
                    onValueChange={(value) => handleInputChange('contact_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="fournisseur">Fournisseur</SelectItem>
                      <SelectItem value="both">Les Deux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.contact_type === 'fournisseur' || formData.contact_type === 'both') && (
                  <div className="col-span-2">
                    <Label htmlFor="speciality">Spécialité (Fournisseur)</Label>
                    <Input
                      id="speciality"
                      value={formData.speciality}
                      onChange={(e) => handleInputChange('speciality', e.target.value)}
                      placeholder="Domaine d'expertise"
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Notes additionnelles..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit}>
                  {editingContact ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-5 w-5 text-slate-700" />
              </div>
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.clients}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
              </div>
              Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.fournisseurs}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <RefreshCcw className="h-5 w-5 text-green-600" />
              </div>
              Les Deux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.both}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-6 w-6 text-slate-700" />
              Liste des Contacts
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 focus:border-slate-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 p-1 bg-gradient-to-r from-slate-50 to-gray-50">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="enterprises" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Entreprises ({stats.enterprises})
              </TabsTrigger>
              <TabsTrigger value="persons" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Personnes ({stats.persons})
              </TabsTrigger>
              <TabsTrigger value="client" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Clients ({stats.clients})
              </TabsTrigger>
              <TabsTrigger value="fournisseur" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Fournisseurs ({stats.fournisseurs})
              </TabsTrigger>
              <TabsTrigger value="both" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                Les Deux ({stats.both})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun contact trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContacts.map(contact => (
                    <Card key={contact.id} className="group border-2 border-gray-100 hover:border-slate-300 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {contact.contact_nature === 'enterprise' ? (
                                <Building2 className="h-5 w-5 text-purple-600" />
                              ) : (
                                <User className="h-5 w-5 text-blue-600" />
                              )}
                              <CardTitle className="text-lg font-bold group-hover:text-slate-700 transition-colors">{contact.name}</CardTitle>
                            </div>
                            
                            {/* Enterprise-specific info */}
                            {contact.contact_nature === 'enterprise' && contact.matricule_fiscal && (
                              <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                                MF: {contact.matricule_fiscal}
                              </CardDescription>
                            )}
                            
                            {/* Person-specific info */}
                            {contact.contact_nature === 'person' && contact.enterprise_name && (
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {contact.enterprise_name}
                              </CardDescription>
                            )}
                            
                            {/* Legacy company field */}
                            {contact.company && !contact.enterprise_name && (
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {contact.company}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewHistory(contact)}
                              title="Voir l'historique"
                            >
                              <History className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(contact)}
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(contact.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="mb-3">
                          {getContactTypeBadge(contact.contact_type)}
                        </div>
                        
                        {/* Person position */}
                        {contact.contact_nature === 'person' && contact.position && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{contact.position}</span>
                          </div>
                        )}
                        
                        {/* Enterprise employees count */}
                        {contact.contact_nature === 'enterprise' && contact.employees_count > 0 && (
                          <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-2 rounded">
                            <Users className="h-3 w-3" />
                            <span className="font-medium">{contact.employees_count} employé(s)</span>
                          </div>
                        )}
                        
                        {/* Legacy contact_person field */}
                        {contact.contact_person && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-3 w-3" />
                            {contact.contact_person}
                          </div>
                        )}
                        
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                        
                        {contact.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span className="line-clamp-2">{contact.address}</span>
                          </div>
                        )}
                        
                        {/* Enterprise legal info */}
                        {contact.contact_nature === 'enterprise' && contact.legal_form && (
                          <div className="text-sm text-gray-500 italic mt-2">
                            {contact.legal_form}
                            {contact.capital && ` - Capital: ${contact.capital} TND`}
                          </div>
                        )}
                        
                        {contact.speciality && (
                          <div className="text-sm text-gray-500 italic mt-2">
                            Spécialité: {contact.speciality}
                          </div>
                        )}
                        
                        {contact.notes && (
                          <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                            <p className="line-clamp-2">{contact.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique - {selectedContactHistory?.name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Chargement de l'historique...</div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="text-xs text-blue-600 font-medium">Stands</div>
                    <div className="text-2xl font-bold text-blue-700">{calculateHistoryStats().totalStands}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-xs text-purple-600 font-medium">Factures</div>
                    <div className="text-2xl font-bold text-purple-700">{calculateHistoryStats().totalInvoices}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-xs text-green-600 font-medium">Chiffre d'affaires</div>
                    <div className="text-xl font-bold text-green-700">{calculateHistoryStats().totalRevenue} TND</div>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="text-xs text-orange-600 font-medium">En attente</div>
                    <div className="text-xl font-bold text-orange-700">{calculateHistoryStats().pendingAmount} TND</div>
                  </CardContent>
                </Card>
              </div>

              {/* Stands Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Stands ({contactStands.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contactStands.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun stand trouvé
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactStands.map(stand => (
                        <div key={stand.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium">{stand.name}</div>
                            <div className="text-sm text-gray-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(stand.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={stand.status === 'approved' ? 'default' : 'secondary'}>
                              {stand.status}
                            </Badge>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {stand.total_price?.toFixed(2) || '0.00'} TND
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoices Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Factures & Devis ({contactInvoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contactInvoices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucune facture trouvée
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactInvoices.map(invoice => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <div className="font-medium">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                              {invoice.stand_name && (
                                <span className="ml-2">• Stand: {invoice.stand_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' : 
                              invoice.status === 'facture' ? 'secondary' : 
                              'outline'
                            }>
                              {invoice.status === 'devis' ? 'Devis' : 
                               invoice.status === 'facture' ? 'Facture' : 
                               'Payée'}
                            </Badge>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {invoice.total_ttc?.toFixed(2)} TND
                            </div>
                            {invoice.advance_payment > 0 && (
                              <div className="text-xs text-green-600">
                                Avance: {invoice.advance_payment.toFixed(2)} TND
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Summary */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Résumé Financier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Devis en cours</div>
                      <div className="text-xl font-bold text-gray-800">{calculateHistoryStats().devisCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Factures</div>
                      <div className="text-xl font-bold text-gray-800">{calculateHistoryStats().factureCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Payé</div>
                      <div className="text-xl font-bold text-green-600">{calculateHistoryStats().paidAmount} TND</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Restant à payer</div>
                      <div className="text-xl font-bold text-orange-600">{calculateHistoryStats().pendingAmount} TND</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
