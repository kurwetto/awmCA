// Map initialization
const map = L.map("map", { doubleClickZoom: false }).locate({
  setView: true,
  watch: true,
  maxZoom: 16,
});

let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
osm.addTo(map);

L.control.locate().addTo(map);

map.on("locationfound", onLocationFound);

// Replace 'iconUrl' with the correct path to your icon image
var icon = L.icon({
  iconUrl: '/static/icon.png', // Update with the correct path
  iconSize: [40, 40], // size of the icon
});

// Fetch GeoJson data
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
        let Pub = "";

        if (feature.properties.name) {
          Pub += "<p>Name: " + feature.properties.name + "</p>";
        }
        if (feature.properties.amenity) {
          Pub += "<p>Bar/Pub: " + feature.properties.amenity + "</p>";
        }
        if (feature.properties.postcode) {
          Pub += "<p>Address: " + feature.properties.postcode + "</p>";
        }
        if (feature.properties.wheelchair) {
          Pub += "<p>Wheelchair: " + feature.properties.wheelchair + "</p>";
        }
        layer.bindPopup(Pub);
      },
    }).addTo(map);
  });

let gpsMarker = null;
let gpsCircleMarker;

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

  let url = "/update_location/";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  }).then((response) => {
    return response.json();
  });
}

// Function to calculate distance between two points
function calculateDistance(latlng1, latlng2) {
  return latlng1.distanceTo(latlng2);
}

map.on("click", function (e) {
  if (gpsMarker != null) {
    let distance = calculateDistance(gpsMarker.getLatLng(), e.latlng);
    alert("You are " + distance.toFixed(2) + " meters away from this point");
  }
});

// Puts map into a centered box.
setTimeout(() => {
  const mapContainer = document.getElementById('map');
  mapContainer.style.position = 'absolute';
  mapContainer.style.top = '50%';
  mapContainer.style.left = '50%';
  mapContainer.style.transform = 'translate(-50%, -65%)';
  mapContainer.style.width = '750px'; // Set the desired width
  mapContainer.style.height = '500px'; // Set the desired height
  map.setView([map.getCenter().lat, map.getCenter().lng], map.getZoom());
  map.invalidateSize(); // Invalidate the size to redraw the map
}, 100);



// Attempt to link spotify API
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = '[BQBnKUurnz086bGLH2rWAhqEDgaui31OHfpJIJSkSWgpVlY1RGAzQm-n5UPAit2pLbv7bC8WUGAg0ehue8-Fw-GdvguouuOHp_aG6lxFH2igoIYIOGYCN7-l8sbOvKVSd3J5V1jIk88md7UBI9P7-hym6nzKI5TvWoqSvwoS8SReVMK605ChZ1tNflYMZapUCpoe3Wi4bxHS-kOcd-qjE6MLLfD-]';
  const player = new Spotify.Player({
    name: 'Web Playback SDK Quick Start Player',
    getOAuthToken: cb => { cb(token); },
    volume: 0.5
});

      // Error handling
      player.addListener('initialization_error', ({ message }) => { console.error(message); });
      player.addListener('authentication_error', ({ message }) => { console.error(message); });
      player.addListener('account_error', ({ message }) => { console.error(message); });
      player.addListener('playback_error', ({ message }) => { console.error(message); });

      // Playback status updates
      player.addListener('player_state_changed', state => { console.log(state); });

      // Ready
      player.addListener('ready', ({ device_id }) => {
     console.log('Ready with Device ID', device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
     console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player!
      player.connect();
    }

    // Attempt to play a song
    document.getElementById('play').addEventListener('click', () => {
      player.togglePlay();
    });



