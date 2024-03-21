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

    // Add Spotify toggle play button
    pubContent += '<button id="togglePlay">Toggle Play</button>';

    // Bind popup with pub information and Spotify toggle play button
    layer.bindPopup(pubContent);

    // Event listener for the togglePlay button inside the popup
    layer.on('popupopen', function () {
      document.getElementById('togglePlay').addEventListener('click', () => {
        // Trigger Spotify toggle play when the button is clicked
        // You may need to adapt this part based on your application structure
        window.onSpotifyWebPlaybackSDKReady(); // Call your Spotify toggle play logic here
      });
    });
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

// Spotify Web Playback SDK integration
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = 'BQDL9hkn7q6lH0LcgBv9Md5jt_wCnFVs2R7FiK0dX8esU-OhuT--ZGsDmhMIhLECy-9Qcp3ftC_DpTo7C3SU5x1nFvVpDnoLp_b5mmE8BXUY9SGrsztEroExJfil0WI7uTqEVjxtrX-KuVvLo4IgRQ8rW18AKNCO1Rtu08VlkxS_cWsF3ixQq8KOtbUW_ZqbuwPmRXHzUfJDpOUXj2skEOVClAQX';
  const player = new Spotify.Player({ name: 'FYP Musivents Player', getOAuthToken: cb => cb(token), volume: 0.8 });

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    const trackUri = 'spotify:track:142yjgxYc26ON55Zx2M339';
    player.resume({ uris: [trackUri] }).then(() => console.log('Playing track:', trackUri));
  });

  player.connect();
  document.getElementById('togglePlay').addEventListener('click', () => player.togglePlay().then(() => console.log('Toggled playback')));
};


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
