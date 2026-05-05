const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin (Optional: for backend overrides)
// This requires a serviceAccountKey.json if you want to use the admin SDK
/*
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
*/

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Emergency Override Endpoint
app.post('/api/override', (req, res) => {
    const { action } = req.body;
    
    // In a real scenario, you'd update Firebase here:
    // admin.database().ref('controls/valve').set(action === 'close' ? 0 : 1);
    
    console.log(`[EMERGENCY OVERRIDE] Action: ${action}`);
    res.json({ status: 'success', message: `Valve ${action} command sent.` });
});

// Serve Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`AquaNode server running at http://localhost:${PORT}`);
});
