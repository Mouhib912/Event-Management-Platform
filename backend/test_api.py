"""
Test the suppliers API endpoint directly
"""
import requests
import json

# First login to get token
login_url = "http://localhost:5000/api/auth/login"
login_data = {
    "email": "owner@eventmanagement.com",
    "password": "owner123"
}

print("=" * 50)
print("Testing Login...")
print("=" * 50)
response = requests.post(login_url, json=login_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    token = response.json().get('access_token')
    
    # Now try to get suppliers
    print("\n" + "=" * 50)
    print("Testing GET /api/suppliers...")
    print("=" * 50)
    suppliers_url = "http://localhost:5000/api/suppliers"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(suppliers_url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Try to create a supplier
    print("\n" + "=" * 50)
    print("Testing POST /api/suppliers...")
    print("=" * 50)
    new_supplier = {
        "name": "Test Supplier",
        "contact_person": "John Doe",
        "email": "test@example.com",
        "phone": "+123456789",
        "address": "Test Address",
        "status": "Actif"
    }
    
    response = requests.post(suppliers_url, json=new_supplier, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
