// Clave para guardar en localStorage
const STORAGE_KEY = 'recetasComunitarias';

// Carga recetas desde data/recetas.json y las guarda en localStorage
async function cargarRecetasDesdeJSON() {
  try {
    const response = await fetch('data/recetas.json');
    if (!response.ok) throw new Error('No se pudo cargar recetas.json');
    const recetas = await response.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recetas));
    return recetas;
  } catch (error) {
    console.error('Error al cargar recetas:', error);
    return [];
  }
}

// Carga recetas desde localStorage o JSON si es la primera vez
async function obtenerRecetas() {
  const recetasDesdeJSON = await cargarRecetasDesdeJSON();
  const recetasLocal = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const idsLocal = recetasLocal.map(r => r.id);
  const nuevas = recetasDesdeJSON.filter(r => !idsLocal.includes(r.id));

  if (nuevas.length > 0) {
    const actualizadas = [...recetasLocal, ...nuevas];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas));
    return actualizadas;
  }

  return recetasLocal;
}


  // Si no hay nada en localStorage, inicializa con el JSON
  if (!local) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archivo));
    return archivo;
  }

  const localRecetas = JSON.parse(local);

  // Si la cantidad de recetas del JSON > que las del localStorage, actualiza
  if (archivo.length > localRecetas.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archivo));
    return archivo;
  }

  // Si son iguales o local tiene más (por recetas agregadas por el usuario), usa el local
  return localRecetas;



// Guarda una nueva receta
async function guardarReceta(receta) {
  const recetas = await obtenerRecetas();
  receta.id = Date.now(); // ID único con timestamp
  recetas.push(receta);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recetas));
}

// Renderiza recetas en index.html
async function mostrarRecetas() {
  const contenedor = document.getElementById('recetas-list');
  if (!contenedor) return;

  const recetas = await obtenerRecetas();
  contenedor.innerHTML = '';

  recetas.forEach(receta => {
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

// Carga una receta en receta.html
async function mostrarDetalleReceta() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) return;

  const receta = (await obtenerRecetas()).find(r => r.id === id);
  if (!receta) return;

  document.querySelector('.receta-titulo').textContent = receta.titulo;

  const categoria = document.createElement('p');
  categoria.textContent = `Categoría: ${receta.categoria}`;
  categoria.classList.add('categoria-label');
  document.querySelector('.receta-titulo').insertAdjacentElement('afterend', categoria);

  document.querySelector('.receta-descripcion').textContent = receta.descripcion || 'Descripción no disponible.';
  document.querySelector('.receta-imagen').src = receta.imagen;
  document.querySelector('.receta-imagen').alt = `Imagen de ${receta.titulo}`;

  const ul = document.getElementById('lista-ingredientes');
  receta.ingredientes.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });

  const ol = document.getElementById('lista-pasos');
  receta.preparacion.forEach(paso => {
    const li = document.createElement('li');
    li.textContent = paso;
    ol.appendChild(li);
  });
}

// Ejecutar automáticamente según la página
document.addEventListener('DOMContentLoaded', () => {
  mostrarRecetas();
  mostrarDetalleReceta();
});
