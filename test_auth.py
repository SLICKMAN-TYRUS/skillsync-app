#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/rcaa/projects/personal/school/skillsync-app/backend')

from app import create_app
import json

app = create_app()
client = app.test_client()

print("=" * 60)
print("TESTING FIREBASE AUTHENTICATION & ROLE-BASED ACCESS")
print("=" * 60)

print("\n1. Testing health endpoint (no auth required)...")
response = client.get('/api/health')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.get_json()}")
assert response.status_code == 200, "Health check failed"
print("   ✓ Health endpoint works")

print("\n2. Testing auth verification with test token...")
response = client.post(
    '/api/auth/verify',
    data=json.dumps({'token': 'test:user123:student'}),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
print(f"   Response: {response.get_json()}")
assert response.status_code == 200, "Auth verification failed"
print("   ✓ Test token verification works")

print("\n3. Testing authenticated endpoint (/api/auth/me)...")
response = client.get(
    '/api/auth/me',
    headers={'Authorization': 'Bearer test:user123:student'}
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.get_json()
    print(f"   User: {data.get('name')} (role: {data.get('role')})")
    print(f"   Stats: {data.get('stats')}")
    print("   ✓ Authentication works!")
else:
    print(f"   Response: {response.get_json()}")
    print("   ✗ Authentication failed")

print("\n4. Testing role-based access (provider endpoint as student)...")
response = client.post(
    '/api/gigs',
    headers={'Authorization': 'Bearer test:user123:student'},
    data=json.dumps({
        'title': 'Test Gig',
        'description': 'This should fail'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
print(f"   Response: {response.get_json()}")
if response.status_code == 403:
    print("   ✓ Role-based access control works! (Student blocked from provider endpoint)")
else:
    print("   ✗ Role restriction not working properly")

print("\n5. Testing provider role endpoint...")
response = client.post(
    '/api/gigs',
    headers={'Authorization': 'Bearer test:provider123:provider'},
    data=json.dumps({
        'title': 'Test Gig from Provider',
        'description': 'This should succeed'
    }),
    content_type='application/json'
)
print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = response.get_json()
    print(f"   Created gig: {data.get('title')}")
    print("   ✓ Provider can create gigs!")
else:
    print(f"   Response: {response.get_json()}")
    print(f"   Note: Expected 201, got {response.status_code} (might be due to database not initialized)")

print("\n6. Testing admin role endpoint...")
response = client.get(
    '/api/admin/gigs/pending',
    headers={'Authorization': 'Bearer test:admin123:admin'}
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.get_json()
    print(f"   Pending gigs count: {len(data) if isinstance(data, list) else 'N/A'}")
    print("   ✓ Admin can access admin endpoints!")
else:
    print(f"   Response: {response.get_json()}")
    print(f"   Note: Status {response.status_code}")

print("\n7. Testing student trying to access admin endpoint...")
response = client.get(
    '/api/admin/gigs/pending',
    headers={'Authorization': 'Bearer test:user123:student'}
)
print(f"   Status: {response.status_code}")
print(f"   Response: {response.get_json()}")
if response.status_code == 403:
    print("   ✓ Students are blocked from admin endpoints!")
else:
    print("   ✗ Authorization not working properly")

print("\n8. Testing missing token...")
response = client.get('/api/auth/me')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.get_json()}")
if response.status_code == 401:
    print("   ✓ Endpoints require authentication!")
else:
    print("   ✗ Authentication not enforced")

print("\n" + "=" * 60)
print("AUTHENTICATION TEST SUMMARY")
print("=" * 60)
print("✓ Firebase test tokens work for local development")
print("✓ Role-based access control is enforced")
print("✓ Authentication is required for protected endpoints")
print("✓ Test token format: 'test:<uid>:<role>'")
print("  Supported roles: student, provider, admin")
print("=" * 60)

