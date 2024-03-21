// Map initialization
const map = L.map("map", { doubleClickZoom: false }).locate({ setView: true, watch: true, maxZoom: 16 });
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
L.control.locate().addTo(map);

// Set map container styles
const mapContainer = document.getElementById('map');
mapContainer.style.cssText = 'position: absolute; top: 60%; left: 50%; transform: translate(-50%, -65%); width: 750px; height: 500px;';

// Fetch GeoJson data and add to map
fetch('/static/fuel_location.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJson(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: L.icon({ iconUrl: '/static/icon.png', iconSize: [40, 40] }) }),
      onEachFeature: (feature, layer) => {
        let pubContent = Object.entries(feature.properties)
          .map(([key, value]) => value ? `<p>${key}: ${value}</p>` : '')
          .join('');

        pubContent += '<button id="togglePlay">Toggle Play</button>';

        layer.bindPopup(pubContent);

        layer.on('popupopen', () => {
          document.getElementById('togglePlay').addEventListener('click', () => window.onSpotifyWebPlaybackSDKReady());
        });
      },
    }).addTo(map);
  });

// Handle user location
let gpsMarker, gpsCircleMarker;

function onLocationFound(e) {
  const radius = e.accuracy / 2;
  const popupContent = `You are within ${radius} meters from this point`;

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

map.on("click", e => {
  if (gpsMarker) {
    alert(`You are ${gpsMarker.getLatLng().distanceTo(e.latlng).toFixed(2)} meters away from this point`);
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
