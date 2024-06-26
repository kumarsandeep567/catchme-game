import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Router, Route, Link } from "react-router-dom";
import { createBrowserHistory } from "history";

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { hexToRgb, makeStyles, rgbToHex } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import IconButton from '@material-ui/core/IconButton';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

// import Badge from '@material-ui/core/Badge';
// import NotificationsIcon from '@material-ui/icons/Notifications';
// import config from '../config/config'

// Our custom components
import Home from "../pages/Home";
import SignUp from "../pages/SignUp/SignUp";
import SignIn from "../pages/SignIn/SignIn";
import PasswordReset from "../pages/PasswordReset/PasswordReset";
import PasswordChange from "../pages/PasswordChange/PasswordChange";
import Geolocation from "../pages/Geolocation/Geolocation";

const drawerWidth = 240;
const history = createBrowserHistory();

// css
const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex'
  },
  toolbar: {
    paddingRight: 24, 
    display: 'flex',
  justifyContent: 'space-between'
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: rgbToHex("#ffffff"),
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  appBarButton: {
    marginRight: 36,
    color: hexToRgb("#0000008a")
  },
  appBarButtonHidden: {
    display: 'none',
  },
  appBarTextButtonSpacing: {
    marginRight: '5px'
  },
  title: {
    flexGrow: 1,
    color: hexToRgb("#000000")
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  }
}));

export default function Dashboard() {
  const classes = useStyles();
  const pathname = window.location.pathname;
  const trimmedPath = pathname.substring(1);
  const capitalizedPath = trimmedPath.charAt(0).toUpperCase() + trimmedPath.slice(1);
  const [title, setTitle] = React.useState(capitalizedPath);

  // Default states for checking whether user is signed in or not
  const [isSignedIn, setIsSignedIn] = useState(false);

  const onItemClick = title => () => {
    setTitle(title);
  };

  // Read cookie and return the required value
  const readCookie = (name) => {

    // Each cookie has attributes separated by a ';'
    const cookies = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
   
    return cookies ? cookies.split("=")[1] : null;
   };

  // Update signed in state based on cookie 'userId'
   useEffect(() => {
    const userId = readCookie('userId');
    setIsSignedIn(!!userId);
  }, []);

  // Sign out handler
  const handleSignOut = () => {

    // Delete the userId and accessToken cookies
    const userIdCookie = readCookie('userId');
    const accessTokenCookie = readCookie('accessToken');
    document.cookie = `userId=${userIdCookie}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    document.cookie = `accessToken=${accessTokenCookie}; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    
    // Set state as logged out
    setIsSignedIn(false);

    // Redirect to sign-in page
    history.push('/signin');

    // Since cookies are still visible, force page reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      {/* The Router component routes URLs to your components */}
      <Router history={history} title={title} >
        {/* This is the header AppBar */}
        <AppBar 
          position="absolute" 
          className={
            clsx(classes.appBar)
          }
        >
          <Toolbar 
            title={title} 
            className={classes.toolbar}
          >
             {/* The title is set by the components */}
             <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
              {title}
            </Typography>

            <div>
              {/* The Sign-in icon on the AppBar */}
              {
                isSignedIn ? (
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="signout"
                    component={Link}
                    onClick={handleSignOut}
                    className={clsx(classes.appBarButton)}
                  >
                    <AccountCircleIcon className={classes.appBarTextButtonSpacing}/>
                    {'Sign out'}
                  </IconButton>
                ) : (
                  <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="signin"
                    component={Link}
                    to="/signin"
                    onClick={onItemClick('Sign in')}
                    className={clsx(classes.appBarButton)}
                  >
                    <AccountCircleIcon className={classes.appBarTextButtonSpacing}/>
                    {'Sign In'}
                  </IconButton>
                )}
                {console.log(isSignedIn)}
            </div>
          </Toolbar>
        </AppBar>
        {/* This is your mission control: Matches URLs above to your components */}
        <main className={classes.content}>
          {/* menu paths */}
          <Route exact path="/" component={Home} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/password_reset" component={PasswordReset} />
          <Route path="/password_change" component={PasswordChange} />
          <Route path="/geolocation" component={Geolocation} />
        </main>
      </Router>
      {/* Whatever you put here will appear on all your pages, style appropriately! */}
    </div>
  );
}
