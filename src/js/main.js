import { modal } from './modal.js';
import { agregarBotonesExportImport } from './export-import.js';
import { inicializarEstadisticas } from './estadisticas.js';
import { inicializarCompartir } from './compartir.js';

// === CONSTANTES Y CONFIGURACIÓN ===
const CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: {
    TITULO: 100,
    AUTOR: 50,
    INGREDIENTES: 1000,
    PREPARACION: 2000
  },
  IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Sin+imagen',
  STORAGE_KEYS: {
    TEMA: 'tema',
    RECETAS: 'recetasUsuario'
  }
};

// === TEMA CLARO/OSCURO UNIVERSAL ===
const toggleBtn = document.getElementById('toggle-tema');
const body = document.body;

function aplicarTema(tema) {
  try {
    if (tema === 'oscuro') {
      body.classList.add('tema-oscuro');
    } else {
      body.classList.remove('tema-oscuro');
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.TEMA, tema);
  } catch (error) {
    console.error('Error al aplicar tema:', error);
    // Fallback al tema claro si hay error
    body.classList.remove('tema-oscuro');
  }
}

function alternarTema() {
  try {
    const temaActual = body.classList.contains('tema-oscuro') ? 'oscuro' : 'claro';
    const nuevoTema = temaActual === 'oscuro' ? 'claro' : 'oscuro';
    aplicarTema(nuevoTema);
  } catch (error) {
    console.error('Error al alternar tema:', error);
  }
}

function detectarTemaSistema() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  } catch (error) {
    console.error('Error al detectar tema del sistema:', error);
    return 'claro';
  }
}

function asociarToggleTema() {
  const toggleBtn = document.getElementById('toggle-tema');
  if (toggleBtn) {
    toggleBtn.removeEventListener('click', alternarTema); // Evita duplicados
    toggleBtn.addEventListener('click', alternarTema);
  }
}

function inicializarTema() {
  try {
    const temaGuardado = localStorage.getItem(CONFIG.STORAGE_KEYS.TEMA);
    const temaInicial = temaGuardado || detectarTemaSistema();
    aplicarTema(temaInicial);
    asociarToggleTema();
    // Listener para cambios en el tema del sistema
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.TEMA)) {
          aplicarTema(e.matches ? 'oscuro' : 'claro');
        }
      });
    }
  } catch (error) {
    console.error('Error al inicializar tema:', error);
  }
}

// === VERIFICAR SOPORTE LOCALSTORAGE ===
function almacenamientoDisponible() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage no disponible:', e);
    return false;
  }
}

// === VALIDACIÓN DE DATOS ===
function validarReceta(receta) {
  const errores = [];
  
  if (!receta.titulo || receta.titulo.length < CONFIG.MIN_LENGTH) {
    errores.push(`El título debe tener al menos ${CONFIG.MIN_LENGTH} caracteres`);
  } else if (receta.titulo.length > CONFIG.MAX_LENGTH.TITULO) {
    errores.push(`El título no puede tener más de ${CONFIG.MAX_LENGTH.TITULO} caracteres`);
  }
  
  if (!receta.autor || receta.autor.length < CONFIG.MIN_LENGTH) {
    errores.push(`El autor debe tener al menos ${CONFIG.MIN_LENGTH} caracteres`);
  } else if (receta.autor.length > CONFIG.MAX_LENGTH.AUTOR) {
    errores.push(`El nombre del autor no puede tener más de ${CONFIG.MAX_LENGTH.AUTOR} caracteres`);
  }
  
  if (receta.ingredientes.length === 0) {
    errores.push('Debes agregar al menos un ingrediente');
  } else if (receta.ingredientes.join('\n').length > CONFIG.MAX_LENGTH.INGREDIENTES) {
    errores.push(`Los ingredientes no pueden tener más de ${CONFIG.MAX_LENGTH.INGREDIENTES} caracteres en total`);
  }
  
  if (receta.preparacion.length === 0) {
    errores.push('Debes agregar al menos un paso de preparación');
  } else if (receta.preparacion.join('\n').length > CONFIG.MAX_LENGTH.PREPARACION) {
    errores.push(`La preparación no puede tener más de ${CONFIG.MAX_LENGTH.PREPARACION} caracteres en total`);
  }
  
  return errores;
}

// === BUSCADOR Y FILTRO DE CATEGORÍAS ===
async function obtenerRecetas() {
  try {
    const recetasUsuario = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECETAS) || '[]');
    const recetasSistema = await import('./data/recetas.js').then(m => m.recetasSistema);
    return [...recetasUsuario, ...recetasSistema];
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return [];
  }
}

function inicializarBuscadorYFiltro() {
  const inputBuscar = document.getElementById('buscador-recetas');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const contenedor = document.getElementById('recetas-list');

  if (!inputBuscar || !filtroCategoria || !contenedor) return;

  let timeoutId;
  const debounce = (fn, delay) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, delay);
  };

  inputBuscar.addEventListener('input', () => debounce(filtrarRecetas, 300));
  filtroCategoria.addEventListener('change', filtrarRecetas);

  async function filtrarRecetas() {
    try {
      const termino = inputBuscar.value.toLowerCase().trim();
      const categoria = filtroCategoria.value;
      const recetas = await obtenerRecetas();

      const filtradas = recetas.filter(r => {
        const coincideNombre = r.titulo.toLowerCase().includes(termino);
        const coincideCategoria = !categoria || r.categoria === categoria;
        return coincideNombre && coincideCategoria;
      });

      contenedor.innerHTML = '';

      if (filtradas.length === 0) {
        contenedor.innerHTML = `
          <div class="no-resultados">
            <p>No se encontraron recetas.</p>
            ${termino ? `<p>Intenta con otros términos de búsqueda.</p>` : ''}
          </div>
        `;
        return;
      }

      const fragment = document.createDocumentFragment();
      filtradas.forEach(receta => {
        const card = document.createElement('article');
        card.className = 'receta-card';
        card.innerHTML = `
          <img src="${receta.imagen || CONFIG.IMAGE_PLACEHOLDER}" 
               alt="Imagen de ${receta.titulo}"
               loading="lazy"
               onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}'" />
          <h4>${receta.titulo}</h4>
          <p class="categoria-label">${receta.categoria}</p>
          <a class="btn" href="receta.html?id=${receta.id}">Ver receta</a>
        `;
        fragment.appendChild(card);
      });
      contenedor.appendChild(fragment);
    } catch (error) {
      console.error('Error al filtrar recetas:', error);
      contenedor.innerHTML = `
        <div class="error-message">
          <p>Ha ocurrido un error al buscar recetas.</p>
          <button onclick="location.reload()" class="btn">Reintentar</button>
        </div>
      `;
    }
  }
}

// === BOTÓN LIMPIAR RECETAS ===
async function manejarBotonLimpiar() {
  const btnLimpiar = document.getElementById('btn-limpiar-recetas');
  if (!btnLimpiar) return;

  btnLimpiar.addEventListener('click', async () => {
    try {
      const confirmar = await modal.confirm(
        '¿Seguro que quieres eliminar todas tus recetas guardadas?',
        'Eliminar Recetas',
        'Esta acción no se puede deshacer.'
      );
      
      if (confirmar) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.RECETAS);
        location.reload();
      }
    } catch (error) {
      console.error('Error al limpiar recetas:', error);
      await modal.alert('Ha ocurrido un error al eliminar las recetas.');
    }
  });
}

// === INICIALIZACIÓN DE LA APLICACIÓN ===
async function inicializarApp() {
  try {
    if (!almacenamientoDisponible()) {
      await modal.alert(
        'Tu navegador no soporta almacenamiento local. Algunas funciones no estarán disponibles.',
        'Advertencia'
      );
      return;
    }

    // Inicializar características básicas
    inicializarTema();
    inicializarBuscadorYFiltro();
    await manejarBotonLimpiar();
    inicializarNavegacion();

    // Inicializar características adicionales
    const [recetas, compartir, exportImport] = await Promise.all([
      inicializarRecetas().catch(e => console.error('Error al inicializar recetas:', e)),
      inicializarCompartir().catch(e => console.error('Error al inicializar compartir:', e)),
      agregarBotonesExportImport().catch(e => console.error('Error al inicializar export/import:', e))
    ]);

    // Inicializar estadísticas solo en la página principal
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
      await inicializarEstadisticas().catch(e => console.error('Error al inicializar estadísticas:', e));
    }
  } catch (error) {
    console.error('Error en la inicialización de la aplicación:', error);
    await modal.alert('Ha ocurrido un error al cargar la aplicación. Por favor, recarga la página.');
  }
}

// === Service Worker Registration ===
async function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registrado:', registration.scope);
      
      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            modal.confirm(
              'Hay una nueva versión disponible. ¿Deseas actualizar?',
              'Actualización Disponible'
            ).then(actualizar => {
              if (actualizar) {
                window.location.reload();
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('Error al registrar ServiceWorker:', error);
    }
  }
}

// === Navegación ===
function inicializarNavegacion() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.getAttribute('href') === window.location.pathname.split('/').pop()) {
      link.classList.add('active');
    }
  });
}

// === Recetas ===
async function inicializarRecetas() {
  const form = document.getElementById('form-receta');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const titulo = document.getElementById('titulo').value.trim();
      const autor = document.getElementById('autor').value.trim();
      
      if (titulo.length < 3 || autor.length < 3) {
        await modal.alert('El título y el autor deben tener al menos 3 caracteres.');
        return;
      }
      
      const receta = {
        titulo,
        autor,
        imagen: document.getElementById('imagen').value.trim() || 'https://via.placeholder.com/300x200?text=Sin+imagen',
        categoria: document.getElementById('categoria').value,
        ingredientes: document.getElementById('ingredientes').value.trim().split('\n').filter(Boolean),
        preparacion: document.getElementById('preparacion').value.trim().split('\n').filter(Boolean)
      };
      
      guardarRecetaUsuario(receta);
      form.reset();
      
      await modal.alert('¡Tu receta ha sido guardada! 🎉');
      window.location.href = 'index.html';
    };
  }
  
  // Replace confirm with modal for delete
  const btnLimpiar = document.getElementById('btn-limpiar-recetas');
  if (btnLimpiar) {
    btnLimpiar.onclick = async () => {
      const confirmar = await modal.confirm(
        '¿Seguro que quieres eliminar todas tus recetas guardadas (no las del sistema)?',
        'Eliminar Recetas'
      );
      
      if (confirmar) {
        localStorage.removeItem('recetasUsuario');
        location.reload();
      }
    };
  }
}

// MINI ROUTER SPA
const RUTAS = [
  { path: 'home.html', title: 'Inicio' },
  { path: 'agregar-receta.html', title: 'Agregar Receta' },
  { path: 'categorias.html', title: 'Categorías' },
  { path: 'login.html', title: 'Iniciar Sesión' },
  { path: 'registro.html', title: 'Registro' },
  { path: 'receta.html', title: 'Receta' },
];

function obtenerRutaActual() {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === '/' || hash === 'index.html') return 'home.html';
  return hash;
}

async function cargarPagina(ruta) {
  const contenedor = document.querySelector('main') || document.getElementById('spa-main');
  if (!contenedor) return;
  try {
    contenedor.innerHTML = '<div class="spinner">Cargando...</div>';
    const resp = await fetch(`src/views/pages/${ruta}`);
    if (!resp.ok) throw new Error('No se pudo cargar la página');
    const html = await resp.text();
    // Extraer solo el contenido de <main>...</main>
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const nuevoMain = temp.querySelector('main');
    if (nuevoMain) {
      contenedor.replaceWith(nuevoMain);
    } else {
      contenedor.innerHTML = html;
    }
    document.title = temp.querySelector('title')?.textContent || 'Cocina Comunitaria';
    resaltarEnlaceActivo(ruta);
    window.scrollTo(0, 0);
    inicializarTema(); // <-- Asegura que el tema y el botón funcionen tras cada carga SPA
  } catch (e) {
    contenedor.innerHTML = '<div class="error">Error al cargar la página</div>';
  }
}

function resaltarEnlaceActivo(ruta) {
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === ruta) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function manejarNavegacionSPA(e) {
  const link = e.target.closest('a.nav-link');
  if (link && link.getAttribute('href')) {
    const ruta = link.getAttribute('href');
    if (RUTAS.some(r => r.path === ruta)) {
      e.preventDefault();
      window.location.hash = ruta;
    }
  }
}

document.addEventListener('click', manejarNavegacionSPA);
window.addEventListener('hashchange', () => cargarPagina(obtenerRutaActual()));

// Inicialización SPA al cargar
if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash || window.location.hash === '#index.html') window.location.hash = 'home.html';
    cargarPagina(obtenerRutaActual());
  });
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
  registrarServiceWorker();
});
