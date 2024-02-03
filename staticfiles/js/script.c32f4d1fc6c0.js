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

// Create a marker at a specific coordinate (example coordinates)
const marker1 = L.marker([51.5, -0.09]).addTo(map);
marker1.bindPopup("<b>Hello!</b><br>This is a marker.").openPopup();

const marker2 = L.marker([51.51, -0.1]).addTo(map);
marker2.bindPopup("<b>Another Marker</b><br>With custom content.").openPopup();

// Handling location found event
function onLocationFound(e) {
  let radius = e.accuracy / 2;
  let popupContent = "You are within " + radius + " meters from this point";

  // Add a marker at the current location
  const gpsMarker = L.marker(e.latlng).addTo(map);
  gpsMarker.bindPopup(popupContent).openPopup();

  // Circle to represent accuracy
  const gpsCircleMarker = L.circle(e.latlng, radius).addTo(map);

  // Your code to update location and perform other actions...
}

map.on("locationfound", onLocationFound);

// Replace 'iconUrl' with the correct path to your icon image
var icon = L.icon({
  iconUrl: '/static/icon.png', // Update with the correct path
  iconSize: [50, 50], // size of the icon
});

// Replace 'fuel' with the correct URL or path to your GeoJSON file
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
        let petrolStation = "";

        if (feature.properties.brand) {
          petrolStation += "<p>" + feature.properties.brand + "</p>";
        }
        if (feature.properties.street) {
          petrolStation += "<p>Street: " + feature.properties.street + "</p>";
        }
        if (feature.properties.city) {
          petrolStation += "<p>City: " + feature.properties.city + "</p>";
        }

        layer.bindPopup(petrolStation);
      },
    }).addTo(map);
  });

let gpsMarker = null;
let gpsCircleMarker;

function onLocationFound(e) {
  let radius = e.accuracy / 2;
  let popupContent = "You are within " + radius + " meters from this point";

  if (gpsMarker == null) {
    gpsMarker = L.marker(e.latlng).addTo(map); // Add a marker at the current location
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
// function calculateDistance(latlng1, latlng2) {
//   return latlng1.distanceTo(latlng2);
// }
//
// map.on("click", function (e) {
//   if (gpsMarker != null) {
//     let distance = calculateDistance(gpsMarker.getLatLng(), e.latlng);
//     alert("You are " + distance.toFixed(2) + " meters away from this point");
//   }
// });
