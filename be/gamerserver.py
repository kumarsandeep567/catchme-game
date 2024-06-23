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

g = dict()

# Initialize the Flask application
app = Flask(__name__)

# Allow Cross Origin Resource Sharing with default settings
CORS(app)

# ========================================
# +++ Health-check Endpoint +++
# To test if the server is running and 
# accessible
# ========================================

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

# ========================================
# +++ Location Endpoint +++
# To get location co-ordinates (along with
# other data) from players
# ========================================

@app.route("/location", methods = ["POST"])
def get_player_location():
    try:
        
        # Try getting the player details from the query parameters
        player_id = request.json['id']
        player_latitude = request.json['lat']
        player_longitude = request.json['lon']

        # Print them to console (for debugging)
        print("Player ID is ", player_id)
        print("Player Latitude is ", player_latitude)
        print("Player Longitude is ", player_longitude)

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
        print("An exception occurred while receiving player location:")
        print(e)
        server_response = ("Exception occurred in '/location' route", HTTPStatus.INTERNAL_SERVER_ERROR)
        return jsonify(server_response)

# ========================================
# App pre-run configuration
# ========================================

# ---------------------------------------
# +++ DEPRECATED +++
# @app.before_first_request
# This annotation no longer works
# ---------------------------------------

def before_first_request():
    print("Starting python server for the first time")

# Instead use app.app_context()
with app.app_context():
    before_first_request()