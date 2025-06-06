import { estaAutenticado, obtenerUsuarioActual } from './auth.js';

// Rutas protegidas que requieren autenticación
const RUTAS_PROTEGIDAS = ['home.html', 'agregar.html', 'categorias.html'];
const RUTA_LOGIN = 'login.html';
const RUTA_HOME = 'home.html';

// Rutas públicas (no requieren autenticación)
const RUTAS_PUBLICAS = [
  '/login.html'
];

// Función para verificar si una ruta está protegida
function esRutaProtegida(ruta) {
  return RUTAS_PROTEGIDAS.some(rutaProtegida => ruta.endsWith(rutaProtegida));
}

// Función para verificar la autenticación y actualizar la UI
async function verificarAutenticacion() {
  const usuario = await obtenerUsuarioActual();
  const rutaActual = window.location.pathname.split('/').pop() || 'index.html';
  
  // Actualizar UI basado en el estado de autenticación
  const elementosProtegidos = document.querySelectorAll('[data-protegido]');
  const botonesAuth = document.querySelectorAll('[data-auth]');
  const usuarioDisplay = document.querySelector('[data-usuario]');
  
  elementosProtegidos.forEach(elemento => {
    elemento.style.display = usuario ? 'block' : 'none';
  });
  
  botonesAuth.forEach(boton => {
    const accion = boton.dataset.auth;
    boton.style.display = accion === (usuario ? 'logout' : 'login') ? 'block' : 'none';
  });
  
  if (usuarioDisplay) {
    usuarioDisplay.textContent = usuario ? usuario.email : '';
  }
  
  // Redirigir según el estado de autenticación
  if (usuario) {
    // Si el usuario está autenticado y está en login o index, redirigir a home
    if (rutaActual === RUTA_LOGIN || rutaActual === 'index.html') {
      window.location.href = RUTA_HOME;
    }
  } else {
    // Si el usuario no está autenticado y está en una ruta protegida, redirigir a login
    if (esRutaProtegida(rutaActual)) {
      window.location.href = RUTA_LOGIN;
    }
  }
}

// Actualizar elementos de UI según estado de autenticación
function actualizarUI() {
  const usuario = obtenerUsuarioActual();
  const elementosAuth = document.querySelectorAll('[data-auth]');
  const elementosUsuario = document.querySelectorAll('[data-usuario]');
  const elementosProtegidos = document.querySelectorAll('[data-protegido]');

  elementosAuth.forEach(elemento => {
    const accion = elemento.dataset.auth;
    if (accion === 'login' && usuario) {
      elemento.style.display = 'none';
    } else if (accion === 'logout' && !usuario) {
      elemento.style.display = 'none';
    } else {
      elemento.style.display = 'inline-block';
    }
  });

  elementosUsuario.forEach(elemento => {
    if (usuario) {
      elemento.textContent = usuario.email;
      elemento.style.display = 'inline-block';
    } else {
      elemento.style.display = 'none';
    }
  });

  elementosProtegidos.forEach(elemento => {
    if (usuario) {
      elemento.style.display = '';
    } else {
      elemento.style.display = 'none';
    }
  });
}

// Inicializar el middleware de autenticación
export function inicializarAuthMiddleware() {
  // Verificar autenticación al cargar la página
  verificarAutenticacion();
  
  // Escuchar cambios en el estado de autenticación
  window.addEventListener('auth-state-changed', verificarAutenticacion);
  
  // Configurar botones de autenticación
  document.querySelectorAll('[data-auth]').forEach(boton => {
    boton.addEventListener('click', async (e) => {
      e.preventDefault();
      const accion = boton.dataset.auth;
      
      if (accion === 'logout') {
        await cerrarSesion();
        window.location.href = RUTA_LOGIN;
      }
    });
  });
} 