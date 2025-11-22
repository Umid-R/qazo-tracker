import requests


response = requests.get('https://ipinfo.io/json')
data = response.json()

# Coordinates come as a string "lat,lon"
lat, lon = map(float, data['loc'].split(','))
print(f"Latitude: {lat}, Longitude: {lon}")

madhab = 1 #  1 = Hanafi
url = f"https://api.aladhan.com/v1/timings?latitude={lat}&longitude={lon}&method=2&school={madhab}"

response = requests.get(url)
response.raise_for_status()
data = response.json()
print(data['data']['timings'])
