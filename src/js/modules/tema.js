import { guardarTema, obtenerTema } from './local-storage.js';

// Aplicar tema al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el tema guardado o usar el preferido por el sistema
  const temaGuardado = obtenerTema();
  const temaPreferido = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const temaOscuro = temaGuardado !== null ? temaGuardado : temaPreferido;
  
  // Aplicar el tema inicial
  aplicarTema(temaOscuro);
  
  // Configurar botón de tema
  const botonTema = document.getElementById('toggle-tema');
  if (botonTema) {
    botonTema.addEventListener('click', () => {
      const temaActual = document.body.classList.contains('tema-oscuro');
      const nuevoTema = !temaActual;
      aplicarTema(nuevoTema);
      guardarTema(nuevoTema);
    });
  }

  // Escuchar cambios en las preferencias del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (obtenerTema() === null) { // Solo cambiar si el usuario no ha establecido una preferencia
      aplicarTema(e.matches);
    }
  });
});

// Función para aplicar el tema
export function aplicarTema(temaOscuro) {
  if (temaOscuro) {
    document.body.classList.add('tema-oscuro');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.body.classList.remove('tema-oscuro');
    document.documentElement.style.colorScheme = 'light';
  }
  
  // Actualizar ícono del botón
  const botonTema = document.getElementById('toggle-tema');
  if (botonTema) {
    botonTema.textContent = temaOscuro ? '☀️ Cambiar tema' : '🌓 Cambiar tema';
    botonTema.setAttribute('aria-label', temaOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }
  
  // Actualizar meta theme-color para móviles
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', temaOscuro ? '#121212' : '#4CAF50');
  }
  
  // Actualizar colores del gráfico si existe
  const grafico = document.getElementById('graficoCategorias');
  if (grafico && grafico.chart) {
    const colorTexto = getComputedStyle(document.body).getPropertyValue('--color-texto').trim();
    grafico.chart.options.plugins.title.color = colorTexto;
    grafico.chart.update();
  }
} 