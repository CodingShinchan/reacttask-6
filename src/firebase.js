import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6_-XkSmD_GHw8OgymS8lmGCpeVvBuu3Q",
  authDomain: "react6-1c7d0.firebaseapp.com",
  databaseURL: "https://react6-1c7d0-default-rtdb.firebaseio.com",
  projectId: "react6-1c7d0",
  storageBucket: "react6-1c7d0.appspot.com",
  messagingSenderId: "962791756043",
  appId: "1:962791756043:web:ec5d5ff359b9fa1732120e",
  measurementId: "G-WHV1S289Y5"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
