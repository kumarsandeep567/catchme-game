import React, { useState, useEffect } from "react";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { withStyles } from "@material-ui/core/styles";
import useGeolocation from "./useGeolocation";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
    marginTop: "100px",
  },
  gridList: {
    width: 500,
    height: 450,
  },
  subheader: {
    width: "100%",
  },
});

function GeoLocation(props) {

  // If location is allowed, fetch x,y co-ordinates returned by
  // useEffect() method
  const {
    data: { latitude, longitude },
  } = useGeolocation();

  // Set initial values for Latitude, Longitude, Heading, and Speed
  const [Lat, setLat] = useState(null);
  const [Lon, setLng] = useState(null);
  const [Hea, setHea] = useState(null);
  const [Spd, setSpd] = useState(null);
  
  // Define the default zoom level
  const [zoom, setZoom] = useState(18);

  // Define the default height 
  const defaultHeight = 500;

  // Define the default latitude and longitude values
  const defaultLaitude = 42.33528042187331;
  const defaultLongitude = -71.09702787206938;

  // Set the default center for the map
  const [center, setCenter] = useState([defaultLaitude, defaultLongitude]);

  // Function to update the location
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setHea(position.coords.heading);
          setSpd(position.coords.speed);
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        (e) => {
          console.log(e);
        }
      );
    } else {
      console.log("GeoLocation not supported by your browser!");
    }
    console.log("Updating postition now...")
  };

  // UseEffect to update location every 10 seconds
  useEffect(() => {
    const interval = setInterval(updateLocation, 10000); // 10000 ms = 10 seconds
    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <button onClick={updateLocation}>Get Location</button>
      <h1>Coordinates</h1>
      <p>Latitude: {latitude}</p>
      <p>Longitude: {longitude}</p>

      {/* These are not used but defined above */}
      {0 && Lat && <p>Latitude: {Lat}</p>}
      {0 && Lon && <p>Longitude: {Lon}</p>}
      {0 && Hea && <p>Heading: {Hea}</p>}
      {0 && Spd && <p>Speed: {Spd}</p>}

      {/* Render the map */}
      <h1>Map</h1>
      <Map
        height={defaultHeight}
        center={center}
        defaultZoom={zoom}
        
        // Recenter the map and apply the zoom values
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
      >
        {/* Added 3 markers to represent 3 players on the map */}
        <Marker width={50} anchor={[Lat || latitude, Lon || longitude]} />
        <Marker width={50} anchor={[Lat ? Lat + 0.2 : latitude + 0.2, Lon ? Lon + 0.2 : longitude + 0.2]} />
        <Marker width={50} anchor={[Lat ? Lat - 0.2 : latitude - 0.2, Lon ? Lon - 0.2 : longitude - 0.2]} />

        {/* Add default +/- buttons to allow zoom controls on the map */}
        <ZoomControl />
      </Map>
    </div>
  );
}

export default withStyles(styles)(GeoLocation);
