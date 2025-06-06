document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('form-receta');
  const mensaje = document.getElementById('mensaje-exito');

  if (!formulario) return;

  // === Validaciones en vivo por campo ===
  formulario.querySelectorAll('input, textarea, select').forEach((campo) => {
    campo.addEventListener('blur', () => {
      if (!campo.value.trim()) {
        campo.style.borderColor = '#dc3545';
      } else {
        campo.style.borderColor = '';
      }
    });
  });

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const imagen = document.getElementById('imagen').value.trim();
    const categoria = document.getElementById('categoria').value;
    const ingredientes = document.getElementById('ingredientes').value.trim().split('\n').filter(l => l);
    const preparacion = document.getElementById('preparacion').value.trim().split('\n').filter(l => l);

    // === Validaciones ===
    if (titulo.length < 3) {
      alert('El título debe tener al menos 3 caracteres.');
      return;
    }

    if (!categoria) {
      alert('Por favor, selecciona una categoría.');
      return;
    }

    if (ingredientes.length === 0 || preparacion.length === 0) {
      alert('Debes agregar al menos un ingrediente y un paso de preparación.');
      return;
    }

    if (imagen && !esURLValida(imagen)) {
      alert('La URL de la imagen no es válida.');
      return;
    }

    const recetas = await obtenerRecetas();
    const existe = recetas.some(r => r.titulo.toLowerCase() === titulo.toLowerCase());
    if (existe) {
      alert('Ya existe una receta con este título. Por favor usa otro nombre.');
      return;
    }

    // === Objeto receta ===
    const nuevaReceta = {
      titulo,
      imagen: imagen || 'https://via.placeholder.com/300x200?text=Sin+imagen',
      categoria,
      ingredientes,
      preparacion
    };

    await guardarRecetaUsuario(nuevaReceta);

    formulario.reset();
    mostrarMensajeExito(mensaje);
  });
});

// === Funciones auxiliares ===
function esURLValida(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function mostrarMensajeExito(mensaje) {
  mensaje.style.display = 'block';
  mensaje.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    mensaje.style.display = 'none';
  }, 3000);
}
