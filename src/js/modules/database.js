import { database } from './firebase-config.js';
import { ref, set, get, remove, update, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { obtenerUsuarioActual } from './auth.js';

// Referencias a la base de datos
const RECETAS_REF = 'recetas';
const COMENTARIOS_REF = 'comentarios';
const FAVORITOS_REF = 'favoritos';

// Guardar una nueva receta
export async function guardarReceta(receta) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Usuario no autenticado');

    const recetaRef = ref(database, `${RECETAS_REF}/${Date.now()}`);
    const recetaCompleta = {
      ...receta,
      autor: usuario.email,
      fechaCreacion: Date.now(),
      likes: 0,
      comentarios: 0
    };

    await set(recetaRef, recetaCompleta);
    return true;
  } catch (error) {
    console.error('Error al guardar receta:', error);
    throw error;
  }
}

// Obtener todas las recetas
export async function obtenerRecetas() {
  try {
    const recetasRef = ref(database, RECETAS_REF);
    const snapshot = await get(recetasRef);
    
    if (!snapshot.exists()) return [];
    
    const recetas = [];
    snapshot.forEach((childSnapshot) => {
      recetas.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return recetas.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    throw error;
  }
}

// Obtener una receta por ID
export async function obtenerReceta(id) {
  try {
    const recetaRef = ref(database, `${RECETAS_REF}/${id}`);
    const snapshot = await get(recetaRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.key,
      ...snapshot.val()
    };
  } catch (error) {
    console.error('Error al obtener receta:', error);
    throw error;
  }
}

// Eliminar una receta
export async function eliminarReceta(id) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Usuario no autenticado');

    const recetaRef = ref(database, `${RECETAS_REF}/${id}`);
    const snapshot = await get(recetaRef);
    
    if (!snapshot.exists()) throw new Error('Receta no encontrada');
    
    const receta = snapshot.val();
    if (receta.autor !== usuario.email) {
      throw new Error('No tienes permiso para eliminar esta receta');
    }

    await remove(recetaRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    throw error;
  }
}

// Actualizar una receta
export async function actualizarReceta(id, datos) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Usuario no autenticado');

    const recetaRef = ref(database, `${RECETAS_REF}/${id}`);
    const snapshot = await get(recetaRef);
    
    if (!snapshot.exists()) throw new Error('Receta no encontrada');
    
    const receta = snapshot.val();
    if (receta.autor !== usuario.email) {
      throw new Error('No tienes permiso para actualizar esta receta');
    }

    await update(recetaRef, {
      ...datos,
      fechaActualizacion: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    throw error;
  }
}

// Buscar recetas
export async function buscarRecetas(termino) {
  try {
    const recetas = await obtenerRecetas();
    const terminoLower = termino.toLowerCase();
    
    return recetas.filter(receta => 
      receta.titulo.toLowerCase().includes(terminoLower) ||
      receta.ingredientes.some(ing => ing.toLowerCase().includes(terminoLower)) ||
      receta.categoria.toLowerCase().includes(terminoLower)
    );
  } catch (error) {
    console.error('Error al buscar recetas:', error);
    throw error;
  }
}

// Filtrar recetas por categoría
export async function filtrarRecetasPorCategoria(categoria) {
  try {
    const recetasRef = ref(database, RECETAS_REF);
    const categoriaQuery = query(recetasRef, orderByChild('categoria'), equalTo(categoria));
    const snapshot = await get(categoriaQuery);
    
    if (!snapshot.exists()) return [];
    
    const recetas = [];
    snapshot.forEach((childSnapshot) => {
      recetas.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return recetas.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
  } catch (error) {
    console.error('Error al filtrar recetas:', error);
    throw error;
  }
}

// Agregar un comentario
export async function agregarComentario(recetaId, comentario) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Usuario no autenticado');

    const comentarioRef = ref(database, `${COMENTARIOS_REF}/${recetaId}/${Date.now()}`);
    const recetaRef = ref(database, `${RECETAS_REF}/${recetaId}`);
    
    const nuevoComentario = {
      texto: comentario,
      autor: usuario.email,
      fecha: Date.now()
    };

    await set(comentarioRef, nuevoComentario);
    
    // Actualizar contador de comentarios
    const snapshot = await get(recetaRef);
    if (snapshot.exists()) {
      const receta = snapshot.val();
      await update(recetaRef, {
        comentarios: (receta.comentarios || 0) + 1
      });
    }

    return true;
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    throw error;
  }
}

// Obtener comentarios de una receta
export async function obtenerComentarios(recetaId) {
  try {
    const comentariosRef = ref(database, `${COMENTARIOS_REF}/${recetaId}`);
    const snapshot = await get(comentariosRef);
    
    if (!snapshot.exists()) return [];
    
    const comentarios = [];
    snapshot.forEach((childSnapshot) => {
      comentarios.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return comentarios.sort((a, b) => b.fecha - a.fecha);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    throw error;
  }
}

// Dar like a una receta
export async function darLike(recetaId) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Usuario no autenticado');

    const recetaRef = ref(database, `${RECETAS_REF}/${recetaId}`);
    const snapshot = await get(recetaRef);
    
    if (!snapshot.exists()) throw new Error('Receta no encontrada');
    
    const receta = snapshot.val();
    await update(recetaRef, {
      likes: (receta.likes || 0) + 1
    });

    return true;
  } catch (error) {
    console.error('Error al dar like:', error);
    throw error;
  }
} 