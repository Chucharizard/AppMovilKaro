/**
 * Sistema de Tema Centralizado
 * Paleta de colores moderna orientada al público universitario (18-30 años)
 */

const colors = {
  // Colores primarios
  primary: '#4A90E2',        // Azul universitario principal
  primaryDark: '#2E5C8A',    // Azul oscuro para headers
  primaryLight: '#7FB3E8',   // Azul claro para highlights

  // Colores secundarios
  secondary: '#50C878',      // Verde esmeralda para acciones positivas
  accent: '#FF6B6B',         // Coral para notificaciones/alertas
  warning: '#FFB84D',        // Naranja para advertencias

  // Colores de fondo
  background: '#F5F7FA',     // Gris muy claro
  surface: '#FFFFFF',        // Blanco para cards
  surfaceDark: '#E8ECEF',    // Gris claro para separadores

  // Colores de texto
  textPrimary: '#2C3E50',    // Texto principal oscuro
  textSecondary: '#7F8C8D',  // Texto secundario gris
  textLight: '#BDC3C7',      // Texto disabled

  // Estados
  success: '#27AE60',        // Verde éxito
  error: '#E74C3C',          // Rojo error
  info: '#3498DB',           // Azul información

  // Reacciones
  like: '#3B5998',           // Azul Facebook
  love: '#E0245E',           // Rojo corazón
  laugh: '#FDCB5C',          // Amarillo risa
  wow: '#F7B731',            // Naranja sorpresa
  sad: '#95A5A6',            // Gris tristeza
  angry: '#C0392B',          // Rojo enojo
};

const gradients = {
  header: ['#2E5C8A', '#4A90E2'],           // Header de app
  card: ['#FFFFFF', '#F5F7FA'],             // Cards con profundidad
  button: ['#4A90E2', '#5BA3E8'],           // Botones principales
  notification: ['#FF6B6B', '#FF8E8E'],     // Badge de notificaciones
  carpooling: ['#50C878', '#6FD896'],       // Sección carpooling
  academic: ['#9B59B6', '#B07CC6'],         // Sección académica
};

const fonts = {
  // Usando fuentes del sistema
  primary: 'System',

  // Tamaños
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  full: 999,
};

const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
};

const animations = {
  // Duraciones
  fast: 150,
  normal: 300,
  slow: 500,

  // Valores de escala
  pressScale: 0.95,
};

const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
};

// Componentes predefinidos
const components = {
  button: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceDark,
  },
  tabBar: {
    height: 60,
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    ...shadows.md,
  },
  avatar: {
    sm: 32,
    md: 40,
    lg: 100,
  },
};

export const theme = {
  colors,
  gradients,
  fonts,
  fontWeights,
  spacing,
  borderRadius,
  shadows,
  animations,
  iconSizes,
  components,
};

export default theme;
