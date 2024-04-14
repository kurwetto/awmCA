// Global variable to store all markers
let markers = [];
let geoJsonData; // Variable to store the GeoJSON data
let matchingPubs = [];
let favoritePubs = [];

// Add event listener to the directions button
const directionsButton = document.getElementById('directionsButton');
directionsButton.addEventListener('click', showDirectionsToClosestPub);
const showFavoritesButton = document.getElementById('showFavouritesButton');
showFavoritesButton.addEventListener('click', showFavorites);
const searchButton = document.getElementById('searchButton');

// Map initialization with default tile layer
const map = L.map("map", {
    doubleClickZoom: false,
    zoomControl: false
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

// Add a new zoom control in the top right corner
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Reset the matchingPubs array
matchingPubs = markers;

let icon = L.icon({
    iconUrl: '/static/icon.png',
    iconSize: [40, 40]
});

let favouriteIcon = L.icon({
    iconUrl: '/static/pub.png',
    iconSize: [72.5, 72.5]
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
       function toggleFavorite(pubId) {
    // Send an AJAX request to the backend to toggle the favorite status
    fetch(`/toggle_favourite/${pubId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Function to get CSRF token from cookie
        },
        credentials: 'same-origin' // Include cookies in the request
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'added') {
            // Pub was added to favorites, update UI accordingly (change button color, etc.)
            console.log('Pub added to favorites');
            const messageContainer = document.createElement('div');
        messageContainer.classList.add('fav-added-message');
        messageContainer.textContent = 'Pub added to favorites!';
        } else if (data.status === 'removed') {
            // Pub was removed from favorites, update UI accordingly (change button color, etc.)
            console.log('Pub removed from favorites');
            const messageContainer1 = document.createElement('div');
        messageContainer1.classList.add('fav-removed-message');
        messageContainer1.textContent = 'Pub removed to favorites!';
        }
    })
    .catch(error => console.error('Error:', error));
}
fetch('/get_user_favorites/')
    .then(response => response.json())
    .then(data => {
        favoritePubs = data;
        // Proceed to fetch GeoJSON data
        fetch('/pubs_geojson/')
            .then(response => response.json())
            .then(data => {
                geoJsonData = data; // Store the data
                addMarkersToMap(data); // Add markers to the map
            });
    });



    function addMarkersToMap(data) {
       L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            let markerIcon = favoritePubs.find(fav => fav.pub_id === feature.properties.id) ? favouriteIcon : icon;
            let marker = L.marker(latlng, { icon: markerIcon });
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
                    pubContent += "<p>This Week's Artist:<Artist></Artist>: " + feature.properties.artist + "</p>";
                }
               if (feature.properties.songURL) {
        pubContent += `
            <audio id="audio_${feature.properties['@id']}" src="${feature.properties.songURL}"></audio>
            <button class="myButton" onclick="toggleAudio('audio_${feature.properties['@id']}')">Play Sample</button>
        `;
    }


// Add "Show Directions" button to the popup content
pubContent += `<button class="myButton" onclick="showDirections('${feature.properties.name}', ${layer.getLatLng().lat}, ${layer.getLatLng().lng})">Show Directions</button>`;
pubContent += `<button class="myButton" onclick="toggleFavorite(${feature.properties.id})">Favourite</button>`;

            layer.bindPopup(pubContent);

            // Add click event to the map to show all markers and remove directions
            map.on('click', function () {

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
    let radius = Math.floor(e.accuracy / 2);
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

// Add an event listener to the search input field for keypress event
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    // Check if the pressed key is Enter (key code 13)
    if (event.key === 'Enter') {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Call the search function
        performSearch();
    }
});

// Add an event listener to the clear button
document.getElementById('clearButton').addEventListener('click', function() {
    // Call the clear function
    clearMarkers();
});

// Function to perform the search
function performSearch() {
    // Get the search query from the search input field
    var searchQuery = document.getElementById('searchInput').value.toLowerCase();

    // Update matchingPubs to only include the pubs that match the search term
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
}

// Function to clear markers and show all markers on the map
function clearMarkers() {
    // Show all markers
    markers.forEach(function (marker) {
        map.addLayer(marker);
    });

    // Reset the matchingPubs array
    matchingPubs = markers;

    // Clear the value of the search input field
    document.getElementById('searchInput').value = '';
}

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

// Add event listener to the "Show Favorites" button


// Function to show only favorited pubs
function showFavorites() {
    // Hide all markers
    markers.forEach(function(marker) {
        map.removeLayer(marker);
    });

    // Filter markers to show only favorited pubs
    const favoriteMarkers = markers.filter(function(marker) {
        return favoritePubs.some(function(fav) {
            return fav.pub_id === marker.feature.properties.id;
        });
    });

    // Show only favorite markers on the map
    favoriteMarkers.forEach(function(marker) {
        marker.addTo(map);
    });
}

// Add a control to allow users to locate their current position on the map
L.control.locate({
    position: 'topright', // Position of the control
    strings: {
        title: "Show me where I am", // Title of the control
    },
    locateOptions: {
        maxZoom: 16, // Maximum zoom level when locating the user's position
        watch: true, // Continuously watch the user's position
        enableHighAccuracy: true, // Use high accuracy mode if available
    }
}).addTo(map);