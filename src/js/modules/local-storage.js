// Constantes
const STORAGE_KEYS = {
  RECETAS_USUARIO: 'recetas_usuario',
  TEMA: 'tema_oscuro',
  ULTIMA_RECETA: 'ultima_receta_vista'
};

// Utilidades
function obtenerRecetasUsuario() {
  const recetas = localStorage.getItem(STORAGE_KEYS.RECETAS_USUARIO);
  return recetas ? JSON.parse(recetas) : [];
}

function guardarRecetasUsuario(recetas) {
  localStorage.setItem(STORAGE_KEYS.RECETAS_USUARIO, JSON.stringify(recetas));
}

function obtenerRecetasSistema() {
  return fetch('/data/recetas.json')
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar recetas del sistema');
      return response.json();
    });
}

// Funciones principales
export async function obtenerTodasLasRecetas() {
  try {
    const [recetasSistema, recetasUsuario] = await Promise.all([
      obtenerRecetasSistema(),
      obtenerRecetasUsuario()
    ]);
    return [...recetasSistema, ...recetasUsuario];
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return obtenerRecetasUsuario(); // Fallback a solo recetas de usuario
  }
}

export function guardarReceta(receta) {
  const recetas = obtenerRecetasUsuario();
  const nuevaReceta = {
    ...receta,
    id: Date.now().toString(),
    fechaCreacion: new Date().toISOString(),
    likes: 0,
    comentarios: []
  };
  recetas.push(nuevaReceta);
  guardarRecetasUsuario(recetas);
  return nuevaReceta;
}

export function actualizarReceta(id, recetaActualizada) {
  const recetas = obtenerRecetasUsuario();
  const index = recetas.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  recetas[index] = {
    ...recetas[index],
    ...recetaActualizada,
    fechaActualizacion: new Date().toISOString()
  };
  guardarRecetasUsuario(recetas);
  return recetas[index];
}

export function eliminarReceta(id) {
  const recetas = obtenerRecetasUsuario();
  const index = recetas.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  recetas.splice(index, 1);
  guardarRecetasUsuario(recetas);
  return true;
}

export function obtenerReceta(id) {
  const recetas = obtenerRecetasUsuario();
  return recetas.find(r => r.id === id) || null;
}

export function buscarRecetas(termino) {
  const recetas = obtenerRecetasUsuario();
  termino = termino.toLowerCase();
  return recetas.filter(r => 
    r.titulo.toLowerCase().includes(termino) ||
    r.descripcion.toLowerCase().includes(termino) ||
    r.categoria.toLowerCase().includes(termino)
  );
}

export function obtenerRecetasPorCategoria(categoria) {
  const recetas = obtenerRecetasUsuario();
  return recetas.filter(r => r.categoria.toLowerCase() === categoria.toLowerCase());
}

export function guardarTema(temaOscuro) {
  localStorage.setItem(STORAGE_KEYS.TEMA, temaOscuro);
}

export function obtenerTema() {
  return localStorage.getItem(STORAGE_KEYS.TEMA) === 'true';
}

export function guardarUltimaRecetaVista(id) {
  localStorage.setItem(STORAGE_KEYS.ULTIMA_RECETA, id);
}

export function obtenerUltimaRecetaVista() {
  return localStorage.getItem(STORAGE_KEYS.ULTIMA_RECETA);
} 