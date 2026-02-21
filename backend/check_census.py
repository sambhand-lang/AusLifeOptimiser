import json
with open('data/abs/abs_census_by_suburb_expanded.json') as f:
    d = json.load(f)
    print(f"Type: {type(d)}")
    if isinstance(d, list):
        print(f"List length: {len(d)}")
        if len(d) > 0:
            print(f"First item keys: {d[0].keys()}")
            print(f"First item: {d[0]}")
    elif isinstance(d, dict):
        print(f"Dict keys: {d.keys()}")
        print(f"Sample: {str(d)[:300]}")
