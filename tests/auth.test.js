import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  iniciarSesion,
  registrarUsuario,
  iniciarSesionGoogle,
  cerrarSesion,
  recuperarPassword,
  estaAutenticado,
  obtenerUsuarioActual
} from '../js/auth.js';
import { mostrarModal } from '../js/modal.js';

// Mock de Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn()
}));

// Mock del modal
vi.mock('../js/modal.js', () => ({
  mostrarModal: vi.fn()
}));

describe('Autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Iniciar Sesión', () => {
    it('debería iniciar sesión exitosamente con email/contraseña', async () => {
      const mockUser = { email: 'test@example.com' };
      const mockSignIn = vi.fn().mockResolvedValue({ user: mockUser });
      
      // Configurar mock
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      signInWithEmailAndPassword.mockImplementation(mockSignIn);

      const result = await iniciarSesion('test@example.com', 'password123');
      
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('¡Bienvenido!', expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it('debería manejar errores de inicio de sesión', async () => {
      const mockError = new Error('Credenciales inválidas');
      const mockSignIn = vi.fn().mockRejectedValue(mockError);
      
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      signInWithEmailAndPassword.mockImplementation(mockSignIn);

      await expect(iniciarSesion('test@example.com', 'wrong')).rejects.toThrow();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.stringContaining('Credenciales inválidas'));
    });
  });

  describe('Registro', () => {
    it('debería registrar usuario exitosamente', async () => {
      const mockUser = { email: 'new@example.com' };
      const mockCreateUser = vi.fn().mockResolvedValue({ user: mockUser });
      
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      createUserWithEmailAndPassword.mockImplementation(mockCreateUser);

      const result = await registrarUsuario('new@example.com', 'Password123');
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('¡Registro exitoso!', expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it('debería manejar errores de registro', async () => {
      const mockError = new Error('Email ya en uso');
      const mockCreateUser = vi.fn().mockRejectedValue(mockError);
      
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      createUserWithEmailAndPassword.mockImplementation(mockCreateUser);

      await expect(registrarUsuario('existing@example.com', 'Password123')).rejects.toThrow();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.stringContaining('Email ya en uso'));
    });
  });

  describe('Inicio de sesión con Google', () => {
    it('debería iniciar sesión exitosamente con Google', async () => {
      const mockUser = { email: 'google@example.com' };
      const mockGoogleSignIn = vi.fn().mockResolvedValue({ user: mockUser });
      
      const { signInWithPopup } = await import('firebase/auth');
      signInWithPopup.mockImplementation(mockGoogleSignIn);

      const result = await iniciarSesionGoogle();
      
      expect(signInWithPopup).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('¡Bienvenido!', expect.any(String));
      expect(result).toEqual(mockUser);
    });

    it('debería manejar errores de inicio de sesión con Google', async () => {
      const mockError = new Error('Popup bloqueado');
      const mockGoogleSignIn = vi.fn().mockRejectedValue(mockError);
      
      const { signInWithPopup } = await import('firebase/auth');
      signInWithPopup.mockImplementation(mockGoogleSignIn);

      await expect(iniciarSesionGoogle()).rejects.toThrow();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.stringContaining('Popup bloqueado'));
    });
  });

  describe('Cerrar Sesión', () => {
    it('debería cerrar sesión exitosamente', async () => {
      const mockSignOut = vi.fn().mockResolvedValue();
      
      const { signOut } = await import('firebase/auth');
      signOut.mockImplementation(mockSignOut);

      await cerrarSesion();
      
      expect(signOut).toHaveBeenCalled();
      expect(mostrarModal).toHaveBeenCalledWith('Sesión cerrada', expect.any(String));
    });

    it('debería manejar errores al cerrar sesión', async () => {
      const mockError = new Error('Error de red');
      const mockSignOut = vi.fn().mockRejectedValue(mockError);
      
      const { signOut } = await import('firebase/auth');
      signOut.mockImplementation(mockSignOut);

      await expect(cerrarSesion()).rejects.toThrow();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.stringContaining('Error de red'));
    });
  });

  describe('Recuperación de Contraseña', () => {
    it('debería enviar email de recuperación exitosamente', async () => {
      const mockSendReset = vi.fn().mockResolvedValue();
      
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockImplementation(mockSendReset);

      await recuperarPassword('test@example.com');
      
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
      expect(mostrarModal).toHaveBeenCalledWith('Email enviado', expect.any(String));
    });

    it('debería manejar errores al enviar email de recuperación', async () => {
      const mockError = new Error('Email no encontrado');
      const mockSendReset = vi.fn().mockRejectedValue(mockError);
      
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockImplementation(mockSendReset);

      await expect(recuperarPassword('nonexistent@example.com')).rejects.toThrow();
      expect(mostrarModal).toHaveBeenCalledWith('Error', expect.stringContaining('Email no encontrado'));
    });
  });

  describe('Estado de Autenticación', () => {
    it('debería verificar correctamente el estado de autenticación', () => {
      // Simular usuario autenticado
      const mockUser = { email: 'test@example.com' };
      vi.spyOn(global, 'obtenerUsuarioActual').mockReturnValue(mockUser);
      
      expect(estaAutenticado()).toBe(true);
      
      // Simular usuario no autenticado
      vi.spyOn(global, 'obtenerUsuarioActual').mockReturnValue(null);
      
      expect(estaAutenticado()).toBe(false);
    });
  });
}); 