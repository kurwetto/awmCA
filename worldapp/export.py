import json
from django.contrib.gis.geos import Point
from django.core.serializers import serialize
from .models import Pub

def export_to_geojson():
    # Get all Pub objects
    pubs = Pub.objects.all()

    # Create a GeoJSON feature collection
    feature_collection = {
        "type": "FeatureCollection",
        "features": []
    }

    # Iterate over each Pub object and add it as a feature to the collection
    for pub in pubs:
        properties = {
            "name": pub.name,
            "addr_city": pub.addr_city,
            "addr_county": pub.addr_county,
            "postcode": pub.postcode,
            "addr_street": pub.addr_street,
            "amenity": pub.amenity,
            "phone": pub.phone,
            "website": pub.website,
            "wheelchair": pub.wheelchair,
            "songURL": pub.songURL,
        }

        # If pub.artist is not None, add it to properties
        if pub.artist:
            properties["artist"] = pub.artist.artistName

        if pub.songURL:
            properties["songURL"] = pub.songURL

        feature = {
            "type": "Feature",
            "properties": properties,
            "geometry": {
                "type": "Point",
                "coordinates": [pub.location.x, pub.location.y]
            }
        }

        feature_collection["features"].append(feature)

    # Serialize the feature collection to GeoJSON
    geojson = json.dumps(feature_collection)

    # Write the GeoJSON to a file
    with open('static/pubs.geojson', 'w') as f:
        f.write(geojson)

    print('Successfully exported pub data to GeoJSON')

# Call the export_to_geojson function here
export_to_geojson()

print('Successfully exported pub data to GeoJSON')
