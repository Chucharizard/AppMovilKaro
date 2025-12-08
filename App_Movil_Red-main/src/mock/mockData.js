// Mock data para desarrollo cuando el backend no está disponible
export const mockSchedule = [
  {
    day: 'Lunes',
    items: [
      { time: '08:00-10:00', subject: 'Cálculo Diferencial', room: 'A-201', teacher: 'Prof. García' },
      { time: '10:00-12:00', subject: 'Programación I', room: 'Lab-103', teacher: 'Prof. Martínez' },
      { time: '14:00-16:00', subject: 'Física I', room: 'B-305', teacher: 'Prof. López' },
    ],
  },
  {
    day: 'Martes',
    items: [
      { time: '08:00-10:00', subject: 'Álgebra Lineal', room: 'A-202', teacher: 'Prof. Rodríguez' },
      { time: '10:00-12:00', subject: 'Química General', room: 'Lab-201', teacher: 'Prof. Hernández' },
    ],
  },
  {
    day: 'Miércoles',
    items: [
      { time: '08:00-10:00', subject: 'Cálculo Diferencial', room: 'A-201', teacher: 'Prof. García' },
      { time: '10:00-12:00', subject: 'Programación I', room: 'Lab-103', teacher: 'Prof. Martínez' },
      { time: '14:00-16:00', subject: 'Inglés II', room: 'C-101', teacher: 'Prof. Smith' },
    ],
  },
  {
    day: 'Jueves',
    items: [
      { time: '08:00-10:00', subject: 'Álgebra Lineal', room: 'A-202', teacher: 'Prof. Rodríguez' },
      { time: '10:00-12:00', subject: 'Laboratorio de Química', room: 'Lab-201', teacher: 'Prof. Hernández' },
    ],
  },
  {
    day: 'Viernes',
    items: [
      { time: '08:00-10:00', subject: 'Física I', room: 'B-305', teacher: 'Prof. López' },
      { time: '10:00-12:00', subject: 'Tutoría Programación', room: 'Lab-103', teacher: 'Prof. Martínez' },
    ],
  },
];

export const mockGrades = [
  { subject: 'Cálculo Diferencial', grade: '4.5' },
  { subject: 'Programación I', grade: '4.8' },
  { subject: 'Álgebra Lineal', grade: '4.2' },
  { subject: 'Física I', grade: '4.0' },
  { subject: 'Química General', grade: '4.6' },
  { subject: 'Inglés II', grade: '4.3' },
];

export const mockChats = [
  {
    id: '1',
    title: 'Grupo Cálculo',
    name: 'Grupo Cálculo',
    lastMessage: '¿Alguien entendió el último ejercicio?',
    unreadCount: 3,
  },
  {
    id: '2',
    title: 'María González',
    name: 'María González',
    lastMessage: 'Nos vemos mañana en la biblioteca',
    unreadCount: 1,
  },
  {
    id: '3',
    title: 'Carlos Ramírez',
    name: 'Carlos Ramírez',
    lastMessage: 'Gracias por los apuntes!',
    unreadCount: 0,
  },
  {
    id: '4',
    title: 'Proyecto Final',
    name: 'Proyecto Final',
    lastMessage: 'Reunión el viernes a las 3pm',
    unreadCount: 5,
  },
];

export const mockMessages = {
  '1': [
    { id: 1, sender: 'María', text: '¿Alguien entendió el último ejercicio?', timestamp: new Date().toISOString() },
    { id: 2, sender: 'current_user', text: 'Sí, el de derivadas parciales?', timestamp: new Date().toISOString() },
    { id: 3, sender: 'Carlos', text: 'Me perdí en la parte de la regla de la cadena', timestamp: new Date().toISOString() },
  ],
  '2': [
    { id: 1, sender: 'María González', text: 'Hola! ¿Cómo estás?', timestamp: new Date().toISOString() },
    { id: 2, sender: 'current_user', text: 'Bien! Estudiando para el parcial', timestamp: new Date().toISOString() },
    { id: 3, sender: 'María González', text: 'Nos vemos mañana en la biblioteca', timestamp: new Date().toISOString() },
  ],
  '3': [
    { id: 1, sender: 'current_user', text: 'Te envié los apuntes de la clase pasada', timestamp: new Date().toISOString() },
    { id: 2, sender: 'Carlos Ramírez', text: 'Gracias por los apuntes!', timestamp: new Date().toISOString() },
  ],
  '4': [
    { id: 1, sender: 'Ana', text: 'Reunión el viernes a las 3pm', timestamp: new Date().toISOString() },
    { id: 2, sender: 'current_user', text: 'Perfecto, ahí estaré', timestamp: new Date().toISOString() },
  ],
};
