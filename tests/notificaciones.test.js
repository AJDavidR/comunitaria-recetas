import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  solicitarPermisoNotificaciones,
  obtenerToken,
  suscribirseATema,
  cancelarSuscripcionTema
} from '../js/notificaciones.js';
import { mostrarModal } from '../js/modal.js';

// Mock de Firebase Messaging
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn()
}));

// Mock del modal
vi.mock('../js/modal.js', () => ({
  mostrarModal: vi.fn()
}));

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de Notification API
const mockNotification = {
  requestPermission: vi.fn(),
  permission: 'default'
};

Object.defineProperty(window, 'Notification', { value: mockNotification });

describe('Notificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockNotification.permission = 'default';
  });

  describe('Solicitar Permiso', () => {
    it('debería solicitar permiso y guardar token exitosamente', async () => {
      const mockToken = 'mock-fcm-token';
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const { getToken } = await import('firebase/messaging');
      getToken.mockResolvedValue(mockToken);

      const token = await solicitarPermisoNotificaciones();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('fcm-token', mockToken);
      expect(token).toBe(mockToken);
    });

    it('debería manejar permiso denegado', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');

      const token = await solicitarPermisoNotificaciones();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('Notificaciones', expect.any(String));
      expect(token).toBeNull();
    });

    it('debería manejar errores al solicitar permiso', async () => {
      mockNotification.requestPermission.mockRejectedValue(new Error('Error de permisos'));

      const token = await solicitarPermisoNotificaciones();
      
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.any(String));
      expect(token).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('debería guardar y recuperar token correctamente', () => {
      const mockToken = 'test-token';
      localStorage.setItem('fcm-token', mockToken);
      
      const token = obtenerToken();
      
      expect(localStorage.getItem).toHaveBeenCalledWith('fcm-token');
      expect(token).toBe(mockToken);
    });

    it('debería retornar null si no hay token', () => {
      const token = obtenerToken();
      
      expect(localStorage.getItem).toHaveBeenCalledWith('fcm-token');
      expect(token).toBeNull();
    });
  });

  describe('Suscripciones', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('debería suscribirse a un tema exitosamente', async () => {
      const mockToken = 'test-token';
      const tema = 'nuevas-recetas';
      localStorage.setItem('fcm-token', mockToken);
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await suscribirseATema(tema);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/suscribir-tema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: mockToken, tema })
      });
      expect(mostrarModal).toHaveBeenCalledWith('Suscripción exitosa', expect.any(String));
    });

    it('debería manejar error al suscribirse sin token', async () => {
      await suscribirseATema('nuevas-recetas');
      
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.any(String));
    });

    it('debería cancelar suscripción exitosamente', async () => {
      const mockToken = 'test-token';
      const tema = 'nuevas-recetas';
      localStorage.setItem('fcm-token', mockToken);
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await cancelarSuscripcionTema(tema);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/cancelar-suscripcion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: mockToken, tema })
      });
      expect(mostrarModal).toHaveBeenCalledWith('Suscripción cancelada', expect.any(String));
    });

    it('debería manejar error al cancelar suscripción', async () => {
      const mockToken = 'test-token';
      const tema = 'nuevas-recetas';
      localStorage.setItem('fcm-token', mockToken);
      
      global.fetch.mockRejectedValueOnce(new Error('Error de red'));

      await cancelarSuscripcionTema(tema);
      
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });
}); 