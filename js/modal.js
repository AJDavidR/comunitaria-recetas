export class Modal {
  constructor() {
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = `
      <div class="modal-content">
        <h3 class="modal-title"></h3>
        <p class="modal-message"></p>
        <div class="modal-buttons">
          <button class="btn btn-cancel">Cancelar</button>
          <button class="btn btn-confirm">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
      }
      
      .modal.active {
        display: flex;
      }
      
      .modal-content {
        background: var(--color-fondo);
        padding: 2rem;
        border-radius: 8px;
        max-width: 90%;
        width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .modal-title {
        margin: 0 0 1rem;
        color: var(--color-texto);
      }
      
      .modal-message {
        margin: 0 0 1.5rem;
        color: var(--color-texto-secundario);
      }
      
      .modal-buttons {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
      
      .btn-cancel {
        background: var(--color-gris-claro);
      }
      
      .btn-confirm {
        background: var(--color-primario);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
  
  async confirm(message, title = 'Confirmar') {
    return new Promise(resolve => {
      this.modal.querySelector('.modal-title').textContent = title;
      this.modal.querySelector('.modal-message').textContent = message;
      this.modal.classList.add('active');
      
      const handleClose = (result) => {
        this.modal.classList.remove('active');
        this.modal.querySelector('.btn-cancel').onclick = null;
        this.modal.querySelector('.btn-confirm').onclick = null;
        resolve(result);
      };
      
      this.modal.querySelector('.btn-cancel').onclick = () => handleClose(false);
      this.modal.querySelector('.btn-confirm').onclick = () => handleClose(true);
    });
  }
  
  async alert(message, title = 'Aviso') {
    this.modal.querySelector('.modal-buttons').innerHTML = `
      <button class="btn btn-confirm">Aceptar</button>
    `;
    
    return new Promise(resolve => {
      this.modal.querySelector('.modal-title').textContent = title;
      this.modal.querySelector('.modal-message').textContent = message;
      this.modal.classList.add('active');
      
      this.modal.querySelector('.btn-confirm').onclick = () => {
        this.modal.classList.remove('active');
        this.modal.querySelector('.modal-buttons').innerHTML = `
          <button class="btn btn-cancel">Cancelar</button>
          <button class="btn btn-confirm">Confirmar</button>
        `;
        resolve();
      };
    });
  }
}

// Create singleton instance
export const modal = new Modal(); 