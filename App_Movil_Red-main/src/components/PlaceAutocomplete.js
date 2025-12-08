import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ORS_API_KEY, SERPAPI_KEY, GOOGLE_MAPS_API_KEY } from '../config';

// PlaceAutocomplete: tries SerpApi if SERPAPI_KEY provided, otherwise Nominatim
export default function PlaceAutocomplete({ placeholder = 'Buscar lugar...', onSelect }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => { if (q && q.length >= 2) doSearch(q); else setItems([]); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const doSearch = async (term) => {
    setLoading(true);
    try {
      // If user has configured SERPAPI_KEY in environment, try SerpApi
      // But we avoid hard dependency: check global config via process.env if available
      const serpKey = SERPAPI_KEY || null;
      if (serpKey) {
        // Special developer shortcut: if SERPAPI_KEY is set to 'USE_LOCAL_SAMPLE', load a local sample file
        if (serpKey === 'USE_LOCAL_SAMPLE') {
          try {
            // require the static sample JSON
            // eslint-disable-next-line global-require
            const sample = require('../mock/serpapi_sample.json');
            const candidates = [];
            if (sample && Array.isArray(sample.local_results)) {
              for (const r of sample.local_results) {
                const lat = r.gps_coordinates?.latitude ?? r.gps_coordinates?.lat ?? (r.latitude || r.lat);
                const lon = r.gps_coordinates?.longitude ?? r.gps_coordinates?.lon ?? (r.longitude || r.lon);
                const name = r.title || r.address || r.display_name || r.description || r.type || 'Lugar';
                const id = r.place_id || r.data_id || r.data_cid || `${lat},${lon}`;
                candidates.push({ id, name, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null, raw: r });
              }
            }
            setItems(candidates);
            setLoading(false);
            return;
          } catch (ex) {
            console.warn('[PlaceAutocomplete] failed to load local sample', ex);
          }
        }
        // Use SerpApi Google Maps search endpoint which returns `local_results` (see example JSON)
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(term)}&google_domain=google.com&hl=en&key=${encodeURIComponent(serpKey)}`;
        const res = await fetch(url);
        const j = await res.json();

        // Parse `local_results` safely. Fields seen in samples: title, address, gps_coordinates.{latitude,longitude}, place_id, thumbnail
        const candidates = [];
        if (j && Array.isArray(j.local_results)) {
          for (const r of j.local_results) {
            const lat = r.gps_coordinates?.latitude ?? r.gps_coordinates?.lat ?? (r.latitude || r.lat);
            const lon = r.gps_coordinates?.longitude ?? r.gps_coordinates?.lon ?? (r.longitude || r.lon);
            const name = r.title || r.address || r.display_name || r.description || r.type || 'Lugar';
            const id = r.place_id || r.data_id || r.data_cid || `${lat},${lon}`;
            candidates.push({ id, name, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null, raw: r });
          }
        }

        setItems(candidates);
        setLoading(false);
        return;
      }

      // If SERPAPI is not configured but Google Maps API key is available, try Google Places HTTP API
      const googleKey = GOOGLE_MAPS_API_KEY || null;
      if (googleKey) {
        try {
          const acUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(term)}&key=${encodeURIComponent(googleKey)}&language=es&types=establishment|geocode&components=country:us`;
          const r3 = await fetch(acUrl);
          const ac = await r3.json();
          const candidates = [];
          if (ac && Array.isArray(ac.predictions)) {
            // Limit to 6 predictions
            const slice = ac.predictions.slice(0, 6);
            for (const pred of slice) {
              const placeId = pred.place_id;
              const desc = pred.description || pred.structured_formatting?.main_text || pred.structured_formatting?.secondary_text || pred.description;
              // Fetch place details to get geometry
              try {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,name,formatted_address&key=${encodeURIComponent(googleKey)}`;
                const dres = await fetch(detailsUrl);
                const dj = await dres.json();
                const loc = dj?.result?.geometry?.location;
                const name = dj?.result?.name || desc || pred.description || 'Lugar';
                if (loc) {
                  candidates.push({ id: placeId, name, lat: Number(loc.lat), lon: Number(loc.lng), raw: pred });
                } else {
                  candidates.push({ id: placeId, name, lat: null, lon: null, raw: pred });
                }
              } catch (inner) {
                // fallback to description-only candidate
                candidates.push({ id: placeId || pred.place_id, name: desc || pred.description, lat: null, lon: null, raw: pred });
              }
            }
          }
          setItems(candidates);
          setLoading(false);
          return;
        } catch (gerr) {
          console.warn('[PlaceAutocomplete] Google Places lookup failed', gerr);
        }
      }

      // Fallback: Nominatim search
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&addressdetails=1&limit=6`;
      const r2 = await fetch(nomUrl, { headers: { 'User-Agent': 'RedSocial/1.0 (email@example.com)' } });
      const j2 = await r2.json();
      const mapped = (Array.isArray(j2) ? j2 : []).map(p => ({ id: p.place_id || `${p.lat},${p.lon}`, name: p.display_name, lat: Number(p.lat), lon: Number(p.lon) }));
      setItems(mapped);
    } catch (e) {
      console.warn('[PlaceAutocomplete] search failed', e);
      setItems([]);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ marginBottom: 8 }}>
      <TextInput placeholder={placeholder} value={q} onChangeText={setQ} style={styles.input} />
      {loading ? <ActivityIndicator /> : null}
      {items && items.length > 0 ? (
        <FlatList data={items} keyExtractor={i => String(i.id)} renderItem={({item}) => (
          <TouchableOpacity style={styles.row} onPress={() => { setQ(item.name); setItems([]); if (onSelect) onSelect({ name: item.name, latitude: item.lat, longitude: item.lon }); }}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 6 },
  row: { padding: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
});
