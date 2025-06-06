// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqCH5YFjNNqVoYgpZ5GGV2l4j4UStFm1Q",
  authDomain: "cocina-comunitaria-44b85.firebaseapp.com",
  databaseURL: "https://cocina-comunitaria-44b85-default-rtdb.firebaseio.com",
  projectId: "cocina-comunitaria-44b85",
  storageBucket: "cocina-comunitaria-44b85.firebasestorage.app",
  messagingSenderId: "702658558268",
  appId: "1:702658558268:web:63455521826502d3cf0639",
  measurementId: "G-NH87ZWLT01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar App Check
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('TU_RECAPTCHA_SITE_KEY'), // Reemplaza con tu Site Key
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getFirestore(app);
export const auth = getAuth(app);

// Inicializar Realtime Database
const database = getDatabase(app);

// Inicializar Analytics (opcional)
const analytics = getAnalytics(app);

// Export collections references
export const recipesCollection = collection(db, 'recipes');
export const commentsCollection = collection(db, 'comments');
export const favoritesCollection = collection(db, 'favorites');

export { app, database, analytics }; 