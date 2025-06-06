import { modal } from './modal.js';

export function inicializarCompartir() {
  // Add share button to recipe detail
  const botonCompartir = document.createElement('button');
  botonCompartir.className = 'btn-compartir';
  botonCompartir.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
    </svg>
    Compartir
  `;
  
  const contenedor = document.querySelector('.receta-titulo').parentElement;
  contenedor.appendChild(botonCompartir);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .btn-compartir {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primario);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      margin-left: 1rem;
    }
    
    .btn-compartir:hover {
      background: var(--color-primario-oscuro);
    }
    
    .btn-compartir svg {
      width: 20px;
      height: 20px;
    }
    
    .opciones-compartir {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .opcion-compartir {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      background: var(--color-fondo-secundario);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .opcion-compartir:hover {
      background: var(--color-fondo-terciario);
    }
    
    .opcion-compartir svg {
      width: 32px;
      height: 32px;
    }
  `;
  document.head.appendChild(style);
  
  // Add click handler
  botonCompartir.onclick = () => mostrarOpcionesCompartir();
}

async function mostrarOpcionesCompartir() {
  const recetaId = new URLSearchParams(window.location.search).get('id');
  if (!recetaId) return;
  
  const link = generarLinkCompartir(recetaId);
  const receta = document.querySelector('.receta-titulo').textContent;
  
  const contenido = `
    <div class="opciones-compartir">
      <button class="opcion-compartir" data-action="whatsapp">
        <svg viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>
      
      <button class="opcion-compartir" data-action="facebook">
        <svg viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>
      
      <button class="opcion-compartir" data-action="twitter">
        <svg viewBox="0 0 24 24" fill="#1DA1F2">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        Twitter
      </button>
      
      <button class="opcion-compartir" data-action="copy">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copiar Link
      </button>
    </div>
  `;
  
  const confirmar = await modal.confirm(contenido, 'Compartir Receta');
  if (!confirmar) return;
  
  const accion = document.activeElement?.dataset?.action;
  if (!accion) return;
  
  const texto = `¡Mira esta deliciosa receta de ${receta} en Cocina Comunitaria!`;
  
  switch (accion) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + link)}`);
      break;
      
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
      break;
      
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(link)}`);
      break;
      
    case 'copy':
      await navigator.clipboard.writeText(link);
      await modal.alert('Link copiado al portapapeles');
      break;
  }
}

function generarLinkCompartir(recetaId) {
  const url = new URL(window.location.href);
  url.searchParams.set('id', recetaId);
  return url.toString();
} 