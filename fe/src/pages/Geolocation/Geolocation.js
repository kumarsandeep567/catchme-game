import React, { useState, useEffect, useCallback } from "react";
import React, { useState, useEffect, useCallback } from "react";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { withStyles } from "@material-ui/core/styles";
import io from "socket.io-client";

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

// Define the colors for the map markers
const markerColors = [
  `rgb(208, 149, 208)`, // pink
  `rgb(149, 208, 149)`, // green
  `rgb(149, 188, 208)`  // blue
];

// Server address and port defined as env variables
const server_address = `${process.env.REACT_APP_API_SERVICE_URL}`;

// Establish websocket connection with Flask application
const socket = io(server_address);

// Define the colors for the map markers
const markerColors = [
  `rgb(208, 149, 208)`, // pink
  `rgb(149, 208, 149)`, // green
  `rgb(149, 188, 208)`  // blue
];

// Server address and port defined as env variables
const server_address = `${process.env.REACT_APP_API_SERVICE_URL}`;

// Establish websocket connection with Flask application
const socket = io(server_address);

function GeoLocation(props) {

  // Set initial values for Latitude, Longitude, Heading, and Speed
  const [Lat, setLat] = useState('Fetching Location');
  const [Lon, setLng] = useState('Fetching Location');
  const [Lat, setLat] = useState('Fetching Location');
  const [Lon, setLng] = useState('Fetching Location');
  const [Hea, setHea] = useState(null);
  const [Spd, setSpd] = useState(null);
  
  // Define the default zoom level
  const [zoom, setZoom] = useState(18);

  // Define the default height 
  const defaultHeight = 600;
  const defaultHeight = 600;

  // Define the default latitude and longitude values
  const defaultLatitude = 42.33528042187331;
  const defaultLatitude = 42.33528042187331;
  const defaultLongitude = -71.09702787206938;

  // Set the default center for the map
  const [center, setCenter] = useState([defaultLatitude, defaultLongitude]);

  // Set default active users 
  const [users, setUsers] = useState({});

  // Default state for marker tooltips
  const [tooltip, setTooltip] = useState({ 
    visible: false, 
    userId: null, 
    latitude: null, 
    longitude: null 
  });

  // Read cookie and return the required value
  const readCookie = (name) => {

    // Each cookie has attributes separated by a ';'
    const cookies = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
   
    return cookies ? cookies.split("=")[1] : null;
   };

  // Report player location (and any other data)
  const reportPlayerLocation = useCallback((userId, latitude, longitude) => {
  const reportPlayerLocation = useCallback((userId, latitude, longitude) => {

    // Organize the data to send in a dictionary
    const requestFields = {
      'id': userId,
      'lat': latitude,
      'lon': longitude
    }

    // Attempt to send the data to the Flask server
    try {

      // URL of the Flask application and the route
      const URI = server_address.concat("/location");
      const URI = server_address.concat("/location");

      // Define the necessary data, along with the player
      // data (as a JSON) to send to the Flask server. 
      const requestConfiguration = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(requestFields)
        body: JSON.stringify(requestFields)
      }

      // Send the player details and wait for a response 
      // (using async await)
      const response = fetch(URI, requestConfiguration);
      const response = fetch(URI, requestConfiguration);

      // Check if response received is HTTP 200 OK
      if (response.ok) {
        console.log("Server responded!");

        // Try decoding the response data
        try{
          const responseData = response.json();
          const responseData = response.json();
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
    
  }, []);
  }, []);

  // Function to update the location and report changes to Flask server
  const updateLocation = useCallback(() => {
  const updateLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setHea(position.coords.heading);
          setSpd(position.coords.speed);
          setCenter([position.coords.latitude, position.coords.longitude]);
          reportPlayerLocation(
            readCookie('userId'), 
            position.coords.latitude, 
            position.coords.longitude
          );
          reportPlayerLocation(
            readCookie('userId'), 
            position.coords.latitude, 
            position.coords.longitude
          );
        },
        (e) => {
          console.log(e);
        }
      );
    } else {
      console.log("GeoLocation not supported by your browser!");
    }
    console.log("Updating postition now...")
  }, [reportPlayerLocation]);
  }, [reportPlayerLocation]);

  // UseEffect hook to update location every 10 seconds
  useEffect(() => {

    // Define the interval to update the players location
    // Since the location fetching is handled by the updateLocation()
    // call the method every 10 seconds (10 seconds = 10000 ms)
    const interval = setInterval(updateLocation, 10000);

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [updateLocation]);

  // UseEffect hook to broacast location
  useEffect(() => {
    socket.on('location_update', (data) => {
      setUsers((prevUsers) => ({ ...prevUsers, ...data }));
    });

    socket.on('all_users', (data) => {
      setUsers(data);
    });

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [updateLocation]);

  // UseEffect hook to broacast location
  useEffect(() => {
    socket.on('location_update', (data) => {
      setUsers((prevUsers) => ({ ...prevUsers, ...data }));
    });

    socket.on('all_users', (data) => {
      setUsers(data);
    });

    return () => {
      socket.off('location_update');
      socket.off('all_users');
      socket.off('location_update');
      socket.off('all_users');
    };
  }, []);

  const handleMouseOver = (userId, latitude, longitude) => {
    setTooltip({ visible: true, userId, latitude, longitude });
  };

  const handleMouseOut = () => {
    setTooltip({ visible: false, userId: null, latitude: null, longitude: null });
  };

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <br></br>

      {/* Enable this button to update location manually */}
      {/* <button onClick={updateLocation}>Get Location</button> */}
      <br></br>

      {/* Enable this button to update location manually */}
      {/* <button onClick={updateLocation}>Get Location</button> */}

      {/* Some of these are not used but defined above */}
      {/* Some of these are not used but defined above */}
      {/* 'AND' these values with 'null' for now to hide them */}
      <h2>
        Player {readCookie('userId').concat("'s coordinates")}</h2>
      <h3>Latitude: {Lat}</h3>
      <h3>Longitude: {Lon}</h3>
      {null && Hea && <h3>Heading: {Hea}</h3>}
      {null && Spd && <h3>Speed: {Spd}</h3>}

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
        {/* Dynamically add markers to represent players on the map */}
        {Object.keys(users).map((userId) => (
          <Marker
            key={userId}
            width={50}
            color={markerColors[userId]}
            anchor={[users[userId].latitude, users[userId].longitude]}
            onMouseOver={() => handleMouseOver(userId, users[userId].latitude, users[userId].longitude)}
            onMouseOut={handleMouseOut}
          />
        ))}

        {/* Add default +/- buttons to allow zoom controls on the map */}
        <ZoomControl />
      </Map>
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            padding: '5px',
            border: '1px solid black',
            borderRadius: '3px',
            top: '10px',
            left: '10px',
          }}
        >
          <p>User ID: {tooltip.userId}</p>
          <p>Latitude: {tooltip.latitude}</p>
          <p>Longitude: {tooltip.longitude}</p>
        </div>
      )}
    </div>
  );
}

export default withStyles(styles)(GeoLocation);