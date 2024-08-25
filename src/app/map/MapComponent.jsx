"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MainDock from "@/components/home/dock";

const LocationMarker = ({ position }) => (
  <Marker
    position={position}
    icon={L.divIcon({
      className: "custom-icon",
      html: `<div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        border: 1px solid white;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
      ">
        <img src="https://avatars.githubusercontent.com/u/44896539?v=4" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })}
  />
);

const CenterMapOnLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 16);
  }, [map, position]);
  return null;
};

// Example geofencing data
const geofencingLocations = [
  {
    id: 1,
    name: "Downtown",
    lat: 37.7749,
    lng: -122.4194,
    radius: 200,
    color: "#FF5733",
  },
  {
    id: 2,
    name: "Financial District",
    lat: 37.7847,
    lng: -122.409,
    radius: 150,
    color: "#33FF57",
  },
  {
    id: 3,
    name: "Golden Gate Park",
    lat: 37.7694,
    lng: -122.4862,
    radius: 300,
    color: "#3357FF",
  },
  {
    id: 4,
    name: "Fisherman's Wharf",
    lat: 37.808,
    lng: -122.4177,
    radius: 180,
    color: "#FF33E9",
  },
  {
    id: 5,
    name: "Mission District",
    lat: 37.7599,
    lng: -122.4148,
    radius: 250,
    color: "#33FFF6",
  },
  {
    id: 6,
    name: "Chinatown",
    lat: 37.7941,
    lng: -122.4078,
    radius: 120,
    color: "#FFB733",
  },
  {
    id: 7,
    name: "Admin Block",
    lat: 28.972765,
    lng: 77.641369,
    radius: 40,
    color: "#FF5733",
  },
  {
    id: 8,
    name: "MIET Canteen",
    lat: 28.972845,
    lng: 77.639962,
    radius: 80,
    color: "#FF5733",
  },
  {
    id: 9,
    name: "M-Block",
    lat: 28.974401,
    lng: 77.638944,
    radius: 100,
    color: "#FF5733",
  },
];

const MapComponent = () => {
  const [position, setPosition] = useState([37.7749, -122.4194]); // Default to San Francisco
  const [initialPositionSet, setInitialPositionSet] = useState(false);
  const [nearestLocations, setNearestLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);

  const [geofences, setGeofences] = useState([]);

  useEffect(() => {
    const fetchGeofences = async () => {
      const response = await fetch("/api/getGeofences");
      const data = await response.json();
      setGeofences(data);
    };

    fetchGeofences();
  }, []);

  useEffect(() => {
    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      if (!initialPositionSet) {
        setPosition([latitude, longitude]);
        setInitialPositionSet(true);
      }
    };

    const handleError = (error) => {
      console.error("Error getting location", error);
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [initialPositionSet]);

  useEffect(() => {
    console.log("Calculating distances. Position:", position, "Geofences:", geofences);
    const locationsWithDistance = geofences.map((loc) => {
      const distance = calculateDistance(position[0], position[1], loc.lat, loc.lng);
      console.log(`Distance for ${loc.name}:`, distance);
      return {
        ...loc,
        distance
      };
    });
    console.log("Locations with distances:", locationsWithDistance);
    const sortedLocations = locationsWithDistance.sort((a, b) => a.distance - b.distance);
    setNearestLocations(sortedLocations.slice(0, 5));
  }, [position, geofences]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const calculateEstimatedTime = (distance) => {
    const walkingSpeedKmH = 5;
    const timeHours = distance / walkingSpeedKmH;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes;
  };

  const handleLocationClick = (location) => {
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 16);
    }
    setSelectedLocation(location);
  };

  return (
    <>
      <style jsx global>{`
        .leaflet-control-attribution,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-bottom.leaflet-right {
          display: none;
        }
      `}</style>
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: "40vh", width: "100%" }}
        ref={mapRef}
        zoomControl={false}
        className="border border-b-2 border-gray-400"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <LocationMarker position={position} />
        {nearestLocations.map((location) => (
          <Circle
            key={location.id}
            center={[location.lat, location.lng]}
            radius={location.radius}
            pathOptions={{
              color: location.color,
              fillColor: location.color,
              fillOpacity: 0.3,
            }}
          />
        ))}
        <CenterMapOnLocation position={position} />
      </MapContainer>
      <div className="mt-4 px-4 py-4 mb-16">
        <h2>Nearest Site Locations</h2>
        {nearestLocations.map((location) => (
          <Alert
            key={location.id}
            onClick={() => handleLocationClick(location)}
            className="my-2"
          >
            <Terminal className="h-4 w-4" />
            <div className="gap-2 flex ">
              <AlertTitle className="m-0 pt-1">{location.name}</AlertTitle>
              <Badge
                className="ml-2"
                style={{ backgroundColor: location.color }}
              >
                {location.distance.toFixed(3)} km
              </Badge>
            </div>
            <AlertDescription>
              Estimated time: {calculateEstimatedTime(location.distance)}{" "}
              minutes
            </AlertDescription>
          </Alert>
        ))}
      </div>
      <MainDock />
    </>
  );
};

export default MapComponent;
