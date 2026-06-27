import urllib.request, json, sys
base = 'http://127.0.0.1:8000'

def fetch(path):
    try:
        with urllib.request.urlopen(base + path, timeout=10) as r:
            data = r.read().decode()
            return json.loads(data)
    except Exception as e:
        return {'__error': str(e)}

if __name__ == '__main__':
    p = fetch('/api/pipeline')
    print('--- PIPELINE ---')
    if '__error' in p:
        print('PIPELINE ERROR:', p['__error'])
    else:
        print(json.dumps(p, indent=2)[:2000])

    c = fetch('/api/candidates?page=1&limit=2')
    print('\n--- CANDIDATES ---')
    if '__error' in c:
        print('CANDIDATES ERROR:', c['__error'])
        sys.exit(0)
    else:
        print(json.dumps(c, indent=2)[:2000])
        items = c.get('items', [])
        if len(items) >= 2:
            id1 = items[0]['candidate_id']
            id2 = items[1]['candidate_id']
            print(f"\nWill compare {id1} {id2}")
            comp = fetch(f'/api/compare?id1={id1}&id2={id2}')
            print('\n--- COMPARE ---')
            if '__error' in comp:
                print('COMPARE ERROR:', comp['__error'])
            else:
                print(json.dumps(comp, indent=2)[:4000])
