import Chart from 'chart.js/auto';
import { cargarRecetasDelUsuario } from './recetas.js';

export function inicializarEstadisticas() {
  const contenedor = document.createElement('div');
  contenedor.className = 'estadisticas-container';
  contenedor.innerHTML = `
    <h2>Estadísticas de Mis Recetas</h2>
    <div class="graficas">
      <div class="grafica-container">
        <h3>Ingredientes más usados</h3>
        <canvas id="grafica-ingredientes"></canvas>
      </div>
      <div class="grafica-container">
        <h3>Recetas por categoría</h3>
        <canvas id="grafica-categorias"></canvas>
      </div>
    </div>
  `;
  
  document.querySelector('.container').appendChild(contenedor);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .estadisticas-container {
      margin: 2rem 0;
      padding: 2rem;
      background: var(--color-fondo-secundario);
      border-radius: 8px;
    }
    
    .graficas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .grafica-container {
      background: var(--color-fondo);
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .grafica-container h3 {
      margin: 0 0 1rem;
      color: var(--color-texto);
      text-align: center;
    }
  `;
  document.head.appendChild(style);
  
  // Generate charts
  generarGraficaIngredientes();
  generarGraficaCategorias();
}

function generarGraficaIngredientes() {
  const recetas = cargarRecetasDelUsuario();
  const ingredientes = {};
  
  recetas.forEach(receta => {
    receta.ingredientes.forEach(ing => {
      const normalizado = ing.toLowerCase().trim();
      ingredientes[normalizado] = (ingredientes[normalizado] || 0) + 1;
    });
  });
  
  const top10 = Object.entries(ingredientes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  new Chart(document.getElementById('grafica-ingredientes'), {
    type: 'bar',
    data: {
      labels: top10.map(([ing]) => ing),
      datasets: [{
        label: 'Frecuencia de uso',
        data: top10.map(([,count]) => count),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function generarGraficaCategorias() {
  const recetas = cargarRecetasDelUsuario();
  const categorias = {};
  
  recetas.forEach(receta => {
    categorias[receta.categoria] = (categorias[receta.categoria] || 0) + 1;
  });
  
  new Chart(document.getElementById('grafica-categorias'), {
    type: 'pie',
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: [
          'rgba(76, 175, 80, 0.6)',
          'rgba(33, 150, 243, 0.6)',
          'rgba(255, 152, 0, 0.6)',
          'rgba(156, 39, 176, 0.6)',
          'rgba(244, 67, 54, 0.6)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(255, 152, 0, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(244, 67, 54, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
} 