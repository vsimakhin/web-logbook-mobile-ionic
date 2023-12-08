import { getSunrise, getSunset } from 'sunrise-sunset-js';

export interface Place {
    lat: number;
    lon: number;
    time: Date;
}

export interface Route {
    departure: Place;
    arrival: Place;
}

function deg2rad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function hsin(theta: number): number {
    return Math.pow(Math.sin(theta / 2), 2);
}

function midpoint(start: Place, end: Place): Place {
    const lat1 = deg2rad(start.lat);
    const lon1 = deg2rad(start.lon);
    const lat2 = deg2rad(end.lat);
    const lon2 = deg2rad(end.lon);

    const dlon = lon2 - lon1;
    const Bx = Math.cos(lat2) * Math.cos(dlon);
    const By = Math.cos(lat2) * Math.sin(dlon);
    const lat = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
    const lon = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

    const newLat = (lat * 180) / Math.PI;
    const newLon = (lon * 180) / Math.PI;

    return { lat: newLat, lon: newLon, time: start.time } as Place;
}

function distance(start: Place, end: Place): number {
    const lat1 = deg2rad(start.lat);
    const lon1 = deg2rad(start.lon);
    const lat2 = deg2rad(end.lat);
    const lon2 = deg2rad(end.lon);

    const r = 6378100.0;
    const h = hsin(lat2 - lat1) + Math.cos(lat1) * Math.cos(lat2) * hsin(lon2 - lon1);

    return (2 * r * Math.asin(Math.sqrt(h))) / 1000 / 1.852; // nautical miles
}

export function routeDistance(route: Route): number {
    return distance(route.departure, route.arrival);
}

export function flightTime(route: Route): number {
    return (route.arrival.time.getTime() - route.departure.time.getTime());
}

export function flightSpeed(route: Route): number {
    return routeDistance(route) / (flightTime(route) / (60 * 60 * 1000));
}

export function sunrise(place: Place): Date {
    const sunrise = getSunrise(place.lat, place.lon, place.time);
    sunrise.setMinutes(sunrise.getMinutes() - 30);
    return sunrise;
}

export function sunset(place: Place): Date {
    const sunset = getSunset(place.lat, place.lon, place.time);
    sunset.setMinutes(sunset.getMinutes() + 30);
    return sunset;
}

export function nightTime(route: Route): number {
    const speed = flightSpeed(route);
    const speedPerMinute = speed / 60;

    // assumed we split the route for the segments, not longer than 1 minute of flight
    const milesPerMinute = speed / 60 * 1; // miles per 1 minute

    return nightSegment(route.departure, route.arrival, milesPerMinute, speedPerMinute);
}

function nightSegment(start: Place, end: Place, maxDistance: number, speedPerMinute: number): number {
    let duration = 0;

    const routeDistance = distance(start, end);
    if (routeDistance > maxDistance) {
        // too long, let's split it again
        const mid = midpoint(start, end);
        // calculate time at the mid point
        const flightTime = routeDistance / 2 / speedPerMinute;
        mid.time = new Date(start.time.getTime() + flightTime * 60 * 1000);

        duration = nightSegment(start, mid, maxDistance, speedPerMinute) + nightSegment(mid, end, maxDistance, speedPerMinute);
    } else {
        // get sunrise and sunset for the end point
        // it could be calculated for the middle point again to be more precise,
        // but it will add few more calculations and the error is not so high
        const ss = sunset(end);
        const sr = sunrise(end);

        if (end.time.getTime() > sr.getTime() && end.time.getTime() < ss.getTime()) {
            duration = 0;
        } else {
            duration = routeDistance / speedPerMinute * 60 * 1000;
        }
    }

    return duration;
}

export function formatDuration(milliseconds: number): string {
    const duration = new Date(milliseconds);
    const hours = duration.getUTCHours().toString().padStart(1, '0');
    const minutes = duration.getUTCMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}