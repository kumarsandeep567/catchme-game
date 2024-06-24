import React, { useState, useEffect } from "react";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { withStyles } from "@material-ui/core/styles";
import useGeolocation from "./useGeolocation";
import io from "socket.io-client";

const socket = io(`${process.env.REACT_APP_API_SERVICE_URL}`);

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
  // useEffect() hook in useGeolocation.js
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

  // Report player location (and any other data)
  const reportPlayerLocation = async (userId, latitude, longitude) => {

    // Organize the data to send in a dictionary
    const requestFields = {
      'id': userId,
      'lat': latitude,
      'lon': longitude
    }

    // Attempt to send the data to the Flask server
    try {

      // URL of the Flask application and the route
      const URI = `${process.env.REACT_APP_API_SERVICE_URL}/location`;

      // Define the necessary data, along with the player
      // data (as a JSON) to send to the Flask server. 
      const requestConfiguration = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestFields),
        credentials: 'include'
      }

      // Send the player details and wait for a response 
      // (using async await)
      const response = await fetch(URI, requestConfiguration);

      // Check if response received is HTTP 200 OK
      if (response.ok) {
        console.log("Server responded!");

        // Try decoding the response data
        try{
          const responseData = await response.json();
          console.log(responseData);
        } catch (error) {
          alert("Error occured in responseData!");
          console.error(error);
        }
      }
    } catch (error) {
      alert("Error occurred in reportPlayerLocation!");
      console.error(error);
    }
    
  };

  // Function to update the location and report changes to Flask server
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setHea(position.coords.heading);
          setSpd(position.coords.speed);
          setCenter([position.coords.latitude, position.coords.longitude]);
          reportPlayerLocation(1, position.coords.latitude, position.coords.longitude);
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

  useEffect(() => {
    // Interval to update the player's location every 10 seconds
    const interval = setInterval(updateLocation, 10000);

    // Setup socket listener for location updates if socket exists
    if (socket) {
      socket.on("location_update", ({ userId, lat, lon }) => {
        console.log(`data: userId: ${userId}, lat: ${lat}, lng: ${lon}`);
        // setLongitude(lng); // Uncomment and use if needed
      });
    }

    // Cleanup function to clear interval and remove socket listener on component unmount
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("location_update");
      }
    };
  }, []);

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <button onClick={updateLocation}>Get Location</button>
      <p>Latitude: {latitude}</p>
      <p>Longitude: {longitude}</p>

      {/* These are not used but defined above */}
      {/* 'AND' these values with 'null' for now to hide them */}
      {null && Lat && <p>Latitude: {Lat}</p>}
      {null && Lon && <p>Longitude: {Lon}</p>}
      {null && Hea && <p>Heading: {Hea}</p>}
      {null && Spd && <p>Speed: {Spd}</p>}

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
