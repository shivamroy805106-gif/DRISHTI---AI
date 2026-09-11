import requests

url = "http://localhost:8000/api/incidents"

incidents = [
    {
        "location": "Jaipur, Rajasthan",
        "state": "Rajasthan",
        "district": "Jaipur",
        "disaster_type": "fire",
        "description": "Massive fire in industrial area.",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "affected_population": 500
    },
    {
        "location": "Jodhpur, Rajasthan",
        "state": "Rajasthan",
        "district": "Jodhpur",
        "disaster_type": "drought",
        "description": "Severe water crisis due to lack of rainfall.",
        "latitude": 26.2389,
        "longitude": 73.0243,
        "affected_population": 20000
    },
    {
        "location": "Delhi-Jaipur Highway",
        "state": "Haryana",
        "district": "Gurugram",
        "disaster_type": "accident",
        "description": "Multi-vehicle collision on highway.",
        "latitude": 28.4595,
        "longitude": 77.0266,
        "affected_population": 50
    }
]

for inc in incidents:
    try:
        res = requests.post(url, json=inc)
        if res.status_code == 201:
            print(f"Added {inc['disaster_type']} at {inc['location']}")
        else:
            print(f"Failed to add {inc['disaster_type']}: {res.text}")
    except Exception as e:
        print(f"Error: {e}")
