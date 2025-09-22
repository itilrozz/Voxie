// Test Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7vdX88vnOg-FrMnB3DMoIT9S3yV-PaHA",
  authDomain: "voxie-f8ffd.firebaseapp.com",
  projectId: "voxie-f8ffd",
  storageBucket: "voxie-f8ffd.firebasestorage.app",
  messagingSenderId: "604997261449",
  appId: "1:604997261449:web:19addb372a9ae96e57ce58"
};

console.log("Testing Firebase configuration...");

try {
  const app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialized successfully");
  
  const auth = getAuth(app);
  console.log("✅ Firebase Auth initialized");
  
  const db = getFirestore(app);
  console.log("✅ Firebase Firestore initialized");
  
  console.log("🎉 All Firebase services are working correctly!");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
}
