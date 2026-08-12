"""
Haversine formula: calculates the distance in meters between two lat/lng points
on Earth's surface. We need this for the GPS geofencing requirement (spec section 9):
"Worker can only start a visit when within a specified distance of the client's address."

Note: this checks distance from the client's stored address coordinates, not the
scheduled address text - meaning your Client model will eventually need lat/lng
fields too (geocoded once when the address is entered). Flagging that as a
follow-up once we get to the Client geocoding step.
"""

import math

EARTH_RADIUS_METERS = 6_371_000


def distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_METERS * c


def is_within_geofence(
    worker_lat: float,
    worker_lng: float,
    target_lat: float,
    target_lng: float,
    max_distance_meters: float = 150.0,
) -> bool:
    return distance_meters(worker_lat, worker_lng, target_lat, target_lng) <= max_distance_meters
