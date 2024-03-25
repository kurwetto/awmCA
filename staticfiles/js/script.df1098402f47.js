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

    // Find and set the nearest pub as destination for routing
    findNearestPub(e.latlng.lat, e.latlng.lng);
}

map.on("locationfound", onLocationFound);
map.on("click", e => {
    if (gpsMarker)
        alert(`You are ${gpsMarker.getLatLng().distanceTo(e.latlng).toFixed(2)} meters away from this point`);
});

// Initialize Leaflet Routing Machine control
const control = L.Routing.control({
    waypoints: [],
    lineOptions: {
        styles: [{ color: '#007bff', opacity: 0.7, weight: 5 }]
    },
    createMarker: function (i, waypoint, n) {
        if (i === n - 1) {
            // Last waypoint (destination)
            return L.marker(waypoint.latLng, {
                icon: L.divIcon({ className: 'fa fa-flag' })
            });
        } else {
            // First waypoint (current location)
            return L.marker(waypoint.latLng, {
                icon: L.divIcon({ className: 'fa fa-map-marker' })
            });
        }
    }
}).addTo(map);

// Function to find and set the nearest pub as destination for routing
function findNearestPub(currentLat, currentLng) {
    // Initialize variables to hold nearest pub and its distance
    let nearestPub;
    let minDistance = Infinity;

    // Iterate through each pub marker to find the nearest one
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            const pubLat = layer.getLatLng().lat;
            const pubLng = layer.getLatLng().lng;
            const distance = map.distance([currentLat, currentLng], [pubLat, pubLng]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPub = layer.getLatLng();
            }
        }
    });

    // Set the waypoints for routing (current location and nearest pub)
    control.setWaypoints([
        L.latLng(currentLat, currentLng),
        nearestPub
    ]);

    // Open the routing control if it's not open already
    if (!control._routing || !control._routing._container || !control._routing._container.parentNode) {
        control.addTo(map);
    }
}
