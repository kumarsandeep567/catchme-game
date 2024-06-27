import os
import jwt
from http import HTTPStatus
from flask_bcrypt import Bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, emit
from datetime import datetime, timedelta, timezone
import time
import threading
from geopy.distance import geodesic

# Initialize the Flask application
app = Flask(__name__)

# Allow Cross Origin Resource Sharing with default settings
CORS(app)

# Initialize SocketIO for broadcasting service
socketio = SocketIO(app, cors_allowed_origins="*")

# To use Bcrypt APIs, wrap the Flask app in Bcrypt()
bcrypt = Bcrypt(app)

# This variable will store the application settings and
# made available globally (used by app_settings() method)
g = dict()

# List to track the broadcast receipents
broadcast_recipients = dict()

# Define player roles
# There will be only 1 cop
# Everybody else is considered as mafia
roles = {"cop": None, "mafia": []}

mafia_players = []

# Did cop win?
game_outcome = False

# Set game timer and duration for 10 minutes
game_start_time = time.time()
game_duration = 5 * 60

# Lock for thread safety
lock = threading.Lock()

# ==========================================================
# +++ Application settings +++
# These values are used throughout the 
# application 
# Be mindful of what you change here ...
# ==========================================================

def app_settings():
    global g

    # This key will be used when encoding and decoding the 
    # access tokens
    if 'secret_key' not in g:
        g['secret_key'] = os.environ.get("SECRET_KEY", "5VfA[<v9]F<I{Tc^XibO")

    # This will be used with Bcrypt APIs
    # Higher values for bcrypt_log_rounds mean more secure hashes
    # but slower performance
    if 'bcrypt_log_rounds' not in g:
        g['bcrypt_log_rounds'] = os.environ.get("BCRYPT_LOG_ROUNDS", 12)

    # Define how long an access token remains valid
    # By default, set to 900 seconds (which is 15 minutes)
    if 'access_token_expiration' not in g:
        g['access_token_expiration'] = os.environ.get("ACCESS_TOKEN_EXPIRATION", 0)
    
    # Similar to access_token_expiration, but for refresh tokens
    # Refresh tokens typically have a longer lifespan than access tokens
    # By default, set to 2,592,000 seconds (which is 30 days)
    if 'refresh_token_expiration' not in g:
        g['refresh_token_expiration'] = os.environ.get("REFRESH_TOKEN_EXPIRATION", 2592000)

    # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
    
    # Create some users for the application
    if 'users' not in g:
        users = os.environ.get("USERS", 'Elon Musk,Bill Gates,Jeff Bezos')
        g['users'] = list(users.split(','))
        print("g['users'] = ", g['users'])
    
    # Create their passwords and hash them using Bcrypt API
    if 'passwords' not in g:
        passwords = os.environ.get("PASSWORDS", 'Tesla,Clippy,BlueHorizon')
        g['passwords'] = list(passwords.split(','))
        print("g['passwords'] = ", g['passwords'])

        g['password_hashes'] = []
        for p in g['passwords']:
            g['password_hashes'].append(
                bcrypt.generate_password_hash(p, g['bcrypt_log_rounds']).decode('utf-8')
            )
        print("g['password_hashes]=", g['password_hashes'])

        # Assign these users their user_id
        g['user_ids'] = list(range(0, len(g['users'])))

        # Assign these users their roles
        g['user_roles'] = ['cop', 'mafia', 'mafia']

    if 'logged_user' not in g:
        g['logged_userId'] = None

    # How closeby the cop must be to the mafia to arrest them
    # In meters
    g['elimination_distance'] = 1
        
    # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

# To make reading 'g' more clean, hide the functionality
# behind a method
def read_app_settings(setting_name):
    global g
    return g[setting_name]

# ==========================================================
# +++ Health-check Endpoint +++
# To test if the server is running and 
# accessible
# ==========================================================

@app.route("/health")
@cross_origin()
def health(): 
    return """
        <h3>
            If you are reading this message, then it means the server is up and 
        running!
        </h3>
        <h3>
            Happy cake day!! <3
        </h3>
    """

# ==========================================================
# +++ Methods to access the JSON Web Tokens +++
# Encode and decode the JWT
# ==========================================================
def encode_token(user_id, token_type):

    # Set token expiration time based on token_type
    if token_type == "access":
        expiration_time = read_app_settings("access_token_expiration")
    else:
        expiration_time = read_app_settings("refresh_token_expiration")

    # Define the contents of the token
    expiration_time = datetime.utcnow() + timedelta(seconds = expiration_time)
    issued_at =  datetime.utcnow()

    payload = {
        "expiration_time": expiration_time.timestamp(),
        "issued_at": issued_at.timestamp(),
        "subject": user_id,
    }

    # Encode the payload, create the token, and return it
    # For encoding, use the HMAC-SHA256 hashing algorithm
    return jwt.encode(
        payload, 
        read_app_settings("secret_key"), 
        algorithm = "HS256"
    )

def decode_token(token):
    
    # Decode the token (YES, it is 'algorithms' not 'algorithm')
    encoded_payload = jwt.decode(
        token, 
        read_app_settings("secret_key"), 
        algorithms = ["HS256"]
    )

    # If access_token_expiration is 0, convert the cookie to a session cookie
    expiration_time = 0

    # Convert expiration_time to UTC string to help setting cookies in
    # Javascript without any further convertion
    if read_app_settings('access_token_expiration'):
        expiration_time = datetime\
                            .fromtimestamp(encoded_payload['expiration_time'], timezone.utc)\
                            .strftime('%a, %d %b %Y %H:%M:%S UTC')
    
    # Do the same for issued_at
    issued_at = datetime\
                        .fromtimestamp(encoded_payload['issued_at'], timezone.utc)\
                        .strftime('%a, %d %b %Y %H:%M:%S UTC')

    decoded_payload = {
        "expiration_time": expiration_time,
        "issued_at": issued_at,
        "subject": encoded_payload['subject'],
    }

    return decoded_payload

# ==========================================================
# +++ Player Login Endpoint +++
# Sets the access tokens for the authenticated 
# players 
# ==========================================================
@app.route("/login", methods=["POST"])
@cross_origin()
def login():
    try:
        user = request.json['name']
        password = request.json['password']

        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
        
        # Get all users setup by app_settings()
        available_users = read_app_settings('users')

        if user not in available_users:

            # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
            print('Unknown user trying to login ...')

            server_response = (
                "Error! This user does not have an account", 
                HTTPStatus.UNAUTHORIZED
            )
        else:

            # Get the user's hashed password from app_settings()
            password_hash = read_app_settings('password_hashes')[available_users.index(user)]

            # Hash the user provided password and compare it with
            # password_hash
            if not bcrypt.check_password_hash(password_hash, password):

                # Wrong password
                server_response = (
                    "ERROR: Password mismatch", 
                    HTTPStatus.UNAUTHORIZED
                )
            else:
                # Create the tokens for the user
                user_id = read_app_settings('user_ids')[available_users.index(user)]
                role = read_app_settings('user_roles')[read_app_settings('user_ids').index(user_id)]
                access_token = encode_token(user_id, "access")
                refresh_token = encode_token(user_id, "refresh")
                expiration_time = decode_token(access_token)['expiration_time']
                g['logged_userId'] = user_id
                
                # Prepare the tokens for serialization
                server_response = ({
                    "userId": user_id,
                    "role": role,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expiration_time": expiration_time
                }, HTTPStatus.OK)

        return jsonify(server_response)
    except Exception as e:

        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
        print("Something went wrong in '/login' method")
        print(e)
        return jsonify((
            "Something went wrong in '/login' method", 
            HTTPStatus.INTERNAL_SERVER_ERROR
        ))


# ==========================================================
# +++ Assign roles to players (if not already assigned) +++
# ==========================================================
def assign_role(player_id):
    with lock:
        if roles["cop"] is None:
            roles["cop"] = player_id
            role = "cop"
        else:
            roles["mafia"].append(player_id)
            role = "mafia"
    return role


# ==========================================================
# +++ Method to calculate player distance +++
# Distances are calculated in meters
# ==========================================================
def distance(coord1, coord2):
    return geodesic(coord1, coord2).meters


# ==========================================================
# +++ Overall game timer +++
# When the timer runs out, and there's no mafia left,
# then the cop wins. Else the cop loses.
# ==========================================================
def game_timer():
    while True:
        time_elapsed = time.time() - game_start_time
        if time_elapsed >= game_duration:
            with lock:
                if mafia_players:
                    socketio.emit('game_over', {'result': 'cop_loses'})
            break
        time.sleep(1)

# ==========================================================
# +++ Location Endpoint +++
# To get location co-ordinates (along with
# other data) from players
# ==========================================================

@app.route("/location", methods = ["POST"])
@cross_origin()
def get_player_location():
    global game_outcome

    try:
        
        # Try getting the player details from the query parameters
        player_id = request.json['id']
        player_latitude = request.json['lat']
        player_longitude = request.json['lon']
        player_role = request.json['role']

        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
        
        print("Player ID is ", player_id)
        print("Player Role is ", player_role)
        print("Player Latitude is ", player_latitude)
        print("Player Longitude is ", player_longitude)
        
        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

        # Create a dictionary with player details to send back as a response
        broadcast_recipients[player_id] = {
            'role': player_role,
            'latitude': player_latitude,
            'longitude': player_longitude
        }

        with lock:
            if player_role == "cop":

                # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

                print("Role cop is played by: ", player_id)

                # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

                mafia_players = [
                    player_id for player_id, data in broadcast_recipients.items() if data['role'] == 'mafia'
                ]

                # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

                print("Mafia is played by: ", mafia_players)

                # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

                # Check if cop is within 1 meter of any mafia
                for _player in mafia_players:

                    mafia_location = (
                        broadcast_recipients[_player]['latitude'], 
                        broadcast_recipients[_player]['longitude']
                    )
                    cop_location = (
                        player_latitude, player_longitude
                    )

                    # Elimination logic
                    if distance(cop_location, mafia_location) <= read_app_settings('elimination_distance'):
                        del broadcast_recipients[_player]
                        mafia_players.remove(_player)

                        print("Mafia eliminated", _player)
                        socketio.emit(
                            'mafia_eliminated', 
                            {'mafia_id': _player}
                        )

                socketio.emit(
                    'cop_location_update', 
                    {player_id: broadcast_recipients[player_id]}
                )

                if not mafia_players and not game_outcome:
                    game_outcome = True
                    socketio.emit('game_over', {'result': 'Cop wins!'})

            else:
                if not game_outcome:
                    socketio.emit(
                        'mafia_location_update', 
                        {player_id: broadcast_recipients[player_id]}
                    )

        # Return a HTTP 200 OK status with player details
        server_response = (
            broadcast_recipients[player_id], 
            HTTPStatus.OK
        )

    except Exception as e:

        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
        print("An exception occurred while receiving player location:")
        print(e)
        server_response = (
            "Exception occurred in '/location' route", 
            HTTPStatus.INTERNAL_SERVER_ERROR
        )
        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

    return jsonify(server_response)

# ==========================================================
# +++ Broadcast handler +++
# Handle broadcast connection
# ==========================================================
@socketio.on('connect')
def handle_connect():
    emit('all_users', broadcast_recipients)

# ==========================================================
# +++ App pre-run configuration +++
# ==========================================================

# !! DEPRECATED !!
# @app.before_first_request
# This annotation no longer works

def before_first_request():
    print("Starting python server for the first time")
    app_settings()

# Instead use app.app_context()
with app.app_context():
    before_first_request()


# ==========================================================
# +++ TO RUN THIS FILE, RUN wsgi.py FILE +++
# ==========================================================