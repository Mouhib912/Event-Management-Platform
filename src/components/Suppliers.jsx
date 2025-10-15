import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import apiService from '@/services/api'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    speciality: ''
  })

  // Load suppliers from backend
  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setIsLoading(true)
      // Load ALL contacts, then filter client-side
      const data = await apiService.getContacts('all')
      // Filter to ensure we only get fournisseur or both types
      const supplierData = data.filter(c => 
        c.contact_type === 'fournisseur' || c.contact_type === 'both'
      )
      setSuppliers(supplierData || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Erreur lors du chargement des fournisseurs')
      setSuppliers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Allow all authenticated users to edit suppliers
  const canEdit = true

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.contact_person || !formData.email) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    try {
      setIsLoading(true)

      if (editingSupplier) {
        await apiService.updateSupplier(editingSupplier.id, formData)
        toast.success('Fournisseur modifié avec succès')
      } else {
        await apiService.createSupplier(formData)
        toast.success('Fournisseur ajouté avec succès')
      }

      await loadSuppliers()
      resetForm()
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('Erreur lors de l\'enregistrement du fournisseur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      speciality: supplier.speciality || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        setIsLoading(true)
        await apiService.deleteSupplier(id)
        toast.success('Fournisseur supprimé avec succès')
        await loadSuppliers()
      } catch (error) {
        console.error('Error deleting supplier:', error)
        toast.error('Erreur lors de la suppression du fournisseur')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      speciality: ''
    })
    setEditingSupplier(null)
    setIsDialogOpen(false)
  }

  const getStatusColor = (status) => {
    return status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Fournisseurs</h1>
          <p className="text-muted-foreground">
            Gérez votre base de données de fournisseurs
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
                </DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur à votre base de données'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'entreprise *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom du fournisseur"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Personne de contact *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder="Nom du contact"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Adresse complète"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="speciality">Spécialité</Label>
                  <Input
                    id="speciality"
                    value={formData.speciality}
                    onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
                    placeholder="Domaines d'expertise"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Enregistrement...' : (editingSupplier ? 'Modifier' : 'Ajouter')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, contact ou spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <CardDescription>{supplier.contact_person}</CardDescription>
                </div>
                <Badge className={getStatusColor(supplier.status)}>
                  {supplier.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {supplier.email}
                </div>
                {supplier.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {supplier.address}
                  </div>
                )}
              </div>
              
              {supplier.speciality && (
                <div>
                  <p className="text-sm font-medium">Spécialité:</p>
                  <p className="text-sm text-muted-foreground">{supplier.speciality}</p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Ajouté le {new Date(supplier.createdAt).toLocaleDateString('fr-FR')}
              </div>
              
              {canEdit && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Supprimer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucun fournisseur trouvé pour cette recherche.' : 'Aucun fournisseur enregistré.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
