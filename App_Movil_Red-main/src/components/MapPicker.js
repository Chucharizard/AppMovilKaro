// MapPicker now uses Leaflet via WebView for guaranteed tile rendering
// This avoids issues with Google Maps API keys, Play Services, and native map providers
import MapPickerLeaflet from './MapPickerLeaflet';

export default function MapPicker(props) {
  // Simply delegate to MapPickerLeaflet which uses Leaflet + OpenStreetMap
  return <MapPickerLeaflet {...props} />;
}
