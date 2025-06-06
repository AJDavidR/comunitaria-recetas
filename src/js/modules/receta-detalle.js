import { 
  obtenerReceta, 
  actualizarReceta, 
  eliminarReceta,
  guardarUltimaRecetaVista 
} from './local-storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recetaId = urlParams.get('id');
  
  if (!recetaId) {
    mostrarError('No se especificó una receta');
    return;
  }

  try {
    const receta = await obtenerReceta(recetaId);
    if (!receta) {
      mostrarError('Receta no encontrada');
      return;
    }

    guardarUltimaRecetaVista(recetaId);
    mostrarReceta(receta);
    configurarEventos(receta);
  } catch (error) {
    console.error('Error al cargar la receta:', error);
    mostrarError('Error al cargar la receta');
  }
});

function mostrarReceta(receta) {
  const contenedor = document.getElementById('receta-detalle');
  
  const ingredientesHTML = receta.ingredientes
    .map(ing => `<li>${ing}</li>`)
    .join('');
    
  const pasosHTML = receta.pasos
    .map((paso, index) => `<li>${paso}</li>`)
    .join('');
    
  const comentariosHTML = (receta.comentarios || [])
    .map(comentario => `
      <div class="comentario">
        <p class="comentario-texto">${comentario.texto}</p>
        <small class="comentario-fecha">${new Date(comentario.fecha).toLocaleDateString()}</small>
      </div>
    `)
    .join('');

  contenedor.innerHTML = `
    <article class="receta-completa">
      <header class="receta-header">
        <h2 class="receta-titulo">${receta.titulo}</h2>
        <p class="receta-categoria">${receta.categoria}</p>
      </header>
      
      <img src="${receta.imagen}" alt="${receta.titulo}" class="receta-imagen" />
      
      <div class="receta-info">
        <p class="receta-descripcion">${receta.descripcion}</p>
        
        <section class="receta-ingredientes">
          <h3>Ingredientes</h3>
          <ul>${ingredientesHTML}</ul>
        </section>
        
        <section class="receta-pasos">
          <h3>Preparación</h3>
          <ol>${pasosHTML}</ol>
        </section>
      </div>
      
      <div class="receta-acciones">
        <button class="btn btn-editar" data-id="${receta.id}">✏️ Editar</button>
        <button class="btn btn-eliminar" data-id="${receta.id}">🗑️ Eliminar</button>
      </div>
    </article>
  `;

  // Mostrar comentarios
  const listaComentarios = document.getElementById('lista-comentarios');
  listaComentarios.innerHTML = comentariosHTML || '<p class="no-comentarios">No hay comentarios aún</p>';
}

function configurarEventos(receta) {
  // Botón editar
  const btnEditar = document.querySelector('.btn-editar');
  if (btnEditar) {
    btnEditar.addEventListener('click', () => {
      window.location.href = `editar-receta.html?id=${receta.id}`;
    });
  }

  // Botón eliminar
  const btnEliminar = document.querySelector('.btn-eliminar');
  if (btnEliminar) {
    btnEliminar.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
        try {
          await eliminarReceta(receta.id);
          window.location.href = 'home.html';
        } catch (error) {
          console.error('Error al eliminar la receta:', error);
          alert('Error al eliminar la receta');
        }
      }
    });
  }

  // Formulario de comentarios
  const formComentario = document.getElementById('form-comentario');
  if (formComentario) {
    formComentario.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const texto = document.getElementById('nuevo-comentario').value.trim();
      if (!texto) return;

      try {
        const comentario = {
          texto,
          fecha: new Date().toISOString()
        };

        const recetaActualizada = {
          ...receta,
          comentarios: [...(receta.comentarios || []), comentario]
        };

        await actualizarReceta(receta.id, recetaActualizada);
        mostrarReceta(recetaActualizada);
        formComentario.reset();
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al agregar el comentario');
      }
    });
  }
}

function mostrarError(mensaje) {
  const contenedor = document.getElementById('receta-detalle');
  contenedor.innerHTML = `
    <div class="error-mensaje">
      <h2>Error</h2>
      <p>${mensaje}</p>
      <a href="home.html" class="btn">Volver al inicio</a>
    </div>
  `;
} 