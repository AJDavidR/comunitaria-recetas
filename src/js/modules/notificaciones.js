import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase-config.js';
import { mostrarModal } from './modal.js';

const messaging = getMessaging(app);

// Clave pública de Firebase Cloud Messaging
const VAPID_KEY = 'TU_VAPID_KEY_AQUI';

// Solicitar permiso y token para notificaciones
export async function solicitarPermisoNotificaciones() {
  try {
    const permiso = await Notification.requestPermission();
    
    if (permiso === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      guardarToken(token);
      return token;
    } else {
      mostrarModal('Notificaciones', 'Los permisos de notificación fueron denegados.');
      return null;
    }
  } catch (error) {
    console.error('Error al solicitar permiso:', error);
    mostrarModal('Error', 'No se pudieron configurar las notificaciones.');
    return null;
  }
}

// Guardar token en localStorage
function guardarToken(token) {
  localStorage.setItem('fcm-token', token);
}

// Obtener token guardado
export function obtenerToken() {
  return localStorage.getItem('fcm-token');
}

// Escuchar mensajes cuando la app está en primer plano
export function inicializarNotificaciones() {
  onMessage(messaging, (payload) => {
    const { title, body, icon } = payload.notification;
    
    // Mostrar notificación nativa
    new Notification(title, {
      body,
      icon: icon || '/assets/icons/icon-192x192.png'
    });
    
    // Mostrar modal si la app está activa
    mostrarModal(title, body);
  });
}

// Suscribirse a un tema
export async function suscribirseATema(tema) {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token de notificación disponible');
    }

    const response = await fetch('/api/suscribir-tema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tema })
    });

    if (!response.ok) {
      throw new Error('Error al suscribirse al tema');
    }

    mostrarModal('Suscripción exitosa', `Te has suscrito a notificaciones de ${tema}`);
  } catch (error) {
    console.error('Error al suscribirse:', error);
    mostrarModal('Error', 'No se pudo completar la suscripción.');
  }
}

// Cancelar suscripción a un tema
export async function cancelarSuscripcionTema(tema) {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token de notificación disponible');
    }

    const response = await fetch('/api/cancelar-suscripcion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tema })
    });

    if (!response.ok) {
      throw new Error('Error al cancelar suscripción');
    }

    mostrarModal('Suscripción cancelada', `Has cancelado las notificaciones de ${tema}`);
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    mostrarModal('Error', 'No se pudo cancelar la suscripción.');
  }
}

// Inicializar UI de notificaciones
export function inicializarUINotificaciones() {
  const btnNotificaciones = document.getElementById('btn-notificaciones');
  const btnSuscribir = document.getElementById('btn-suscribir');
  const btnCancelar = document.getElementById('btn-cancelar');

  if (btnNotificaciones) {
    btnNotificaciones.addEventListener('click', async () => {
      const token = await solicitarPermisoNotificaciones();
      if (token) {
        btnNotificaciones.textContent = 'Notificaciones activadas';
        btnNotificaciones.disabled = true;
      }
    });
  }

  if (btnSuscribir) {
    btnSuscribir.addEventListener('click', () => {
      const tema = prompt('Ingresa el tema al que quieres suscribirte:');
      if (tema) {
        suscribirseATema(tema);
      }
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      const tema = prompt('Ingresa el tema del que quieres cancelar la suscripción:');
      if (tema) {
        cancelarSuscripcionTema(tema);
      }
    });
  }

  // Verificar si ya hay permisos
  if (Notification.permission === 'granted') {
    const token = obtenerToken();
    if (token && btnNotificaciones) {
      btnNotificaciones.textContent = 'Notificaciones activadas';
      btnNotificaciones.disabled = true;
    }
  }
} 