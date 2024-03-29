import os
import json
from django.contrib.gis.geos import Point
from .models import Pub

def run(verbose=True):
    geojson_file = os.path.abspath('static\dublinpubs.geojson')
    with open(geojson_file, 'r') as f:
        data = json.load(f)

    for feature in data['features']:
        pub = Pub()
        pub.id = feature['id']
        pub.amenity = feature['properties'].get('amenity')
        pub.name = feature['properties'].get('name')
        if pub.name is None:
            continue  # Skip this feature if the name is null
        pub.addr_city = feature['properties'].get('addr:city')
        pub.addr_country = feature['properties'].get('addr:country')
        pub.addr_county = feature['properties'].get('addr:county')
        pub.addr_housename = feature['properties'].get('addr:housename')
        pub.addr_housenumber = feature['properties'].get('addr:housenumber')
        pub.postcode = feature['properties'].get('postcode')
        pub.addr_street = feature['properties'].get('addr:street')
        pub.phone = feature['properties'].get('phone')
        pub.website = feature['properties'].get('website')
        pub.wheelchair = feature['properties'].get('wheelchair')
        coordinates = feature['geometry']['coordinates']
        pub.location = Point(coordinates[0], coordinates[1])
        pub.save()

    if verbose:
        print('Successfully loaded pubs data')
