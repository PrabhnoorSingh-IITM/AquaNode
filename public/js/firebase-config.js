// Your actual web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXps3XjSl957YdQXoD7dgrb-6Qtg0b7zY",
  authDomain: "aquanode-b6126.firebaseapp.com",
  databaseURL: "https://aquanode-b6126-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aquanode-b6126",
  storageBucket: "aquanode-b6126.firebasestorage.app",
  messagingSenderId: "753943260325",
  appId: "1:753943260325:web:87d81b34496bd0559ab14c",
  measurementId: "G-R2XQXMQY75"
};

// Initialize Firebase using the Compat API (matching dashboard.html setup)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized with project: " + firebaseConfig.projectId);
} else {
    console.error("Firebase library not found. Check your script tags in dashboard.html");
}
