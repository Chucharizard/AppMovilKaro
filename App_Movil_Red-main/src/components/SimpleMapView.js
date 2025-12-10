import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

/**
 * Componente de mapa simple que muestra una ubicación usando Google Maps en el navegador
 * Compatible con expo-location para obtener coordenadas
 */
const SimpleMapView = forwardRef(({ 
  region, 
  initialRegion,
  children, 
  style,
  onRegionChangeComplete,
  provider,
  ...props 
}, ref) => {
  const coords = region || initialRegion;
  
  // Exponer métodos al ref para compatibilidad con MapPicker
  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      // Simulación - en un mapa real animaría a la región
      if (onRegionChangeComplete) {
        onRegionChangeComplete(region);
      }
    },
    getCamera: () => ({
      center: coords || { latitude: 0, longitude: 0 },
      zoom: 15,
    }),
  }), [coords, onRegionChangeComplete]);
  
  const openInMaps = () => {
    if (coords) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.icon}>🗺️</Text>
        {coords && (
          <>
            <Text style={styles.coordsText}>
              📍 {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity style={styles.button} onPress={openInMaps}>
              <Text style={styles.buttonText}>Ver en Google Maps</Text>
            </TouchableOpacity>
          </>
        )}
        {!coords && (
          <Text style={styles.noLocationText}>Sin ubicación</Text>
        )}
      </View>
      {children}
    </View>
  );
});

SimpleMapView.displayName = 'SimpleMapView';

// Agregar propiedades estáticas para compatibilidad con react-native-maps
SimpleMapView.PROVIDER_GOOGLE = 'google';
SimpleMapView.PROVIDER_DEFAULT = null;

export default SimpleMapView;

// Componente Marker compatible
export function Marker({ coordinate, title, description, children, ...props }) {
  return null; // Los markers se muestran cuando se abre Google Maps
}

// Componente Polyline compatible
export function Polyline({ coordinates, strokeColor, strokeWidth, ...props }) {
  return null; // Las rutas se muestran cuando se abre Google Maps
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  coordsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
