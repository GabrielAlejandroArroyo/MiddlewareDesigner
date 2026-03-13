#!/usr/bin/env python3
"""Script para probar el endpoint runtime y ver la estructura real de datos."""

import json
import sys

try:
    import urllib.request
    with urllib.request.urlopen("http://127.0.0.1:9000/api/v1/apps/by-slug/cocomo", timeout=5) as r:
        app = json.loads(r.read().decode())
    app_id = app["id"]
    role_id = app["roles"][0]["id_role"] if app.get("roles") else None
    if not role_id:
        print("No hay roles en la app")
        sys.exit(1)
    url = f"http://127.0.0.1:9000/api/v1/apps/{app_id}/runtime/{role_id}"
    with urllib.request.urlopen(url, timeout=5) as r:
        config = json.loads(r.read().decode())
    print("=== RUNTIME CONFIG ===")
    print(json.dumps(config, indent=2, ensure_ascii=False))
    print("\n=== MODULES (resumen) ===")
    for i, m in enumerate(config.get("modules", [])):
        print(f"  [{i}] {m.get('backend_service_id')} {m.get('metodo')} {m.get('endpoint_path')}")
    print("\n=== MENU (primer item, children) ===")
    menu = config.get("menu_structure", [])
    if menu:
        first = menu[0]
        print(f"Parent: {first.get('label')}")
        for j, c in enumerate(first.get("children", [])):
            print(f"  Child[{j}]: label={c.get('label')!r} target_service_id={c.get('target_service_id')!r} target_endpoint_path={c.get('target_endpoint_path')!r} target_endpoint_method={c.get('target_endpoint_method')!r}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
