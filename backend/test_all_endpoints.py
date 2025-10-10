"""
Comprehensive test of all API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

# Login first
print("=" * 60)
print("1. TESTING LOGIN")
print("=" * 60)
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "owner@eventmanagement.com",
    "password": "owner123"
})
print(f"Status: {response.status_code}")
if response.status_code != 200:
    print(f"❌ Login failed: {response.text}")
    exit(1)

token = response.json().get('access_token')
headers = {"Authorization": f"Bearer {token}"}
print("✅ Login successful")

# Test all endpoints
endpoints_to_test = [
    ("GET", "/suppliers", None, "Suppliers"),
    ("GET", "/categories", None, "Categories"),
    ("GET", "/products", None, "Products"),
    ("GET", "/auth/me", None, "Current User"),
]

print("\n" + "=" * 60)
print("2. TESTING ALL GET ENDPOINTS")
print("=" * 60)

for method, endpoint, data, name in endpoints_to_test:
    url = f"{BASE_URL}{endpoint}"
    if method == "GET":
        response = requests.get(url, headers=headers)
    else:
        response = requests.post(url, json=data, headers=headers)
    
    status_icon = "✅" if response.status_code == 200 else "❌"
    print(f"{status_icon} {name}: {response.status_code}")
    
    if response.status_code != 200:
        print(f"   Error: {response.text[:100]}")
    else:
        data = response.json()
        if isinstance(data, list):
            print(f"   Found {len(data)} items")
        elif isinstance(data, dict):
            print(f"   Keys: {list(data.keys())}")

print("\n" + "=" * 60)
print("3. TESTING CREATE ENDPOINTS")
print("=" * 60)

# Test creating a category
print("\nTesting POST /categories...")
response = requests.post(f"{BASE_URL}/categories", json={
    "name": "Test Category",
    "description": "A test category",
    "color": "#ff0000"
}, headers=headers)
status_icon = "✅" if response.status_code == 201 else "❌"
print(f"{status_icon} Create Category: {response.status_code}")
if response.status_code != 201:
    print(f"   Error: {response.text}")

# Test creating a supplier
print("\nTesting POST /suppliers...")
response = requests.post(f"{BASE_URL}/suppliers", json={
    "name": "Test Supplier",
    "contact_person": "Test Contact",
    "email": "test@supplier.com",
    "phone": "+123456789",
    "address": "Test Address",
    "status": "Actif"
}, headers=headers)
status_icon = "✅" if response.status_code == 201 else "❌"
print(f"{status_icon} Create Supplier: {response.status_code}")
if response.status_code != 201:
    print(f"   Error: {response.text}")

print("\n" + "=" * 60)
print("✅ ALL TESTS COMPLETED!")
print("=" * 60)
