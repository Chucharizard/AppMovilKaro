# Generar y usar un Keystore para Android (EAS / builds)

Este archivo explica cómo generar un keystore (local), obtener su SHA-1 y qué valores añadir en la Google Cloud Console para que tu `GOOGLE_MAPS_API_KEY` funcione restringida por `package_name;SHA-1`.

IMPORTANTE: Nunca subas el archivo `.keystore` o las contraseñas a un repositorio público. Guarda el keystore en un lugar seguro y haz copia de seguridad.

---

## 1) Información rápida
- `applicationId` del proyecto: `com.redsocial.app` (viene en `android/app/build.gradle`).
- Para que la key funcione para usuarios finales, añade la entrada `com.redsocial.app;SHA1` en Cloud Console usando el SHA-1 del **keystore** con el que firmarás la app (release / Play signing).

Tener varias entradas es normal: puedes añadir la del `debug.keystore` (para pruebas) y la del `release` (o la de Play App Signing) para producción.

---

## 2) Generar un keystore (ejemplo) — Windows PowerShell
Abre PowerShell y ejecuta (ajusta rutas si es necesario). Esto genera un keystore llamado `my-release-key.jks` en la carpeta que elijas.

```powershell
keytool -genkey -v -keystore "C:\ruta\a\mi_keystore.jks" -alias mi_alias -keyalg RSA -keysize 2048 -validity 10000
```

- Te pedirá contraseña del keystore y datos (nombre, organización...). Anota la contraseña, alias y la ruta.
- Valores de ejemplo (no uses estos en producción): alias: `mi_alias`, storepass: `changeit` (elige una contraseña fuerte).

Si no tienes `keytool` en PATH, usa la ruta al JDK, por ejemplo:

```powershell
& "C:\Program Files\Java\jdk\bin\keytool.exe" -genkey -v -keystore "C:\ruta\a\mi_keystore.jks" -alias mi_alias -keyalg RSA -keysize 2048 -validity 10000
```

---

## 3) Obtener el SHA‑1 del keystore
Para obtener el SHA‑1 que debes pegar en la Google Cloud Console, ejecuta (PowerShell):

```powershell
& "C:\Program Files\Java\jdk\bin\keytool.exe" -list -v -keystore "C:\ruta\a\mi_keystore.jks" -alias mi_alias
```

- Sustituye la ruta y el alias por los tuyos.
- La salida incluirá una línea `SHA1:`. Copia ese valor en la consola de Google Cloud.

Para el `debug.keystore` del proyecto (el que genera gradle automáticamente para `debug`), normalmente está en `android/debug.keystore`. Comando:

```powershell
& "C:\Program Files\Java\jdk\bin\keytool.exe" -list -v -keystore "D:\AppMovilKaro\App_Movil_Red-main\android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

## 4) Entradas que conviene añadir en Google Cloud Console
- `com.redsocial.app;SHA1_debug` (para pruebas locales si instalas builds debug).
- `com.redsocial.app;SHA1_release` (para la versión que subirás a Play o la que firmes localmente).
- Si subes a Play y usas Play App Signing: añade también `com.redsocial.app;SHA1_play_signing` (lo obtienes desde Play Console > Setup > App integrity).

Puedes añadir todas estas entradas en la sección "Restricciones de aplicaciones" → "Apps para Android".

---

## 5) Integración con EAS (Expo Application Services)
- Si usas `eas build`, EAS te pedirá o gestionará un keystore. Puedes subir uno propio o dejar que EAS lo genere.
- Para usar un keystore propio con EAS, sube el keystore cuando se te pregunte o usa:

```bash
eas credentials -p android
# sigue las instrucciones para subir un keystore existente
```

- Para ver el SHA‑1 del keystore que EAS tiene almacenado para tu app, usa `eas credentials` o consulta la Play Console si EAS lo subió a Play.

---

## 6) ¿Firmo yo el APK o lo firma Play? ¿Qué diferencia?
- Si subes a Google Play con App Signing activado (recomendado), Play volverá a firmar el APK con su propia llave de firma de app. En ese caso debes usar el SHA‑1 que Play Console muestra en *App integrity* (App signing key certificate) para la restricción en Google Cloud.
- Tu keystore de release sirve para firmar localmente o generar un AAB. Play verificará y re-firmará cuando corresponda.

---

## 7) Seguridad y buenas prácticas
- No subas el `.jks` al repositorio. Añade la ruta a `.gitignore` si creas uno local.
- Guarda copias seguras (almacenamiento offline o gestor de secretos). Perder el keystore de release puede impedirte publicar actualizaciones.
- Añade alertas y presupuesto en Google Cloud para evitar cargos inesperados.

---

## 8) Qué debo hacer ahora (resumen rápido)
1. Si quieres que te guíe, ejecuta el comando para el `debug.keystore` que te pasé y pega aquí la línea `SHA1:` que obtengas.
2. Si vas a generar un keystore de release, crea uno con el comando `keytool -genkey` y pega su SHA‑1 aquí también.
3. Yo te diré exactamente la cadena `com.redsocial.app;SHA1` lista para pegar en Google Cloud.

Si quieres, puedo añadir un pequeño `keystore.example.properties` con la plantilla y la entrada `.gitignore` sugerida (sin subir el archivo real).
