import React, { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// NOTE: This component uses `react-native-webview`. Install with:
// npm install react-native-webview
// or
// yarn add react-native-webview
// Then rebuild the app (npx expo run:android) so native modules are linked.

let WebView;
try {
  // dynamic require so app won't crash if package is not installed
  WebView = require('react-native-webview').WebView;
} catch (e) {
  WebView = null;
}

export default function MapWebFallback({ visible, onClose, onSelect, initialCenter }) {
  const [last, setLast] = useState(null);
  const webRef = useRef(null);

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;padding:0}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      (function(){
        const center = [${(initialCenter && initialCenter.latitude) || 0}, ${(initialCenter && initialCenter.longitude) || 0}];
        const map = L.map('map').setView(center, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        let marker = null;
        function send(lat,lng){
          if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
            window.ReactNativeWebView.postMessage(JSON.stringify({latitude: lat, longitude: lng}));
          }
        }
        map.on('click', function(e){
          const lat = e.latlng.lat; const lng = e.latlng.lng;
          if(marker) marker.setLatLng(e.latlng);
          else marker = L.marker(e.latlng).addTo(map);
          send(lat,lng);
        });
      })();
    </script>
  </body>
  </html>
  `;

  if (!WebView) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={{ marginBottom: 10 }}>El paquete `react-native-webview` no está instalado.</Text>
          <Text style={{ marginBottom: 10 }}>Instálalo con:</Text>
          <Text style={styles.code}>npm install react-native-webview</Text>
          <Text style={{ marginTop: 8 }}>Luego recompila la app (npx expo run:android).</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}><Text style={{ color: '#fff' }}>Cerrar</Text></TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={(ev) => {
            try {
              const data = JSON.parse(ev.nativeEvent.data);
              setLast(data);
            } catch (e) { console.warn('webview parse', e); }
          }}
          style={{ flex: 1 }}
        />
        <View style={styles.bottom}>
          <Text>Seleccionado: {last ? `${Number(last.latitude).toFixed(6)}, ${Number(last.longitude).toFixed(6)}` : '—'}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.btn, { marginRight: 8 }]} onPress={onClose}><Text style={{ color: '#fff' }}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => {
              if (!last) return Alert.alert('Selecciona un punto tocando en el mapa');
              onSelect && onSelect({ latitude: last.latitude, longitude: last.longitude });
              onClose();
            }}><Text style={{ color: '#fff' }}>Usar punto</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  btn: { backgroundColor: '#0a84ff', padding: 10, borderRadius: 6 },
  code: { fontFamily: 'monospace', backgroundColor: '#eee', padding: 8, borderRadius: 4 },
  bottom: { padding: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
