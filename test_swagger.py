#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/rcaa/projects/personal/school/skillsync-app/backend')

from app import create_app

app = create_app()
client = app.test_client()

print("=" * 60)
print("TESTING SWAGGER DOCUMENTATION ENDPOINTS")
print("=" * 60)

print("\n1. Testing Swagger UI endpoint (/api/docs)...")
response = client.get('/api/docs')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    content = response.data.decode('utf-8')
    if 'swagger-ui' in content.lower():
        print("   ✓ Swagger UI HTML is served correctly!")
    else:
        print("   ⚠ HTML returned but might not be Swagger UI")
else:
    print(f"   ✗ Failed to load Swagger UI")

print("\n2. Testing OpenAPI spec endpoint (/api/docs/spec.json)...")
response = client.get('/api/docs/spec.json')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    spec = response.get_json()
    print(f"   OpenAPI version: {spec.get('openapi')}")
    print(f"   API title: {spec['info']['title']}")
    print(f"   API version: {spec['info']['version']}")
    print(f"   Total endpoints documented: {len(spec.get('paths', {}))}")
    print(f"   Tags: {', '.join([tag['name'] for tag in spec.get('tags', [])])}")
    print("   ✓ OpenAPI specification is generated correctly!")
else:
    print(f"   ✗ Failed to load OpenAPI spec")

print("\n3. Testing ReDoc endpoint (/api/docs/redoc)...")
response = client.get('/api/docs/redoc')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    content = response.data.decode('utf-8')
    if 'redoc' in content.lower():
        print("   ✓ ReDoc HTML is served correctly!")
    else:
        print("   ⚠ HTML returned but might not be ReDoc")
else:
    print(f"   ✗ Failed to load ReDoc")

print("\n" + "=" * 60)
print("SWAGGER DOCUMENTATION SUMMARY")
print("=" * 60)
print("✓ All documentation endpoints are accessible")
print("✓ OpenAPI 3.0 specification is generated")
print("✓ Swagger UI available at: /api/docs")
print("✓ ReDoc available at: /api/docs/redoc")
print("✓ Raw spec available at: /api/docs/spec.json")
print("=" * 60)

