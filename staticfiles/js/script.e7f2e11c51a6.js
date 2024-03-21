// Map initialization
const map = L.map("map", { doubleClickZoom: false }).locate({ setView: true, watch: true, maxZoom: 16 });
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
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
const icon = L.icon({ iconUrl: '/static/icon.png', iconSize: [40, 40] });

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
}

map.on("locationfound", onLocationFound);
map.on("click", e => { if (gpsMarker) alert(`You are ${gpsMarker.getLatLng().distanceTo(e.latlng).toFixed(2)} meters away from this point`); });


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

