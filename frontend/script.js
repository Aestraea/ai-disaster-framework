import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBNp3q46hF6TJNTg1SqUxerxoH_HWey6xw",
  authDomain: "ai-disaster-classification.firebaseapp.com",
  projectId: "ai-disaster-classification",
  storageBucket: "ai-disaster-classification.firebasestorage.app",
  messagingSenderId: "721809983162",
  appId: "1:721809983162:web:d113c6e4b20d94fcc42483",
  measurementId: "G-D17N4LQKV6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Majority voting to resolve final prediction from three models
function getMajority(a, b, c) {
    if (a === b || a === c) return a;
    if (b === c) return b;
    return a;
}

// Submit report for analysis and redirect to result page
async function analyze() {
    const textInput = document.getElementById('inputText').value;
    const loader = document.getElementById('loading');

    if (textInput.trim() === "") {
        alert("Please enter a report before submitting.");
        return;
    }

    if (loader) loader.style.display = 'flex';

    try {
        const response = await fetch('https://grldchrstn-aidisasterclassifier.hf.space/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textInput })
        });

        if (!response.ok) throw new Error("Server error: " + response.status);

        const data = await response.json();

        // Store result in sessionStorage for result page
        sessionStorage.setItem('analysisResult', JSON.stringify(data));
        sessionStorage.setItem('currentReport', textInput);

        await saveToHistory(textInput, data);

        setTimeout(() => {
            window.location.href = "result.html";
        }, 1000);

    } catch (error) {
        if (loader) loader.style.display = 'none';
        alert("Could not connect to the analysis server. Please try again.");
        console.error(error);
    }
}

// Save submitted report and model outputs to Firebase Firestore
async function saveToHistory(text, data) {
    const dLr      = data.disaster.lr.prediction;
    const dSvm     = data.disaster.svm.prediction;
    const dRoberta = data.disaster.roberta.prediction;
    const pLr      = data.population.lr.prediction;
    const pSvm     = data.population.svm.prediction;
    const pRoberta = data.population.roberta.prediction;

    const entry = {
        id:        Date.now(),
        timestamp: new Date().toLocaleString(),
        report:    text,
        disaster:  getMajority(dLr, dSvm, dRoberta),
        group:     getMajority(pLr, pSvm, pRoberta),
        location:  data.location,
        models: {
            disaster: {
                lr:      dLr,
                svm:     dSvm,
                roberta: dRoberta
            },
            population: {
                lr:      pLr,
                svm:     pSvm,
                roberta: pRoberta
            }
        }
    };

    await addDoc(collection(db, 'reports'), entry);
}

window.analyze = analyze;

// Allow report submission via Enter key
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('inputText');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') analyze();
        });
    }
});