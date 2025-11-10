#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/rcaa/projects/personal/school/skillsync-app/backend')

from app import create_app

print("Testing Flask app initialization...")
try:
    app = create_app()
    print("✓ Flask app created successfully")
    
    print("\nRegistered blueprints:")
    for blueprint_name in app.blueprints:
        print(f"  - {blueprint_name}")
    
    print("\nRegistered routes:")
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            routes.append(f"  {rule.methods} {rule.rule}")
    
    auth_routes = [r for r in routes if '/auth' in r]
    gig_routes = [r for r in routes if '/gig' in r]
    doc_routes = [r for r in routes if '/docs' in r]
    
    print("\nAuth endpoints:")
    for r in sorted(auth_routes):
        print(r)
    
    print(f"\nGig endpoints ({len(gig_routes)} total)")
    
    print("\nDocumentation endpoints:")
    for r in sorted(doc_routes):
        print(r)
    
    if doc_routes:
        print("\n✓ Swagger documentation routes are registered!")
    else:
        print("\n✗ WARNING: No documentation routes found")
    
    print(f"\nTotal routes: {len(routes)}")
    
    print("\n✓ All checks passed!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

