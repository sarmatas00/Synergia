// This code initializes a connection to a Firebase Realtime Database using the Firebase SDK.
//The Firebase configuration object includes credentials for the app, such as the API key, project ID, and storage bucket.
//The resulting database reference is exported for use in other modules, allowing other parts of the application to read and write data to the database.

const initializeApp=require('firebase/app').initializeApp;
const getDatabase=require('firebase/database').getDatabase;
// Define the Firebase configuration object with API key and other credentials
const firebaseConfig = {
  apiKey: "AIzaSyCaQ5BtpS2q_ocM3vQXKdeSFoRmQXq7pDg",
  authDomain: "synergia-883e5.firebaseapp.com",
  projectId: "synergia-883e5",
  storageBucket: "synergia-883e5.appspot.com",
  messagingSenderId: "200095970158",
  appId: "1:200095970158:web:02845fb24fa0fcfcbf877f",
  measurementId: "G-8YD5MZ5Y4Q"
};


// Initialize the Firebase app using the configuration object
const app = initializeApp(firebaseConfig);
// Get a reference to the Firebase database with the specified URL
const db=getDatabase(app,"https://synergia-883e5-default-rtdb.europe-west1.firebasedatabase.app");
module.exports=db;