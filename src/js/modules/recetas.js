import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { inicializarFirebase } from './firebase-config.js';
import { obtenerUsuarioActual } from './auth.js';
import { mostrarModal } from './modal.js';
import { recetasSistema } from '../data/recetas.js';

// Constantes de configuración
const CONFIG = {
  MAX_RECETAS_POR_PAGINA: 12,
  MAX_TITULO_LENGTH: 100,
  MIN_TITULO_LENGTH: 3,
  MAX_DESCRIPCION_LENGTH: 500,
  MIN_DESCRIPCION_LENGTH: 10,
  MAX_INGREDIENTES: 30,
  MIN_INGREDIENTES: 1,
  MAX_PASOS: 20,
  MIN_PASOS: 1,
  MAX_PASO_LENGTH: 500,
  MIN_PASO_LENGTH: 10,
  MAX_COMENTARIO_LENGTH: 300,
  MIN_COMENTARIO_LENGTH: 3,
  MAX_IMAGEN_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGEN_DIMENSION: 2000, // 2000px
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  DEBOUNCE_DELAY: 300, // 300ms
  CATEGORIAS: [
    'Desayuno',
    'Almuerzo',
    'Cena',
    'Postre',
    'Snack',
    'Bebida',
    'Vegetariano',
    'Vegano',
    'Sin Gluten',
    'Sin Lactosa',
    'Bajo en Calorías',
    'Alta Proteína'
  ],
  MAX_CATEGORIAS: 5,
  MIN_CATEGORIAS: 1,
  ERROR_MESSAGES: {
    NO_AUTH: 'Debes iniciar sesión para realizar esta acción',
    NO_PERMISSION: 'No tienes permiso para realizar esta acción',
    NOT_FOUND: 'La receta no existe',
    INVALID_DATA: 'Los datos proporcionados no son válidos',
    NETWORK_ERROR: 'Error de conexión. Por favor, intenta nuevamente',
    STORAGE_ERROR: 'Error al procesar la imagen. Por favor, intenta con otra',
    SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde'
  }
};

// Estado de la aplicación
let db = null;
let storage = null;
let ultimaRecetaCargada = null;
let cargandoRecetas = false;
let cacheRecetas = new Map();
let cacheTimeout = null;

// Inicializar Firebase
async function inicializarFirestore() {
  try {
    const { db: firestore, storage: firebaseStorage } = await inicializarFirebase();
    db = firestore;
    storage = firebaseStorage;
    return { db, storage };
  } catch (error) {
    console.error('Error al inicializar Firestore:', error);
    throw new Error('No se pudo inicializar la base de datos');
  }
}

// Utilidades
function sanitizarTexto(texto) {
  return texto
    .trim()
    .replace(/[<>]/g, '') // Eliminar caracteres HTML
    .replace(/\s+/g, ' '); // Normalizar espacios
}

function validarImagen(archivo) {
  if (!archivo) {
    throw new Error('La imagen es requerida');
  }
  
  if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(archivo.type)) {
    throw new Error('Tipo de imagen no válido. Solo se permiten JPG, PNG y WebP');
  }
  
  if (archivo.size > CONFIG.MAX_IMAGEN_SIZE) {
    throw new Error(`La imagen no puede ser mayor a ${CONFIG.MAX_IMAGEN_SIZE / 1024 / 1024}MB`);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > CONFIG.MAX_IMAGEN_DIMENSION || img.height > CONFIG.MAX_IMAGEN_DIMENSION) {
        reject(new Error(`La imagen no puede ser mayor a ${CONFIG.MAX_IMAGEN_DIMENSION}x${CONFIG.MAX_IMAGEN_DIMENSION}px`));
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(archivo);
  });
}

async function optimizarImagen(archivo) {
  const img = await validarImagen(archivo);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Calcular dimensiones manteniendo proporción
  let width = img.width;
  let height = img.height;
  if (width > height && width > CONFIG.MAX_IMAGEN_DIMENSION) {
    height = (height * CONFIG.MAX_IMAGEN_DIMENSION) / width;
    width = CONFIG.MAX_IMAGEN_DIMENSION;
  } else if (height > CONFIG.MAX_IMAGEN_DIMENSION) {
    width = (width * CONFIG.MAX_IMAGEN_DIMENSION) / height;
    height = CONFIG.MAX_IMAGEN_DIMENSION;
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convertir a WebP si es posible
  const formato = archivo.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const calidad = 0.8;
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], archivo.name.replace(/\.[^/.]+$/, `.${formato.split('/')[1]}`), {
        type: formato
      }));
    }, formato, calidad);
  });
}

function validarReceta(receta) {
  const errores = [];
  
  // Validar título
  const titulo = sanitizarTexto(receta.titulo);
  if (!titulo || titulo.length < CONFIG.MIN_TITULO_LENGTH) {
    errores.push(`El título debe tener al menos ${CONFIG.MIN_TITULO_LENGTH} caracteres`);
  } else if (titulo.length > CONFIG.MAX_TITULO_LENGTH) {
    errores.push(`El título no puede tener más de ${CONFIG.MAX_TITULO_LENGTH} caracteres`);
  }
  
  // Validar descripción
  const descripcion = sanitizarTexto(receta.descripcion);
  if (!descripcion || descripcion.length < CONFIG.MIN_DESCRIPCION_LENGTH) {
    errores.push(`La descripción debe tener al menos ${CONFIG.MIN_DESCRIPCION_LENGTH} caracteres`);
  } else if (descripcion.length > CONFIG.MAX_DESCRIPCION_LENGTH) {
    errores.push(`La descripción no puede tener más de ${CONFIG.MAX_DESCRIPCION_LENGTH} caracteres`);
  }
  
  // Validar ingredientes
  if (!Array.isArray(receta.ingredientes) || receta.ingredientes.length < CONFIG.MIN_INGREDIENTES) {
    errores.push(`Debes agregar al menos ${CONFIG.MIN_INGREDIENTES} ingrediente`);
  } else if (receta.ingredientes.length > CONFIG.MAX_INGREDIENTES) {
    errores.push(`No puedes agregar más de ${CONFIG.MAX_INGREDIENTES} ingredientes`);
  } else {
    receta.ingredientes = receta.ingredientes.map(i => sanitizarTexto(i)).filter(Boolean);
    if (receta.ingredientes.length < CONFIG.MIN_INGREDIENTES) {
      errores.push('Hay ingredientes inválidos');
    }
  }
  
  // Validar pasos
  if (!Array.isArray(receta.pasos) || receta.pasos.length < CONFIG.MIN_PASOS) {
    errores.push(`Debes agregar al menos ${CONFIG.MIN_PASOS} paso`);
  } else if (receta.pasos.length > CONFIG.MAX_PASOS) {
    errores.push(`No puedes agregar más de ${CONFIG.MAX_PASOS} pasos`);
  } else {
    receta.pasos = receta.pasos.map(p => sanitizarTexto(p)).filter(Boolean);
    if (receta.pasos.length < CONFIG.MIN_PASOS) {
      errores.push('Hay pasos inválidos');
    }
    receta.pasos.forEach((paso, i) => {
      if (paso.length < CONFIG.MIN_PASO_LENGTH) {
        errores.push(`El paso ${i + 1} debe tener al menos ${CONFIG.MIN_PASO_LENGTH} caracteres`);
      } else if (paso.length > CONFIG.MAX_PASO_LENGTH) {
        errores.push(`El paso ${i + 1} no puede tener más de ${CONFIG.MAX_PASO_LENGTH} caracteres`);
      }
    });
  }
  
  // Validar categorías
  if (!Array.isArray(receta.categorias) || receta.categorias.length < CONFIG.MIN_CATEGORIAS) {
    errores.push(`Debes seleccionar al menos ${CONFIG.MIN_CATEGORIAS} categoría`);
  } else if (receta.categorias.length > CONFIG.MAX_CATEGORIAS) {
    errores.push(`No puedes seleccionar más de ${CONFIG.MAX_CATEGORIAS} categorías`);
  } else {
    receta.categorias = receta.categorias
      .map(c => sanitizarTexto(c))
      .filter(c => CONFIG.CATEGORIAS.includes(c));
    
    if (receta.categorias.length < CONFIG.MIN_CATEGORIAS) {
      errores.push('Hay categorías inválidas');
    }
  }
  
  if (errores.length > 0) {
    throw new Error(errores.join('\n'));
  }
  
  return {
    ...receta,
    titulo,
    descripcion,
    fechaCreacion: serverTimestamp(),
    fechaActualizacion: serverTimestamp()
  };
}

// Funciones de gestión de recetas
export async function guardarReceta(receta, imagen) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para guardar recetas');
    
    // Validar y sanitizar datos
    const recetaValidada = await validarReceta({
      ...receta,
      autorId: usuario.uid,
      autorNombre: usuario.displayName || usuario.email,
      likes: 0,
      comentarios: []
    });
    
    // Procesar imagen
    let urlImagen = null;
    if (imagen) {
      const imagenOptimizada = await optimizarImagen(imagen);
      const storageRef = ref(storage, `recetas/${usuario.uid}/${Date.now()}_${imagenOptimizada.name}`);
      await uploadBytes(storageRef, imagenOptimizada);
      urlImagen = await getDownloadURL(storageRef);
      recetaValidada.imagenUrl = urlImagen;
    }
    
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'recetas'), recetaValidada);
    
    // Actualizar cache
    cacheRecetas.set(docRef.id, { ...recetaValidada, id: docRef.id });
    
    await mostrarModal('¡Éxito!', 'La receta ha sido guardada correctamente');
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar receta:', error);
    await mostrarModal('Error', error.message);
    throw error;
  }
}

export async function obtenerRecetas(limite = CONFIG.MAX_RECETAS_POR_PAGINA, ultimaReceta = null, filtros = {}) {
  try {
    if (!db) await inicializarFirestore();
    if (cargandoRecetas) return [];
    
    cargandoRecetas = true;
    const usuario = await obtenerUsuarioActual();
    
    // Construir query base
    let q = query(
      collection(db, 'recetas'),
      orderBy('fechaCreacion', 'desc'),
      limit(limite)
    );
    
    // Aplicar filtros
    if (filtros.categorias?.length > 0) {
      q = query(q, where('categorias', 'array-contains-any', filtros.categorias));
    }
    
    if (filtros.autorId) {
      q = query(q, where('autorId', '==', filtros.autorId));
    }
    
    if (filtros.minLikes) {
      q = query(q, where('likes', '>=', filtros.minLikes));
    }
    
    if (ultimaReceta) {
      q = query(q, startAfter(ultimaReceta));
    }
    
    // Ejecutar query
    const snapshot = await getDocs(q);
    const recetas = [];
    
    snapshot.forEach(doc => {
      const receta = { id: doc.id, ...doc.data() };
      cacheRecetas.set(doc.id, receta);
      recetas.push(receta);
    });
    
    ultimaRecetaCargada = recetas[recetas.length - 1];
    
    // Limpiar cache después de un tiempo
    if (cacheTimeout) clearTimeout(cacheTimeout);
    cacheTimeout = setTimeout(() => {
      cacheRecetas.clear();
    }, CONFIG.CACHE_DURATION);
    
    // Recetas del usuario (localStorage o base de datos, según implementación actual)
    let recetasUsuario = [];
    try {
      recetasUsuario = JSON.parse(localStorage.getItem('recetasUsuario') || '[]');
    } catch (e) {
      recetasUsuario = [];
    }
    // Unir recetas del sistema y del usuario
    return {
      recetas: [...recetasUsuario, ...recetas],
      hayMas: recetas.length === limite,
      ultimaReceta: ultimaRecetaCargada
    };
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    if (error.code === 'permission-denied') {
      throw new Error(CONFIG.ERROR_MESSAGES.NO_PERMISSION);
    } else if (error.code === 'unavailable') {
      throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    }
  } finally {
    cargandoRecetas = false;
  }
}

export async function obtenerReceta(id) {
  try {
    if (!db) await inicializarFirestore();
    
    // Verificar cache
    if (cacheRecetas.has(id)) {
      return cacheRecetas.get(id);
    }
    
    const docRef = doc(db, 'recetas', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('La receta no existe');
    }
    
    const receta = { id: docSnap.id, ...docSnap.data() };
    cacheRecetas.set(id, receta);
    return receta;
  } catch (error) {
    console.error('Error al obtener receta:', error);
    throw error;
  }
}

export async function actualizarReceta(id, receta, imagen) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para actualizar recetas');
    
    // Verificar propiedad
    const recetaActual = await obtenerReceta(id);
    if (recetaActual.autorId !== usuario.uid) {
      throw new Error('No tienes permiso para actualizar esta receta');
    }
    
    // Validar y sanitizar datos
    const recetaValidada = await validarReceta({
      ...receta,
      fechaActualizacion: serverTimestamp()
    });
    
    // Procesar imagen si se proporciona una nueva
    if (imagen) {
      const imagenOptimizada = await optimizarImagen(imagen);
      const storageRef = ref(storage, `recetas/${usuario.uid}/${Date.now()}_${imagenOptimizada.name}`);
      
      // Eliminar imagen anterior si existe
      if (recetaActual.imagenUrl) {
        try {
          const oldImageRef = ref(storage, recetaActual.imagenUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('Error al eliminar imagen anterior:', error);
        }
      }
      
      await uploadBytes(storageRef, imagenOptimizada);
      recetaValidada.imagenUrl = await getDownloadURL(storageRef);
    }
    
    // Actualizar en Firestore
    const docRef = doc(db, 'recetas', id);
    await updateDoc(docRef, recetaValidada);
    
    // Actualizar cache
    cacheRecetas.set(id, { ...recetaValidada, id });
    
    await mostrarModal('¡Éxito!', 'La receta ha sido actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    await mostrarModal('Error', error.message);
    throw error;
  }
}

export async function eliminarReceta(id) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para eliminar recetas');
    
    // Verificar propiedad
    const receta = await obtenerReceta(id);
    if (receta.autorId !== usuario.uid) {
      throw new Error('No tienes permiso para eliminar esta receta');
    }
    
    // Eliminar imagen si existe
    if (receta.imagenUrl) {
      try {
        const imageRef = ref(storage, receta.imagenUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Error al eliminar imagen:', error);
      }
    }
    
    // Eliminar de Firestore
    const docRef = doc(db, 'recetas', id);
    await deleteDoc(docRef);
    
    // Actualizar cache
    cacheRecetas.delete(id);
    
    await mostrarModal('¡Éxito!', 'La receta ha sido eliminada correctamente');
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    await mostrarModal('Error', error.message);
    throw error;
  }
}

export async function darLike(id) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para dar like');
    
    const docRef = doc(db, 'recetas', id);
    const receta = await obtenerReceta(id);
    
    if (receta.likesUsuarios?.includes(usuario.uid)) {
      // Quitar like
      await updateDoc(docRef, {
        likes: increment(-1),
        likesUsuarios: arrayRemove(usuario.uid)
      });
      receta.likes--;
      receta.likesUsuarios = receta.likesUsuarios.filter(uid => uid !== usuario.uid);
    } else {
      // Dar like
      await updateDoc(docRef, {
        likes: increment(1),
        likesUsuarios: arrayUnion(usuario.uid)
      });
      receta.likes++;
      receta.likesUsuarios = [...(receta.likesUsuarios || []), usuario.uid];
    }
    
    // Actualizar cache
    cacheRecetas.set(id, receta);
    
    return receta;
  } catch (error) {
    console.error('Error al dar like:', error);
    throw error;
  }
}

export async function agregarComentario(id, comentario) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para comentar');
    
    // Validar comentario
    const texto = sanitizarTexto(comentario);
    if (!texto || texto.length < CONFIG.MIN_COMENTARIO_LENGTH) {
      throw new Error(`El comentario debe tener al menos ${CONFIG.MIN_COMENTARIO_LENGTH} caracteres`);
    }
    if (texto.length > CONFIG.MAX_COMENTARIO_LENGTH) {
      throw new Error(`El comentario no puede tener más de ${CONFIG.MAX_COMENTARIO_LENGTH} caracteres`);
    }
    
    const nuevoComentario = {
      id: Date.now().toString(),
      autorId: usuario.uid,
      autorNombre: usuario.displayName || usuario.email,
      texto,
      fecha: serverTimestamp()
    };
    
    const docRef = doc(db, 'recetas', id);
    await updateDoc(docRef, {
      comentarios: arrayUnion(nuevoComentario)
    });
    
    // Actualizar cache
    const receta = await obtenerReceta(id);
    receta.comentarios = [...(receta.comentarios || []), nuevoComentario];
    cacheRecetas.set(id, receta);
    
    return nuevoComentario;
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    throw error;
  }
}

export async function eliminarComentario(id, comentarioId) {
  try {
    if (!db) await inicializarFirestore();
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para eliminar comentarios');
    
    const receta = await obtenerReceta(id);
    const comentario = receta.comentarios?.find(c => c.id === comentarioId);
    
    if (!comentario) {
      throw new Error('El comentario no existe');
    }
    
    if (comentario.autorId !== usuario.uid) {
      throw new Error('No tienes permiso para eliminar este comentario');
    }
    
    const docRef = doc(db, 'recetas', id);
    await updateDoc(docRef, {
      comentarios: receta.comentarios.filter(c => c.id !== comentarioId)
    });
    
    // Actualizar cache
    receta.comentarios = receta.comentarios.filter(c => c.id !== comentarioId);
    cacheRecetas.set(id, receta);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    throw error;
  }
}

// Funciones de búsqueda y filtrado
let debounceTimeout = null;

export async function buscarRecetas(termino, filtros = {}) {
  try {
    if (!db) await inicializarFirestore();
    
    // Implementar debounce
    return new Promise((resolve) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      
      debounceTimeout = setTimeout(async () => {
        const terminoSanitizado = sanitizarTexto(termino).toLowerCase();
        if (!terminoSanitizado && !Object.keys(filtros).length) {
          resolve(await obtenerRecetas());
          return;
        }
        
        // Construir query base
        let q = query(
          collection(db, 'recetas'),
          orderBy('titulo'),
          limit(CONFIG.MAX_RECETAS_POR_PAGINA)
        );
        
        // Aplicar filtros de búsqueda
        if (terminoSanitizado) {
          q = query(
            q,
            where('titulo', '>=', terminoSanitizado),
            where('titulo', '<=', terminoSanitizado + '\uf8ff')
          );
        }
        
        // Aplicar otros filtros
        if (filtros.categorias?.length > 0) {
          q = query(q, where('categorias', 'array-contains-any', filtros.categorias));
        }
        
        if (filtros.autorId) {
          q = query(q, where('autorId', '==', filtros.autorId));
        }
        
        if (filtros.minLikes) {
          q = query(q, where('likes', '>=', filtros.minLikes));
        }
        
        const snapshot = await getDocs(q);
        const recetas = [];
        
        snapshot.forEach(doc => {
          const receta = { id: doc.id, ...doc.data() };
          cacheRecetas.set(doc.id, receta);
          recetas.push(receta);
        });
        
        resolve({
          recetas,
          hayMas: recetas.length === CONFIG.MAX_RECETAS_POR_PAGINA,
          ultimaReceta: recetas[recetas.length - 1]
        });
      }, CONFIG.DEBOUNCE_DELAY);
    });
  } catch (error) {
    console.error('Error al buscar recetas:', error);
    if (error.code === 'permission-denied') {
      throw new Error(CONFIG.ERROR_MESSAGES.NO_PERMISSION);
    } else if (error.code === 'unavailable') {
      throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    }
  }
}

export async function obtenerCategorias() {
  return CONFIG.CATEGORIAS;
}

export async function obtenerRecetasPorCategoria(categoria, limite = CONFIG.MAX_RECETAS_POR_PAGINA, ultimaReceta = null) {
  try {
    if (!db) await inicializarFirestore();
    if (!CONFIG.CATEGORIAS.includes(categoria)) {
      throw new Error('Categoría inválida');
    }
    
    let q = query(
      collection(db, 'recetas'),
      where('categorias', 'array-contains', categoria),
      orderBy('fechaCreacion', 'desc'),
      limit(limite)
    );
    
    if (ultimaReceta) {
      q = query(q, startAfter(ultimaReceta));
    }
    
    const snapshot = await getDocs(q);
    const recetas = [];
    
    snapshot.forEach(doc => {
      const receta = { id: doc.id, ...doc.data() };
      cacheRecetas.set(doc.id, receta);
      recetas.push(receta);
    });
    
    return {
      recetas,
      hayMas: recetas.length === limite,
      ultimaReceta: recetas[recetas.length - 1]
    };
  } catch (error) {
    console.error('Error al obtener recetas por categoría:', error);
    if (error.code === 'permission-denied') {
      throw new Error(CONFIG.ERROR_MESSAGES.NO_PERMISSION);
    } else if (error.code === 'unavailable') {
      throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    }
  }
}

// Inicialización
export async function inicializarRecetas() {
  try {
    await inicializarFirestore();
    return { db, storage };
  } catch (error) {
    console.error('Error al inicializar módulo de recetas:', error);
    throw error;
  }
}
