// Map initialization
map = L.map('map', { doubleClickZoom: false }).locate({ setView: true, maxZoom: 16 });

// OSM layer
const osm1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
osm1.addTo(map);

L.control.locate().addTo(map);

// Additional map layers
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Add layer control
const baseLayers = {
    'OpenStreetMap': osm1,
    'Satellite': satelliteLayer,
};

L.control.layers(baseLayers).addTo(map);

map.on('locationfound', onLocationFound);
map.on('click', onMapClick);

// GPS marker
let gpsMarker = null;
let gpsCircleMarker;

// GPS marker popup
function onLocationFound(e) {
    let radius = e.accuracy / 2;
    let popupContent = "You are within " + radius + " meters from this point";

    if (gpsMarker == null) {
        gpsMarker = L.marker(e.latlng).addTo(map);
        gpsMarker.bindPopup(popupContent).openPopup();
        gpsCircleMarker = L.circle(e.latlng, radius).addTo(map);
    } else {
        gpsMarker.getPopup().setContent(popupContent);
        gpsMarker.setLatLng(e.latlng);
        gpsCircleMarker.setLatLng(e.latlng);
        gpsCircleMarker.setRadius(radius);
    }

    let url = '/update_location/';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ 'latitude': e.latlng.lat, 'longitude': e.latlng.lng })
    })
        .then((response) => {
            return response.json();
        });
}

// function that shows your distance away from point clicked on map
function onMapClick(e) {
    if (gpsMarker != null) {
        let distance = gpsMarker.getLatLng().distanceTo(e.latlng);
        alert("You are " + distance + " meters away from this point");
    }
}
