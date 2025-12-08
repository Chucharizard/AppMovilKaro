
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../lib/api';
import { saveAuth } from '../lib/auth';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) return setError('Ingresa correo y contraseña');
    setLoading(true);
    try {
      console.log('[Login] iniciando request', { email });
      // No convertir a minúsculas: el backend puede tratar el username con case-sensitivity
      const res = await api.login(email.trim(), password);
      console.log('[Login] response:', res);
      // Guardar tokens y user en storage
      try {
        await saveAuth(res);
      } catch (e) {
        console.warn('[Login] fallo guardando auth', e);
      }
      if (onLogin) onLogin(res.user);
    } catch (err) {
      console.error('[Login] error:', err);
      // Manejar errores de validación 422 con formato OpenAPI (detail: array)
      if (err && err.status === 422 && err.body && Array.isArray(err.body.detail)) {
        const msgs = err.body.detail.map(d => {
          try {
            const loc = Array.isArray(d.loc) ? d.loc.join('.') : String(d.loc);
            return `${loc}: ${d.msg}`;
          } catch (e) {
            return d.msg || JSON.stringify(d);
          }
        });
        setError(msgs.join('\n'));
      } else {
        const msg = err && err.body && err.body.message ? err.body.message : (err.body || String(err));
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <TextInput
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 12 }}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Ingresar" onPress={handleLogin} disabled={loading} />
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 6 },
  error: { color: 'red', textAlign: 'center', marginTop: 8 },
});

