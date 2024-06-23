import redis

# Connect to Redis
client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

def store_user_location(user_id, latitude, longitude):
    """
    Store the user's location as a list in Redis.

    Args:
        user_id (str): The user's unique identifier.
        latitude (float): The user's latitude.
        longitude (float): The user's longitude.
    """
    key = f"user:{user_id}:location"
    client.delete(key)
    client.rpush(key, latitude, longitude)

def fetch_user_location(user_id):
    """
    Fetch the user's location from Redis.

    Args:
        user_id (str): The user's unique identifier.

    Returns:
        list: A list containing the latitude and longitude.
    """
    key = f"user:{user_id}:location"
    location = client.lrange(key, 0, -1)
    return location

# Example usage
user_id = "user123"
latitude = 37.7749
longitude = -122.4194

user_id1 = "user124"
latitude1 = 38.7373
longitude1 = -125.3737

# Store user location
store_user_location(user_id1,latitude1,longitude1)

# Fetch user location
location = fetch_user_location(user_id)
print(f"User {user_id}'s location: {location}")

location1 = fetch_user_location(user_id1)
print(f"User {user_id1}'s location: {location1}")