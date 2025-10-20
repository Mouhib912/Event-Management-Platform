// API Service for Frontend-Backend Communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.access_token) {
      this.setToken(response.access_token)
    }
    
    return response
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  logout() {
    this.setToken(null)
  }

  // Users
  async getUsers() {
    return this.request('/users')
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    })
  }

  // Contacts (Unified Clients + Suppliers)
  async getContacts(type = 'all') {
    const params = type !== 'all' ? `?type=${type}` : ''
    return this.request(`/contacts${params}`)
  }

  async createContact(contactData) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    })
  }

  async updateContact(contactId, contactData) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    })
  }

  async deleteContact(contactId) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    })
  }

  async getEnterprises() {
    return this.request('/contacts/enterprises')
  }

  async getEnterpriseEmployees(enterpriseId) {
    return this.request(`/contacts/enterprises/${enterpriseId}/employees`)
  }

  // Suppliers
  async getSuppliers() {
    return this.request('/suppliers')
  }

  async createSupplier(supplierData) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    })
  }

  async updateSupplier(supplierId, supplierData) {
    return this.request(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    })
  }

  async deleteSupplier(supplierId) {
    return this.request(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    })
  }

  // Clients
  async getClients() {
    return this.request('/clients')
  }

  async createClient(clientData) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    })
  }

  async updateClient(clientId, clientData) {
    return this.request(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    })
  }

  async deleteClient(clientId) {
    return this.request(`/clients/${clientId}`, {
      method: 'DELETE',
    })
  }

  // Categories
  async getCategories() {
    return this.request('/categories')
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async updateCategory(categoryId, categoryData) {
    return this.request(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteCategory(categoryId) {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE',
    })
  }

  // Products
  async getProducts() {
    return this.request('/products')
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(productId, productData) {
    return this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
  }

  async deleteProduct(productId) {
    return this.request(`/products/${productId}`, {
      method: 'DELETE',
    })
  }

  // Stands
  async getStands() {
    return this.request('/stands')
  }

  async createStand(standData) {
    return this.request('/stands', {
      method: 'POST',
      body: JSON.stringify(standData),
    })
  }

  async updateStand(standId, standData) {
    return this.request(`/stands/${standId}`, {
      method: 'PUT',
      body: JSON.stringify(standData),
    })
  }

  async deleteStand(standId) {
    return this.request(`/stands/${standId}`, {
      method: 'DELETE',
    })
  }

  async validateStandLogistics(standId) {
    return this.request(`/stands/${standId}/validate-logistics`, {
      method: 'POST',
    })
  }

  async validateStandFinance(standId) {
    return this.request(`/stands/${standId}/validate-finance`, {
      method: 'POST',
    })
  }

  // Purchases
  async getPurchases() {
    return this.request('/purchases')
  }

  async createPurchase(purchaseData) {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    })
  }

  async downloadPurchasePDF(purchaseId) {
    const url = `${API_BASE_URL}/purchases/${purchaseId}/pdf`
    const response = await fetch(url, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `bon_commande_${purchaseId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }

  // Invoices
  async getInvoices() {
    return this.request('/invoices')
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    })
  }

  async updateInvoiceStatus(invoiceId, data) {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async downloadInvoicePDF(invoiceId) {
    const url = `${API_BASE_URL}/invoices/${invoiceId}/pdf`
    const response = await fetch(url, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to download invoice PDF')
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `facture_client_${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }
}

export default new ApiService()
