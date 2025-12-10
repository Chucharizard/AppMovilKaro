// Config file for keys and env vars
// Replace the placeholder with your OpenRouteService API key.
// Backend URL for API requests
export const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-social-f3ob.onrender.com';

// OpenRouteService API key (used for routing). Replace with your key or set env var ORS_API_KEY.
export const ORS_API_KEY = process.env.ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjJhZDVjZThkNGU1YTRhMzg5NTgzODdmNjZjZTM0YjZiIiwiaCI6Im11cm11cjY0In0=';

// Optional SerpApi key for Google Maps Autocomplete (leave empty to use Nominatim)
export const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

// Google Maps API Key (for Places HTTP API and native maps on Android/iOS)
// WARNING: prefer setting this via environment variable and restricting the key in GCP.
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDEgPgjtdhEuqNIzJWyZuwbaXh1jRbKwFc';
// Default map provider used by MapPicker: 'google' or 'osm'
export const DEFAULT_MAP_PROVIDER = process.env.DEFAULT_MAP_PROVIDER || 'google';

export default { ORS_API_KEY, BACKEND_URL, SERPAPI_KEY, GOOGLE_MAPS_API_KEY, DEFAULT_MAP_PROVIDER };
