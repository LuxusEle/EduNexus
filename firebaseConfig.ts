// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBM3G6VWgrtoHcgV1DFSFJVKBIf0uRlSQQ",
  authDomain: "class-2d5f5.firebaseapp.com",
  projectId: "class-2d5f5",
  storageBucket: "class-2d5f5.firebasestorage.app",
  messagingSenderId: "820518827956",
  appId: "1:820518827956:web:5b292c5054637a397624e1",
  measurementId: "G-644640FXE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
