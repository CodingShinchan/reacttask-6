import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_geq5WWS2E8oj6piKUWbWtMYhClbO9nk",
  authDomain: "task-6-5b4a3.firebaseapp.com",
  projectId: "task-6-5b4a3",
  storageBucket: "task-6-5b4a3.appspot.com",
  messagingSenderId: "406316034459",
  appId: "1:406316034459:web:0cbc1b64bcd936f2b3593e",
  measurementId: "G-CD5NMP10HF",
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);