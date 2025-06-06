document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('categorias-list');
  const recetas = await obtenerRecetas();

  // Normalizar y agrupar recetas por categoría
  const categorias = {};
  recetas.forEach(receta => {
    let categoria = receta.categoria?.trim().toLowerCase() || 'sin categoría';
    categoria = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    if (!categorias[categoria]) categorias[categoria] = [];
    categorias[categoria].push(receta);
  });

  // Colores para categorías
  const coloresCategoria = {
    Desayuno: '#F4B400',
    Almuerzo: '#0F9D58',
    Cena: '#4285F4',
    Postre: '#DB4437',
    Bebida: '#AB47BC',
    'Sin categoría': '#9E9E9E'
  };

  // Renderizar cada categoría
  Object.entries(categorias).forEach(([nombre, lista]) => {
    const seccion = document.createElement('section');
    seccion.classList.add('categoria-seccion');

    const recetasHTML = lista.map(r => {
      const etiquetasHTML = (r.etiquetas || [])
        .map(tag => `<span class="etiqueta">#${tag}</span>`)
        .join(' ');
      return `
        <article class="receta-card animada">
          <img src="${r.imagen}" alt="${r.titulo}" />
          <h4>${r.titulo}</h4>
          <p class="categoria-label">${r.categoria}</p>
          ${etiquetasHTML ? `<div class="etiquetas">${etiquetasHTML}</div>` : ''}
          <a class="btn" href="receta.html?id=${r.id}">Ver receta</a>
        </article>
      `;
    }).join('');

    seccion.innerHTML = `
      <h3 class="categoria-titulo">${nombre}</h3>
      <div class="recetas-grid">${recetasHTML}</div>
    `;

    contenedor.appendChild(seccion);
  });

  // Gráfico
  const nombresCategorias = Object.keys(categorias);
  const cantidades = nombresCategorias.map(c => categorias[c].length);
  const total = cantidades.reduce((a, b) => a + b, 0);
  const porcentajes = cantidades.map(c => ((c / total) * 100).toFixed(1));
  const colores = nombresCategorias.map(cat => coloresCategoria[cat] || '#ccc');

  const ctx = document.getElementById('graficoCategorias').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: nombresCategorias,
      datasets: [{
        label: 'Recetas por categoría',
        data: cantidades,
        backgroundColor: colores,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 800,
        easing: 'easeOutElastic'
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Distribución de Recetas por Categoría',
          color: getComputedStyle(document.body).getPropertyValue('--color-texto').trim(),
          font: {
            size: 18
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const cant = context.raw;
              const percent = porcentajes[context.dataIndex];
              return `${cant} receta(s) - ${percent}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Cantidad' }
        },
        x: {
          title: { display: true, text: 'Categorías' }
        }
      }
    }
  });
});
