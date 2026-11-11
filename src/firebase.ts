import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyATQ0iySMcc3JeOU33JqHHzIWhS9PpbQgo",
  authDomain: "nochedelosmuseosevento.firebaseapp.com",
  projectId: "nochedelosmuseosevento",
  storageBucket: "nochedelosmuseosevento.firebasestorage.app",
  messagingSenderId: "509733810510",
  appId: "1:509733810510:web:14627110fca842bf67ee1f",
  measurementId: "G-BWQPTQ83PG",
};

export const ADMIN_EMAIL = "admin@nochedelosmuseos.com";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

isSupported()
  .then((soportado) => {
    if (soportado) getAnalytics(app);
  })
  .catch(() => {});
