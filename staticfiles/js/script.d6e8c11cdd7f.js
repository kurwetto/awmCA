// Global variable to store all markers
let markers = [];
let geoJsonData; // Variable to store the GeoJSON data
let matchingPubs = [];

// Add event listener to the directions button
const directionsButton = document.getElementById('directionsButton');
directionsButton.addEventListener('click', showDirectionsToClosestPub);
const searchButton = document.getElementById('searchButton');

// Map initialization with default tile layer
const map = L.map("map", {
    doubleClickZoom: false
}).locate({
    setView: true,
    watch: true,
    maxZoom: 16
});

// Default tile layer (OpenStreetMap)
const defaultTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Satellite tile layer (Google Maps)
const satelliteTileLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

// Add default tile layer to map
defaultTileLayer.addTo(map);

// Layer control
const baseLayers = {
    "Default": defaultTileLayer,
    "Satellite": satelliteTileLayer
};

// Add layer control to switch between map layers
L.control.layers(baseLayers).addTo(map);

// Reset the matchingPubs array
matchingPubs = markers;

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


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
function favouritePub(pubId) {
    // Get the user's ID
     let userId = getCookie('userId');

    fetch(`/admin/worldapp/pub/${pubId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId })  // Send the user's ID in the request body
    })
    .then(response => response.json())
    .then(data => {
        if (data.favourite) {
            alert('Pub has been favourited!');
        } else {
            alert('Pub has been unfavourited!');
        }
    });
}


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
             // Add "Show Directions" button to the popup content
            pubContent += `<button onclick="showDirections('${feature.properties.name}', ${layer.getLatLng().lat}, ${layer.getLatLng().lng})">Show Directions</button>`;
            pubContent += `<button onclick="favouritePub('${feature.properties.id}')">Favourite</button>`;
            layer.bindPopup(pubContent);

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
    map.stopLocate();
}

map.on("locationfound", onLocationFound);

searchButton.addEventListener('click', function() {
    // Get the search query from the search input field
    var searchQuery = document.getElementById('searchInput').value.toLowerCase();

    // Update matchingP ubs to only include the pubs that match the search term
    matchingPubs = markers.filter(marker => marker.feature.properties.name.toLowerCase().includes(searchQuery));

    if (window.route) {
                    map.removeControl(window.route);
                    window.route = null;
                }

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

function showDirections(pubName, lat, lng) {
    if (gpsMarker) {
        // Remove existing route if any
        if (window.route) {
            map.removeControl(window.route);
        }

        // Create a route from user's location to the selected pub
        window.route = L.Routing.control({
            waypoints: [
                L.latLng(gpsMarker.getLatLng().lat, gpsMarker.getLatLng().lng),
                L.latLng(lat, lng)
            ],
            routeWhileDragging: true
        }).addTo(map);

        // Find the marker for the selected pub
        let selectedMarker = markers.find(marker => marker.feature.properties.name === pubName);

        // Hide all other markers from the map
        markers.forEach(function (marker) {
            if (marker !== selectedMarker) {
                map.removeLayer(marker);
            }
        });
    } else {
        alert('Location not found. Please enable location services.');
    }
}

