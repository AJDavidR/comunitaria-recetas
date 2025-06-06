import { describe, it, expect, beforeEach } from 'vitest';
import { 
  cargarRecetasDelUsuario,
  guardarRecetaUsuario,
  eliminarRecetaUsuario,
  editarRecetaUsuario
} from '../js/recetas.js';

describe('Gestión de recetas', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('debe guardar y cargar recetas correctamente', () => {
    const receta = {
      titulo: 'Test Recipe',
      autor: 'Test Author',
      ingredientes: ['test ingredient'],
      preparacion: ['test step']
    };
    
    guardarRecetaUsuario(receta);
    const cargadas = cargarRecetasDelUsuario();
    
    expect(cargadas).toHaveLength(1);
    expect(cargadas[0].titulo).toBe('Test Recipe');
    expect(cargadas[0].id).toBeDefined();
  });
  
  it('debe eliminar recetas correctamente', () => {
    const receta = {
      titulo: 'Test Recipe',
      autor: 'Test Author',
      ingredientes: ['test'],
      preparacion: ['test']
    };
    
    guardarRecetaUsuario(receta);
    const cargadas = cargarRecetasDelUsuario();
    const id = cargadas[0].id;
    
    eliminarRecetaUsuario(id);
    const despues = cargarRecetasDelUsuario();
    
    expect(despues).toHaveLength(0);
  });
  
  it('debe editar recetas correctamente', () => {
    const receta = {
      titulo: 'Test Recipe',
      autor: 'Test Author',
      ingredientes: ['test'],
      preparacion: ['test']
    };
    
    guardarRecetaUsuario(receta);
    const cargadas = cargarRecetasDelUsuario();
    const id = cargadas[0].id;
    
    const actualizado = {
      titulo: 'Updated Recipe',
      ingredientes: ['updated']
    };
    
    const exito = editarRecetaUsuario(id, actualizado);
    expect(exito).toBe(true);
    
    const despues = cargarRecetasDelUsuario();
    expect(despues[0].titulo).toBe('Updated Recipe');
    expect(despues[0].ingredientes).toEqual(['updated']);
    expect(despues[0].autor).toBe('Test Author'); // Unchanged
  });
  
  it('debe manejar edición de receta inexistente', () => {
    const exito = editarRecetaUsuario(999, { titulo: 'Test' });
    expect(exito).toBe(false);
  });
  
  it('debe validar estructura de receta', () => {
    const recetaInvalida = {
      titulo: 'Test',
      // Missing required fields
    };
    
    expect(() => guardarRecetaUsuario(recetaInvalida)).toThrow();
  });
}); 