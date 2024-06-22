import React, { useState } from "react";
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
  
  // Define a 'on-click' event handler
  const handleClick = () => {
    if (!navigator.geolocation) {
      console.log("GeoLocation not supported by your browser!");
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setHea(position.coords.heading);
          setSpd(position.coords.speed);
        },
        (e) => {
          console.log(e);
        }
      );
    }
  };

  // Define the default zoom level
  const [zoom, setZoom] = useState(18)

  // Define the default height 
  const defaultHeight = 500;

  // For some reason, if the defaultCenter is set to the current
  // latitude and longitude values, the map does not work.
  // To make the map work, defaultCenter requires a default
  // latitude and longitude values

  // Defining the default latitude and longitude values
  const defaultLaitude = 42.33528042187331;
  const defaultLongitude = -71.09702787206938;

  // Set the default center for the map
  const [center, setCenter] = useState([defaultLaitude, defaultLongitude])

  return (
    <div style={{ backgroundColor: "white", padding: 72 }}>
      <button onClick={handleClick}>Get Location</button>
      <h1>Coordinates</h1>
      <p>Latitude: {latitude}</p>
      <p>Longitude: {longitude}</p>

      {/* These are not used but defined above */}
      {Lat && <p>Latitude: {Lat}</p>}
      {Lon && <p>Longitude: {Lon}</p>}
      {Hea && <p>Heading: {Hea}</p>}
      {Spd && <p>Speed: {Spd}</p>}

      <h1>Map</h1>
      <Map
        height={defaultHeight}
        defaultCenter={center}
        defaultZoom={zoom}
        onBoundsChanged={({center, zoom}) => {
          setCenter(center)
          setZoom(zoom)

        }}
      >
        {/* Added 3 markers to represent 3 players on the map */}
        <Marker width={50} anchor={[latitude, longitude]} />
        <Marker width={50} anchor={[latitude+0.2, longitude+0.2]} />
        <Marker width={50} anchor={[latitude-0.2, longitude-0.2]} />

        {/* Add default buttons to allow zoom controls on the map */}
        <ZoomControl />
      </Map>
    </div>
  );
}

export default withStyles(styles)(GeoLocation);


  // return (
  // <div style={{ backgroundColor: 'white', padding: 72 }}>
  // <div>Loading: {loading.toString()}</div>
  // <div>Error: {error?.message}</div>
  // <div>
  // {latitude} x {longitude}
  // </div>
  // </div>
  // )