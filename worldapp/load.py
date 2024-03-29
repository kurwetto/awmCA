import os
import json
from django.contrib.gis.geos import Point
from .models import Pub

def run(verbose=True):
    # Directory containing the GeoJSON files
    directory = os.path.abspath('static/data')

    # Get a list of all files in the directory
    files = os.listdir(directory)

    # Filter only the GeoJSON files
    geojson_files = [file for file in files if file.endswith('.geojson')]

    # Loop through each GeoJSON file
    for geojson_file in geojson_files:
        file_path = os.path.join(directory, geojson_file)

        # Open the GeoJSON file and load the data
        with open(file_path, 'r') as f:
            data = json.load(f)

        # Loop through each feature in the GeoJSON data
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