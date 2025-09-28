
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBGz9FgyAV1HXp_QKWXUW2luA3LOkIIWsc",
  authDomain: "voxie1-e3939.firebaseapp.com",
  projectId: "voxie1-e3939",
  storageBucket: "voxie1-e3939.firebasestorage.app",
  messagingSenderId: "721846409411",
  appId: "1:721846409411:web:c07fbb593825c00ca32a76"
};

console.log("Firebase config loaded:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + "..."
});


let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  throw error;
}

export const auth = getAuth(app);
console.log("✅ Firebase Auth initialized");

export const db = getFirestore(app);
console.log("✅ Firebase Firestore initialized");

export default app;