// Global variable to store all markers
let markers = [];
let geoJsonData; // Variable to store the GeoJSON data
let matchingPubs = [];

// Add event listener to the directions button
const directionsButton = document.getElementById('directionsButton');
directionsButton.addEventListener('click', showDirectionsToClosestPub);
const searchButton = document.getElementById('searchButton');


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
    mapContainer.style.width = '800px'; // Set the desired width
    mapContainer.style.height = '600px'; // Set the desired height
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

function toggleAudio(audioId) {
    var audio = document.getElementById(audioId);
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

fetch('/pubs_geojson/')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        geoJsonData = data; // Store the data
        addMarkersToMap(data); // Add markers to the map
    });

function addMarkersToMap(data) {
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            let marker = L.marker(latlng, { icon: icon });
            markers.push(marker); // Add the marker to the array
            return marker;
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
                pubContent += "<p>Wheelchair Access: " + feature.properties.wheelchair + "</p>";
            }
            if (feature.properties.artist) {
                pubContent += "<p>Artist Preforming: " + feature.properties.artist + "</p>";
            }
            if (feature.properties.songURL) {
                pubContent += `
                    <audio id="audio_${feature.properties['@id']}" src="${feature.properties.songURL}"></audio>
                    <button onclick="toggleAudio('audio_${feature.properties['@id']}')">Play Sample</button>
                `;
            }

            layer.bindPopup(pubContent);

            // Add click event to show route to pub
            layer.on('click', function () {
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

                    // Hide all other markers from the map
                    markers.forEach(function (marker) {
                        if (marker !== layer) {
                            map.removeLayer(marker);
                        }
                    });
                }
            });

            // Add click event to the map to show all markers and remove directions
            map.on('click', function () {
                // Show all markers
                markers.forEach(function (marker) {
                    map.addLayer(marker);
                });

                // If a route exists, remove it
                if (window.route) {
                    map.removeControl(window.route);
                    window.route = null;
                }

                // Reset the matchingPubs array
                matchingPubs = markers;
            });
        },
    }).addTo(map);
}

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

searchButton.addEventListener('click', function() {
    // Get the search query from the search input field
    var searchQuery = document.getElementById('searchInput').value.toLowerCase();

    // Update matchingP ubs to only include the pubs that match the search term
    matchingPubs = markers.filter(marker => marker.feature.properties.name.toLowerCase().includes(searchQuery));

    // Iterate over all the markers
    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];

        // Get the name of the pub associated with the marker
        var pubName = marker.feature.properties.name.toLowerCase();

        // If the pub name includes the search query, show the marker
        if (pubName.includes(searchQuery)) {
            marker.addTo(map);
        }
        // Otherwise, remove the marker from the map
        else {
            map.removeLayer(marker);
        }
    }
});

function showDirectionsToClosestPub() {
    // Check if the user's location has been found
    if (gpsMarker) {
        // Calculate distance to each visible pub and find the closest one
        let closestPub;
        let closestDistance = Infinity;
                matchingPubs.forEach(function (marker) {
            let distance = marker.getLatLng().distanceTo(gpsMarker.getLatLng());
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPub = marker;
            }
        });

        // Show route to the closest pub
        if (closestPub) {
            if (window.route) {
                map.removeControl(window.route);
            }
            window.route = L.Routing.control({
                waypoints: [
                    L.latLng(gpsMarker.getLatLng().lat, gpsMarker.getLatLng().lng),
                    L.latLng(closestPub.getLatLng().lat, closestPub.getLatLng().lng)
                ],
                routeWhileDragging: true
            }).addTo(map);
        } else {
            alert('No pubs found.');
        }
    } else {
        alert('Location not found. Please enable location services.');
    }
}



