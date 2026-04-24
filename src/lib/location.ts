export const isGpsTrackingDisabled = () => false;

// 19°01'18.81"N 72°51'21.35"E
const TARGET_LATITUDE = 19.0218916667;
const TARGET_LONGITUDE = 72.8559305556;
const ALLOWED_RADIUS_METERS = 150; 

function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth's radius in meters
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function verifyLocationCoordinates(latitude?: number, longitude?: number): { isValid: boolean; message?: string } {
    if (isGpsTrackingDisabled()) {
        return { isValid: true };
    }

    if (latitude === undefined || longitude === undefined) {
        return { isValid: false, message: 'Location data is required to mark attendance.' };
    }

    const distance = getDistanceInMeters(latitude, longitude, TARGET_LATITUDE, TARGET_LONGITUDE);

    if (distance <= ALLOWED_RADIUS_METERS) {
        return { isValid: true };
    } else {
        return { 
            isValid: false, 
            message: `You are not in the allowed zone for attendance. Distance: ${Math.round(distance)}m` 
        };
    }
}
