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

map.on("locationfound", onLocationFound);

// Replace 'iconUrl' with the correct path to your icon image
var icon = L.icon({
  iconUrl: '/static/icon.png', // Update with the correct path
  iconSize: [50, 50], // size of the icon
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
        let petrolStation = "";

        if (feature.properties.name) {
          petrolStation += "<p>" + feature.properties.name + "</p>";
        }
        if (feature.properties.amenity) {
          petrolStation += "<p>Amenity: " + feature.properties.amenity + "</p>";
        }
        if (feature.properties.wheelchair) {
          petrolStation += "<p>Wheelchair: " + feature.properties.wheelchair + "</p>";
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
