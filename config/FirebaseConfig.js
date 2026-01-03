// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "app-9f890.firebaseapp.com",
  projectId: "app-9f890",
  storageBucket: "app-9f890.firebasestorage.app",
  messagingSenderId: "985474075998",
  appId: "1:985474075998:web:601b6f4442a959761c13cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)