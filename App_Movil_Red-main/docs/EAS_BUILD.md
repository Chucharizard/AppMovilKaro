# EAS build (rápido) — Dev-client Android

Pasos para generar un build dev-client en la nube (evita problemas locales con Gradle/Kotlin):

1) Instalar EAS CLI (si no lo tienes):

```powershell
npm install -g eas-cli
```

2) Loguearte en Expo (se abrirá navegador):

```powershell
eas login
```

3) Ejecutar build de desarrollo (perfil `development` en `eas.json`):

```powershell
cd D:\\AppMovilKaro\\App_Movil_Red-main
eas build --profile development --platform android
```

4) Cuando el build termine, descarga el APK desde la URL que te da EAS y instala en tu dispositivo:

```powershell
adb install -r path\\to\\downloaded.apk
```

Notas y consejos:
- Este flujo evita pelear con las versiones locales de Gradle/AGP/Kotlin.
- Si quieres que incluya `expo-maps` nativo en el build, confirmamelo y lo añado a `package.json` y `app.json` antes del build.
- Si prefieres seguir intentando la solución local, dime y sigo con limpieza de cachés Gradle y forzado de versiones Kotlin.
