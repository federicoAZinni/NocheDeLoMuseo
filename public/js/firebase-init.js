import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATQ0iySMcc3JeOU33JqHHzIWhS9PpbQgo",
  authDomain: "nochedelosmuseosevento.firebaseapp.com",
  projectId: "nochedelosmuseosevento",
  storageBucket: "nochedelosmuseosevento.firebasestorage.app",
  messagingSenderId: "509733810510",
  appId: "1:509733810510:web:14627110fca842bf67ee1f",
  measurementId: "G-BWQPTQ83PG"
};

// Tiene que ser el mismo email que figura en firestore.rules
export const ADMIN_EMAIL = "admin@nochedelosmuseos.com";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics es opcional: si un bloqueador lo frena, la app sigue funcionando
import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js")
  .then(async (m) => { if (await m.isSupported()) m.getAnalytics(app); })
  .catch(() => {});
