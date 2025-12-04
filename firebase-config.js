// Firebase Configuration
// Your Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyBJh--rMQon2Z9b2X5CmCuLJ3HM81UkLd0",
  authDomain: "zwift-f9d02.firebaseapp.com",
  databaseURL: "https://zwift-f9d02-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zwift-f9d02",
  storageBucket: "zwift-f9d02.firebasestorage.app",
  messagingSenderId: "1016587739358",
  appId: "1:1016587739358:web:202f7a950a8f408696e24f",
  measurementId: "G-2LW76SW2NP"
};

// Global variables for Firebase (accessible from app.js)
var firebaseApp = null;
var database = null;
var firebaseEnabled = false;

// Check if Firebase SDK is loaded and config is valid
if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseEnabled = true;
        console.log('✅ Firebase connected - data will be shared across all users');
    } catch (error) {
        console.warn('⚠️ Firebase initialization failed, using localStorage:', error);
        firebaseEnabled = false;
    }
} else {
    if (typeof firebase === 'undefined') {
        console.log('ℹ️ Firebase SDK not loaded - using localStorage (data is local to each browser)');
    } else {
        console.log('ℹ️ Firebase not configured - using localStorage (data is local to each browser)');
        console.log('   To enable shared data, see FIREBASE_SETUP.md');
    }
    firebaseEnabled = false;
}
