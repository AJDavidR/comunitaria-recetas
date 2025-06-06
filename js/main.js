import { modal } from './modal.js';
import { agregarBotonesExportImport } from './export-import.js';
import { inicializarEstadisticas } from './estadisticas.js';
import { inicializarCompartir } from './compartir.js';

// === TEMA CLARO/OSCURO UNIVERSAL ===
const toggleBtn = document.getElementById('toggle-tema');
const body = document.body;

function aplicarTema(tema) {
  if (tema === 'oscuro') {
    body.classList.add('tema-oscuro');
  } else {
    body.classList.remove('tema-oscuro');
  }
  localStorage.setItem('tema', tema);
}

function alternarTema() {
  const temaActual = body.classList.contains('tema-oscuro') ? 'oscuro' : 'claro';
  const nuevoTema = temaActual === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevoTema);
}

function detectarTemaSistema() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'oscuro'
    : 'claro';
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem('tema');
  const temaInicial = temaGuardado || detectarTemaSistema();
  aplicarTema(temaInicial);
  if (toggleBtn) {
    toggleBtn.addEventListener('click', alternarTema);
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
    console.warn('localStorage no disponible');
    return false;
  }
}

// === BUSCADOR Y FILTRO DE CATEGORÍAS (Index) ===
function inicializarBuscadorYFiltro() {
  const inputBuscar = document.getElementById('buscador-recetas');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const contenedor = document.getElementById('recetas-list');

  if (!inputBuscar || !filtroCategoria || !contenedor) return;

  inputBuscar.addEventListener('input', filtrarRecetas);
  filtroCategoria.addEventListener('change', filtrarRecetas);

  async function filtrarRecetas() {
    const termino = inputBuscar.value.toLowerCase();
    const categoria = filtroCategoria.value;
    const recetas = await obtenerRecetas();

    const filtradas = recetas.filter(r => {
      const coincideNombre = r.titulo.toLowerCase().includes(termino);
      const coincideCategoria = !categoria || r.categoria === categoria;
      return coincideNombre && coincideCategoria;
    });

    contenedor.innerHTML = '';

    if (filtradas.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron recetas.</p>';
      return;
    }

    filtradas.forEach(receta => {
      const card = document.createElement('article');
      card.className = 'receta-card';
      card.innerHTML = `
        <img src="${receta.imagen}" alt="Imagen de ${receta.titulo}" />
        <h4>${receta.titulo}</h4>
        <p class="categoria-label">${receta.categoria}</p>
        <a class="btn" href="receta.html?id=${receta.id}">Ver receta</a>
      `;
      contenedor.appendChild(card);
    });
  }
}

// === BOTÓN LIMPIAR RECETAS DEL USUARIO ===
function manejarBotonLimpiar() {
  const btnLimpiar = document.getElementById('btn-limpiar-recetas');
  if (!btnLimpiar) return;

  btnLimpiar.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres eliminar todas tus recetas guardadas (no las del sistema)?')) {
      localStorage.removeItem('recetasUsuario');
      location.reload();
    }
  });
}

// === DETECTAR Y CARGAR SEGÚN PÁGINA ===
document.addEventListener('DOMContentLoaded', () => {
  if (!almacenamientoDisponible()) {
    alert('Tu navegador no soporta almacenamiento local. Algunas funciones no estarán disponibles.');
    return;
  }

  inicializarTema();
  inicializarBuscadorYFiltro();
  manejarBotonLimpiar();

  // Initialize all features
  inicializarNavegacion();
  inicializarRecetas();
  inicializarCompartir();
  agregarBotonesExportImport();
  
  // Show statistics if on index page
  if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    inicializarEstadisticas();
  }
});

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

// === Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.error('ServiceWorker registration failed:', err);
      });
  });
}
