// Archivo dummy para evitar errores 404 en desarrollo local

import { modal } from './modal.js';
import { cargarRecetasDelUsuario, guardarRecetaUsuario } from './recetas.js';

export async function exportarRecetasUsuario() {
  try {
    const recetas = cargarRecetasDelUsuario();
    if (recetas.length === 0) {
      await modal.alert('No tienes recetas para exportar.');
      return;
    }

    const blob = new Blob([JSON.stringify(recetas, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis-recetas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    await modal.alert('Recetas exportadas correctamente.');
  } catch (error) {
    console.error('Error al exportar:', error);
    await modal.alert('Error al exportar las recetas.');
  }
}

export async function importarRecetas(archivo) {
  try {
    if (!archivo) {
      throw new Error('No se seleccionó ningún archivo');
    }

    const texto = await archivo.text();
    const recetas = JSON.parse(texto);
    
    // Validate structure
    if (!Array.isArray(recetas)) {
      throw new Error('El archivo debe contener un array de recetas');
    }
    
    if (!recetas.every(r => r.titulo && Array.isArray(r.ingredientes) && Array.isArray(r.preparacion))) {
      throw new Error('Algunas recetas no tienen la estructura correcta');
    }
    
    // Merge with existing recipes
    const existentes = cargarRecetasDelUsuario();
    const nuevas = recetas.filter(nueva => 
      !existentes.some(existente => 
        existente.titulo === nueva.titulo && 
        existente.autor === nueva.autor
      )
    );
    
    if (nuevas.length === 0) {
      await modal.alert('No hay recetas nuevas para importar.');
      return;
    }
    
    // Confirm import
    const confirmar = await modal.confirm(
      `Se importarán ${nuevas.length} recetas nuevas. ¿Deseas continuar?`,
      'Importar Recetas'
    );
    
    if (!confirmar) return;
    
    // Save new recipes
    nuevas.forEach(receta => guardarRecetaUsuario(receta));
    
    await modal.alert(
      `Importación completada:\n` +
      `- ${nuevas.length} recetas importadas\n` +
      `- ${recetas.length - nuevas.length} recetas duplicadas (omitidas)`
    );
    
    // Reload page to show new recipes
    location.reload();
    
  } catch (error) {
    console.error('Error al importar:', error);
    await modal.alert(`Error al importar: ${error.message}`);
  }
}

// Add import button to UI
export function agregarBotonesExportImport() {
  const contenedor = document.createElement('div');
  contenedor.className = 'botones-export-import';
  contenedor.innerHTML = `
    <button id="btn-exportar" class="btn">Exportar Mis Recetas</button>
    <label for="input-importar" class="btn">Importar Recetas</label>
    <input type="file" id="input-importar" accept=".json" style="display: none;">
  `;
  
  document.querySelector('.container').appendChild(contenedor);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .botones-export-import {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
      justify-content: center;
    }
    
    .botones-export-import .btn {
      background: var(--color-primario);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .botones-export-import .btn:hover {
      background: var(--color-primario-oscuro);
    }
  `;
  document.head.appendChild(style);
  
  // Add event listeners
  document.getElementById('btn-exportar').onclick = exportarRecetasUsuario;
  document.getElementById('input-importar').onchange = (e) => {
    if (e.target.files.length > 0) {
      importarRecetas(e.target.files[0]);
    }
  };
} 