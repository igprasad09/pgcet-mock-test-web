// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaAJ7AiY4jP073H35aN3z_QiM-eSCZrxY",
  authDomain: "friends-loc.firebaseapp.com",
  projectId: "friends-loc",
  storageBucket: "friends-loc.firebasestorage.app",
  messagingSenderId: "1099147090764",
  appId: "1:1099147090764:web:4b7c632f53edf667994de9",
  measurementId: "G-WG8BWNMKFX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();