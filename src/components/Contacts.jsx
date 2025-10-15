import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Users, Building2, ShoppingBag, RefreshCcw, Mail, Phone, MapPin, User } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    contact_type: 'client',
    speciality: '',
    status: 'Actif',
    notes: ''
  });

  useEffect(() => {
    loadContacts();
  }, []);

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

    // Filter by tab (contact type)
    if (activeTab !== 'all') {
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
        c.contact_person?.toLowerCase().includes(search)
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
      name: contact.name || '',
      contact_person: contact.contact_person || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      company: contact.company || '',
      contact_type: contact.contact_type || 'client',
      speciality: contact.speciality || '',
      status: contact.status || 'Actif',
      notes: contact.notes || ''
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

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      contact_type: 'client',
      speciality: '',
      status: 'Actif',
      notes: ''
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
      both: contacts.filter(c => c.contact_type === 'both').length
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Modifier le Contact' : 'Nouveau Contact'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nom du contact ou de l'entreprise"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_person">Personne de Contact</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Nom de la personne"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Société</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Nom de la société"
                  />
                </div>

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
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.clients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.fournisseurs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Les Deux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.both}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Contacts</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="client">Clients ({stats.clients})</TabsTrigger>
              <TabsTrigger value="fournisseur">Fournisseurs ({stats.fournisseurs})</TabsTrigger>
              <TabsTrigger value="both">Les Deux ({stats.both})</TabsTrigger>
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
                    <Card key={contact.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{contact.name}</CardTitle>
                            {contact.company && (
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {contact.company}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(contact)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(contact.id)}
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
    </div>
  );
};

export default Contacts;
