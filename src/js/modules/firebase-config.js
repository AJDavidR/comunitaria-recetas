// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

// Configuración de Firebase
const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Validar configuración
function validarConfiguracion() {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingKeys = requiredKeys.filter(key => !FIREBASE_CONFIG[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Configuración de Firebase incompleta. Faltan las siguientes claves: ${missingKeys.join(', ')}`
    );
  }

  // Validar formato de las claves
  if (!FIREBASE_CONFIG.apiKey.match(/^[A-Za-z0-9-_]+$/)) {
    throw new Error('API Key de Firebase inválida');
  }

  if (!FIREBASE_CONFIG.projectId.match(/^[a-z0-9-]+$/)) {
    throw new Error('Project ID de Firebase inválido');
  }

  if (!FIREBASE_CONFIG.authDomain.match(/^[a-z0-9-]+\.firebaseapp\.com$/)) {
    throw new Error('Auth Domain de Firebase inválido');
  }
}

// Inicializar Firebase con manejo de errores
export async function inicializarFirebase() {
  try {
    validarConfiguracion();
    
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const app = initializeApp(FIREBASE_CONFIG);
    
    // Verificar conexión
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    const auth = getAuth(app);
    
    // Esperar a que Firebase esté listo
    await new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(
        () => {
          unsubscribe();
          resolve();
        },
        error => {
          unsubscribe();
          reject(error);
        }
      );
    });

    return { app, auth };
  } catch (error) {
    console.error('Error al inicializar Firebase:', error);
    throw new Error('No se pudo inicializar Firebase. Por favor, verifica tu conexión e intenta nuevamente.');
  }
}

// Exportar configuración
export { FIREBASE_CONFIG };

// Inicializar App Check
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('TU_RECAPTCHA_SITE_KEY'), // Reemplaza con tu Site Key
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getFirestore(app);

// Inicializar Realtime Database
const database = getDatabase(app);

// Inicializar Analytics (opcional)
const analytics = getAnalytics(app);

// Export collections references
export const recipesCollection = collection(db, 'recipes');
export const commentsCollection = collection(db, 'comments');
export const favoritesCollection = collection(db, 'favorites');

export { app, database, analytics }; 