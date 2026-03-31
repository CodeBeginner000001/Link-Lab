type BrowserPermissionState = "granted" | "denied" | "prompt";

type GeolocationPermissionStatus =
  | BrowserPermissionState
  | "unsupported"
  | "unavailable";

type LocationCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
};

export type ClientRequestMetadata = {
  deviceInfo: {
    userAgent: string | null;
    platform: string | null;
    language: string | null;
    languages: string[];
    timezone: string | null;
    hardwareConcurrency: number | null;
    deviceMemory: number | null;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    } | null;
    viewport: {
      width: number;
      height: number;
    } | null;
  };
  locationInfo: {
    permission: GeolocationPermissionStatus;
    timezone: string | null;
    coordinates: LocationCoordinates | null;
    error: string | null;
  };
};

const GEOLOCATION_TIMEOUT_MS = 3000;

type NavigatorWithClientMetadata = Navigator & {
  deviceMemory?: number;
  geolocation?: Geolocation;
  languages?: readonly string[];
  permissions?: {
    query: (descriptor: { name: string }) => Promise<{
      state: BrowserPermissionState;
    }>;
  };
  userAgentData?: {
    platform?: string;
  };
};

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
};

const getPlatform = (navigatorObject: NavigatorWithClientMetadata) => {
  return (
    navigatorObject.userAgentData?.platform ??
    navigatorObject.platform ??
    null
  );
};

const getDeviceMemory = (navigatorObject: NavigatorWithClientMetadata) => {
  return typeof navigatorObject.deviceMemory === "number"
    ? navigatorObject.deviceMemory
    : null;
};

const getGeolocationPermission =
  async (): Promise<GeolocationPermissionStatus> => {
    if (typeof navigator === "undefined") {
      return "unsupported";
    }

    const currentNavigator = navigator as NavigatorWithClientMetadata;

    if (!currentNavigator.geolocation) {
      return "unsupported";
    }

    if (!currentNavigator.permissions) {
      return "unavailable";
    }

    try {
      const status = await currentNavigator.permissions.query({
        name: "geolocation",
      });
      return status.state;
    } catch {
      return "unavailable";
    }
  };

const getCoordinates = async (): Promise<{
  coordinates: LocationCoordinates | null;
  error: string | null;
}> => {
  if (typeof navigator === "undefined") {
    return {
      coordinates: null,
      error: "Geolocation is not supported in this browser",
    };
  }

  const currentNavigator = navigator as NavigatorWithClientMetadata;

  if (!currentNavigator.geolocation) {
    return {
      coordinates: null,
      error: "Geolocation is not supported in this browser",
    };
  }

  return new Promise((resolve) => {
    currentNavigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? null,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
            timestamp: new Date(position.timestamp).toISOString(),
          },
          error: null,
        });
      },
      (error) => {
        resolve({
          coordinates: null,
          error: error.message || "Unable to resolve browser geolocation",
        });
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 5 * 60 * 1000,
      },
    );
  });
};

export const collectClientRequestMetadata =
  async (): Promise<ClientRequestMetadata> => {
    const timezone = getBrowserTimezone();
    const permission = await getGeolocationPermission();
    const currentNavigator =
      typeof navigator === "undefined"
        ? null
        : (navigator as NavigatorWithClientMetadata);
    const deviceInfo =
      typeof window === "undefined" || !currentNavigator
        ? {
            userAgent: null,
            platform: null,
            language: null,
            languages: [],
            timezone,
            hardwareConcurrency: null,
            deviceMemory: null,
            screen: null,
            viewport: null,
          }
        : {
            userAgent: currentNavigator.userAgent ?? null,
            platform: getPlatform(currentNavigator),
            language: currentNavigator.language ?? null,
            languages: [...(currentNavigator.languages ?? [])],
            timezone,
            hardwareConcurrency: currentNavigator.hardwareConcurrency ?? null,
            deviceMemory: getDeviceMemory(currentNavigator),
            screen: window.screen
              ? {
                  width: window.screen.width,
                  height: window.screen.height,
                  colorDepth: window.screen.colorDepth,
                  pixelRatio: window.devicePixelRatio,
                }
              : null,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          };

    if (permission !== "granted") {
      return {
        deviceInfo,
        locationInfo: {
          permission,
          timezone,
          coordinates: null,
          error: null,
        },
      };
    }

    const { coordinates, error } = await getCoordinates();

    return {
      deviceInfo,
      locationInfo: {
        permission,
        timezone,
        coordinates,
        error,
      },
    };
  };
