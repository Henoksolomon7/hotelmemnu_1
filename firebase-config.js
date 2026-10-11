/* ============================================================
   🔥 FIREBASE CONFIGURATION
   ------------------------------------------------------------
   This app uses Firebase Realtime Database as its cloud database.

   HOW TO CONNECT YOUR OWN FIREBASE PROJECT:
   1. Go to https://console.firebase.google.com  →  Create a project
   2. In your project: Build → Realtime Database → Create Database
   3. Project Settings (gear icon) → General → Your apps → Web
      Copy the `firebaseConfig` values into FIREBASE_CONFIG below.
   4. Set the Realtime Database SECURITY RULES (from the README)
      so customers can read data and create orders, while only
      the admin can change menu / categories / tables / settings.

   Until you paste real values, the app runs in localStorage mode
   so everything still works offline.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAhrwkUnyBN-iHzb5NJFH6jYZf11Etnnqo",
  authDomain: "royal-hotel-menu.firebaseapp.com",
  databaseURL: "https://royal-hotel-menu-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "royal-hotel-menu",
  storageBucket: "royal-hotel-menu.firebasestorage.app",
  messagingSenderId: "879194382365",
  appId: "1:879194382365:web:7d1e2f21059ca9325e26f4"
};

/* Set to false to force localStorage mode (no network calls at all). */
const USE_FIREBASE = true;

/* Root path where all hotel data is stored inside your database. */
const FIREBASE_DB_PATH = 'hotel-menu';

/* Returns true when a real Firebase config has been pasted above. */
function isFirebaseConfigured() {
    return !!(
        USE_FIREBASE &&
        typeof window !== 'undefined' &&
        typeof firebase !== 'undefined' &&
        FIREBASE_CONFIG &&
        FIREBASE_CONFIG.apiKey &&
        !FIREBASE_CONFIG.apiKey.startsWith('YOUR_') &&
        FIREBASE_CONFIG.databaseURL &&
        !FIREBASE_CONFIG.databaseURL.startsWith('YOUR_')
    );
}