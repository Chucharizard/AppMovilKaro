# Red Social - Expo Minimal

Scaffold mínimo para arrancar la app Expo conectada al backend desplegado.

Pasos rápidos:

1. Instala dependencias:
```powershell
npm install
```

2. Inicia Expo:
```powershell
npx expo start
```

Backend utilizado (configurado en `src/config.js`):
```
https://backend-social-f3ob.onrender.com
```

Login esperado: POST ` /auth/login` con payload `{ correo, contrasena }`.
El scaffold actual mostrará la respuesta devuelta por el backend en la pantalla principal si el login es exitoso.

Siguientes pasos recomendados:
- Añadir persistencia del token (SecureStore / AsyncStorage).
- Implementar navegación con `react-navigation`.
- Crear pantallas para `Publicaciones`, `Perfil`, `Mensajes`, etc.
