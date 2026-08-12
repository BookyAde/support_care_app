export type GpsCoords = { latitude: number; longitude: number };

export function getGpsCoords(): Promise<GpsCoords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}
