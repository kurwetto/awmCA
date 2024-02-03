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

// Replace 'fuel' with the correct URL or path to your GeoJSON file


let gpsMarker = null;
let gpsCircleMarker;

// Function to filter GeoJSON data within a certain distance
function filterGeoJSONByDistance(userLocation, geoJSONData, distance) {
  return geoJSONData.features.filter((feature) => {
    const featureLocation = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    return userLocation.distanceTo(featureLocation) <= distance;
  });
}
function onLocationFound(e) {
  fetch('/static/fuel_location.geojson')
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    // Filter the GeoJSON data based on distance from user location
    const filteredData = filterGeoJSONByDistance(e.latlng, data, 30000);

    L.geoJson(filteredData, {
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
