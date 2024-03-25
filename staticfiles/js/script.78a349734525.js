// Map initialization
const map = L.map("map", {
    doubleClickZoom: false
}).locate({
    setView: true,
    watch: true,
    maxZoom: 16
});
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.locate().addTo(map);

// Puts map into a centered box.
setTimeout(() => {
    const mapContainer = document.getElementById('map');
    mapContainer.style.position = 'absolute';
    mapContainer.style.top = '60%';
    mapContainer.style.left = '50%';
    mapContainer.style.transform = 'translate(-50%, -65%)';
    mapContainer.style.width = '750px'; // Set the desired width
    mapContainer.style.height = '500px'; // Set the desired height
    map.setView([map.getCenter().lat, map.getCenter().lng], map.getZoom());
    map.invalidateSize(); // Invalidate the size to redraw the map
}, 100);

// Icon initialization
const icon = L.icon({
    iconUrl: '/static/icon.png',
    iconSize: [40, 40]
});

// Audio initialization
let audio = null;

// Function to play the audio
function playAudio(url) {
    if (audio) {
        audio.pause();
    }
    audio = new Audio(url);
    audio.play();
}

// Layer group to hold all pub markers
const pubMarkers = L.layerGroup().addTo(map);

// Fetch GeoJson data and add to map
fetch('/static/fuel_location.geojson')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        L.geoJson(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: icon });
            },
            onEachFeature: function (feature, layer) {
                let pubContent = "";

                if (feature.properties.name) {
                    pubContent += "<p>Name: " + feature.properties.name + "</p>";
                }
                if (feature.properties.amenity) {
                    pubContent += "<p>Bar/Pub: " + feature.properties.amenity + "</p>";
                }
                if (feature.properties.postcode) {
                    pubContent += "<p>Address: " + feature.properties.postcode + "</p>";
                }
                if (feature.properties.wheelchair) {
                    pubContent += "<p>Wheelchair: " + feature.properties.wheelchair + "</p>";
                }
                if (feature.properties.artist) {
                    pubContent += "<p>Artist Preforming: " + feature.properties.artist + "</p>";
                }

                layer.bindPopup(pubContent);

                // Playback of songURL on click
                if (feature.properties.songURL) {
                    layer.on('click', function () {
                        playAudio(feature.properties.songURL);
                    });
                }

                // Add click event to show route to pub
                layer.on('click', function () {
                    // Clear all existing markers from the map
                    pubMarkers.clearLayers();

                    // Add the clicked pub marker to the map
                    pubMarkers.addLayer(layer);

                    if (gpsMarker) {
                        // If a route already exists, remove it
                        if (window.route) {
                            map.removeControl(window.route);
                        }

                        // Create a new route from the user's location to the pub
                        window.route = L.Routing.control({
                            waypoints: [
                                L.latLng(gpsMarker.getLatLng().lat, gpsMarker.getLatLng().lng),
                                L.latLng(layer.getLatLng().lat, layer.getLatLng().lng)
                            ],
                            routeWhileDragging: true
                        }).addTo(map);
                    }
                });
            },
        }).addTo(map);
    });

// Current Location
let gpsMarker, gpsCircleMarker;
function onLocationFound(e) {
    let radius = e.accuracy / 2;
    let popupContent = `You are within ${radius} meters from this point`;

    if (!gpsMarker) {
        gpsMarker = L.marker(e.latlng).addTo(map).bindPopup(popupContent).openPopup();
        gpsCircleMarker = L.circle(e.latlng, radius).addTo(map);
    } else {
        gpsMarker.getPopup().setContent(popupContent);
        gpsMarker.setLatLng(e.latlng);
        gpsCircleMarker.setLatLng(e.latlng).setRadius(radius);
    }

    fetch("/update_location/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
        body: JSON.stringify({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
    }).then(response => response.json());
     map.stopLocate();
}

map.on("locationfound", onLocationFound);
map.on("click", e => {
    if (gpsMarker)
        alert(`You are ${gpsMarker.getLatLng().distanceTo(e.latlng).toFixed(2)} meters away from this point`);
});

// Add layer control to toggle pub markers
const overlayMaps = {
    "Pubs": pubMarkers
};

L.control.layers(null, overlayMaps).addTo(map);
