import { useHistory } from 'react-router-dom'
import React, { useState } from 'react'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import { Link } from 'react-router-dom'

// save keys to local storage
const localStorageAuthKey = 'twtr:auth';
function saveAuthorisation(keys) {
  if (typeof Storage !== 'undefined') {
      try {
          localStorage.setItem(localStorageAuthKey, JSON.stringify(keys));

      } catch (ex) {
          console.log(ex);
      }
  } else {
      // No web storage Support :-(
  }
}
// function getAuthorisation() {
//   if (typeof Storage !== 'undefined') {
//       try {
//         var keys = JSON.parse(localStorage.getItem(localStorageAuthKey));
//         return keys;

//       } catch (ex) {
//           console.log(ex);
//       }
//   } else {
//       // No web storage Support :-(
//   }
// }


const useStyles = makeStyles((theme) => ({
  paper: {
    width: 'auto',
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    [theme.breakpoints.up(620 + theme.spacing(6))]: {
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    marginTop: theme.spacing(18),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
  },
  avatar: {
    margin: theme.spacing(1),
    width: 192,
    height: 192,
    color: theme.palette.secondary.main,
  },
  form: {
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  container: {
    display: 'flex',
    padding: '10px', 
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: `100%`,
  },
  buttonPadding: {  
    marginBottom: '30px', 
  },
}))

//  ==========================================================
//  +++ Set cookies after successful SignIn +++
//  ==========================================================

const setCookie = (userId, role, accessToken, time) => {
  document.cookie = `userId=${userId}; expires=${time}; path=/`;
  document.cookie = `role=${role}; expires=${time}; path=/`;
  document.cookie = `accessToken=${accessToken}; expires=${time}; path=/`;
 };


const SignIn = () => {
  const classes = useStyles()
  const history = useHistory()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')

  // we submit username and password, we receive
  // access and refresh tokens in return. These
  // tokens encode the userid
  function handleSubmit(event) {
    event.preventDefault()

    console.log(username);
    console.log(password);
    console.log(role);

    const paramdict = {
      'name': username,
      'password': password,
      'role': role
    }
    const config = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(paramdict)
    }
    console.log("sending out:");
    console.log(paramdict);

    console.log("Signin.js: fetching from ".concat(`${process.env.REACT_APP_API_SERVICE_URL}/login`))
    fetch(`${process.env.REACT_APP_API_SERVICE_URL}/login`, config)
      .then(response => response.json())
      .then(data => {
        setCookie(data[0].userId, data[0].role, data[0].access_token, data[0].expiration_time);
        console.log('---');
        saveAuthorisation({
          access: data[0].access_token,
          refresh: data[0].refresh_token,
        });

        // Redirect to Geolocation page
        history.push("/geolocation");

        // Force page reload to force App bar refresh its contents
        setTimeout(() => {
          window.location.reload();
        }, 100);
      })
      .catch( (err) => {
        alert(err);
        console.log(err);
      });
  }

  return (
    <React.Fragment>
      <Paper className={classes.paper} elevation={6}>
        <div className={classes.container}>

          <Typography component="h1" variant="h5">
            {'Sign In'}
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit} noValidate>
            <TextField
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label={'Username'}
              name="username"
              autoComplete="username"
              autoFocus
            />
            <TextField
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label={'Password'}
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <TextField
              select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="role"
              label={'Role'}
              id="role"
              autoComplete="current-role"
            >
              <MenuItem value="cop">Cop</MenuItem>
              <MenuItem value="mafia">Mafia</MenuItem>
            </TextField>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              {'Sign in'}
            </Button>
          </form>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Link to="/password_reset">Forgot Password?</Link>
            <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </Paper>
    </React.Fragment>
  )
}

export default SignIn
