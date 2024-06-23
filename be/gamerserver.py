from flask import Flask, request, jsonify, g
from flask_cors import CORS
from http import HTTPStatus
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import os
import json
import random
import string
from flask_bcrypt import Bcrypt
import jwt

# This variable will store the application settings and
# made available globally (used by app_settings() method)
g = dict()

# Initialize the Flask application
app = Flask(__name__)

# Allow Cross Origin Resource Sharing with default settings
CORS(app)

# To use Bcrypt APIs, wrap the Flask app in Bcrypt()
bcrypt = Bcrypt(app)


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
        g['access_token_expiration'] = os.environ.get("ACCESS_TOKEN_EXPIRATION", 900)
    
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
            g['password_hashes'].append(bcrypt.generate_password_hash(p, 13).decode('utf-8'))
        print("g['password_hashes]=", g['password_hashes'])
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
    payload = {
        "expiration_time": datetime.now(datetime.UTC) + timedelta(seconds = expiration_time),
        "issued_at": datetime.now(datetime.UTC),
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
    payload = jwt.decode(
        token, 
        read_app_settings("secret_key"), 
        algorithms = ["HS256"]
    )
    return payload["subject"]

# ==========================================================
# +++ Player Login Endpoint +++
# Sets the access tokens for the authenticated 
# players 
# ==========================================================
@app.route("/login", methods=["POST"])
def login():
    # TODO


# ==========================================================
# +++ Location Endpoint +++
# To get location co-ordinates (along with
# other data) from players
# ==========================================================

@app.route("/location", methods = ["POST"])
def get_player_location():
    try:
        
        # Try getting the player details from the query parameters
        player_id = request.json['id']
        player_latitude = request.json['lat']
        player_longitude = request.json['lon']

        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)
        print("Player ID is ", player_id)
        print("Player Latitude is ", player_latitude)
        print("Player Longitude is ", player_longitude)
        # +++ DEBUG BLOCK: For debugging purposes only (REMOVE BEFORE DEPLOYING)

        # Create a dictionary with player details to send back as a response
        player_details = {
            'player_id': player_id,
            'player_latitude': player_latitude,
            'player_longitude': player_longitude
        }

        # Return a HTTP 200 OK status with player details
        server_response = (player_details, HTTPStatus.OK)

        return jsonify(server_response)

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
# +++ App pre-run configuration +++
# ==========================================================

# !! DEPRECATED !!
# @app.before_first_request
# This annotation no longer works

def before_first_request():
    print("Starting python server for the first time")

# Instead use app.app_context()
with app.app_context():
    before_first_request()