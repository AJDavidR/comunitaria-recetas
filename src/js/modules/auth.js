import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { mostrarModal } from './modal.js';

// Configuración de Firebase
const firebaseConfig = {
  // TODO: Reemplazar con tus credenciales de Firebase
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Variable para almacenar el usuario actual
let usuarioActual = null;

// Función para emitir el evento de cambio de estado de autenticación
function emitirCambioEstado(usuario) {
  usuarioActual = usuario;
  window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { usuario } }));
}

// Inicializar el estado de autenticación
export function inicializarAuth() {
  onAuthStateChanged(auth, (usuario) => {
    emitirCambioEstado(usuario);
  });
}

// Obtener el usuario actual
export async function obtenerUsuarioActual() {
  return usuarioActual;
}

// Verificar si el usuario está autenticado
export function estaAutenticado() {
  return usuarioActual !== null;
}

// Iniciar sesión con email y contraseña
export async function iniciarSesion(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    mostrarModal('¡Bienvenido!', 'Has iniciado sesión correctamente.');
    return userCredential.user;
  } catch (error) {
    mostrarModal('Error', 'Error al iniciar sesión: ' + error.message);
    throw error;
  }
}

// Registrarse con email y contraseña
export async function registrarse(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    mostrarModal('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente.');
    return userCredential.user;
  } catch (error) {
    mostrarModal('Error', 'Error al registrar usuario: ' + error.message);
    throw error;
  }
}

// Iniciar sesión con Google
export async function iniciarSesionConGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    mostrarModal('¡Bienvenido!', 'Has iniciado sesión con Google correctamente.');
    return result.user;
  } catch (error) {
    mostrarModal('Error', 'Error al iniciar sesión con Google: ' + error.message);
    throw error;
  }
}

// Cerrar sesión
export async function cerrarSesion() {
  try {
    await signOut(auth);
    mostrarModal('Sesión cerrada', 'Has cerrado sesión correctamente.');
  } catch (error) {
    mostrarModal('Error', 'Error al cerrar sesión: ' + error.message);
    throw error;
  }
}

// Recuperar contraseña
export async function recuperarPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    mostrarModal('Email enviado', 'Se ha enviado un email para recuperar tu contraseña.');
  } catch (error) {
    mostrarModal('Error', 'Error al enviar email de recuperación: ' + error.message);
    throw error;
  }
}

// Actualizar UI basado en estado de autenticación
function actualizarUI() {
  const botonesAuth = document.querySelectorAll('[data-auth]');
  const elementosUsuario = document.querySelectorAll('[data-usuario]');
  
  botonesAuth.forEach(boton => {
    const accion = boton.dataset.auth;
    if (accion === 'login' && usuarioActual) {
      boton.style.display = 'none';
    } else if (accion === 'logout' && !usuarioActual) {
      boton.style.display = 'none';
    } else {
      boton.style.display = 'inline-block';
    }
  });

  elementosUsuario.forEach(elemento => {
    if (usuarioActual) {
      elemento.textContent = usuarioActual.email;
      elemento.style.display = 'inline-block';
    } else {
      elemento.style.display = 'none';
    }
  });
}

// Inicializar UI de autenticación
export function inicializarAuthUI() {
  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');
  const btnGoogle = document.getElementById('btn-google');
  const btnLogout = document.getElementById('btn-logout');
  const btnRecuperar = document.getElementById('btn-recuperar');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formLogin.email.value;
      const password = formLogin.password.value;
      await iniciarSesion(email, password);
    });
  }

  if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formRegistro.email.value;
      const password = formRegistro.password.value;
      await registrarse(email, password);
    });
  }

  if (btnGoogle) {
    btnGoogle.addEventListener('click', iniciarSesionConGoogle);
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', cerrarSesion);
  }

  if (btnRecuperar) {
    btnRecuperar.addEventListener('click', async () => {
      const email = prompt('Ingresa tu email para recuperar la contraseña:');
      if (email) {
        await recuperarPassword(email);
      }
    });
  }

  // Actualizar UI inicial
  actualizarUI();
}

// Función para crear un usuario de prueba
export async function crearUsuarioPrueba() {
  try {
    const email = 'usuario@ejemplo.com';
    const password = 'password123';
    
    // Intentar crear el usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Usuario de prueba creado:', userCredential.user.uid);
    
    // Actualizar el perfil del usuario
    await updateProfile(userCredential.user, {
      displayName: 'Usuario Prueba'
    });
    
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Si el usuario ya existe, intentar iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario de prueba ya existe, iniciando sesión');
      return userCredential.user;
    }
    throw error;
  }
} 