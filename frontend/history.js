import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// Icon mapping for each disaster type
const disasterIcons = {
    'Flood':      'bi-water',
    'Fire':       'bi-fire',
    'Earthquake': 'bi-house-slash',
    'Landslide':  'bi-exclamation-triangle'
};

// Color mapping for each disaster type
const disasterColors = {
    'Flood':      '#4dadff',
    'Fire':       '#ff6b35',
    'Earthquake': '#f0c040',
    'Landslide':  '#a07850'
};

// Color mapping for each population group
const populationColors = {
    'Large':   '#15803d',
    'Medium':  '#22c55e',
    'Small':   '#86efac',
    'Unknown': '#8b8e94'
};

// Return CSS badge class based on population group
function getBadgeClass(group) {
    const map = {
        'Large':   'badge-large',
        'Medium':  'badge-medium',
        'Small':   'badge-small',
        'Unknown': 'badge-unknown'
    };
    return map[group] || 'badge-unknown';
}

// Resolve top disaster prediction from stored model decisions
function getTopDisaster(row) {
    const models = row.models;
    if (!models) return row.disaster;
    const lr  = models.disaster?.lr;
    const svm = models.disaster?.svm;
    if (lr === svm) return lr;
    return row.disaster;
}

// Generate a model decision row for the expandable panel
function modelDecisionRow(label, value, colorMap) {
    const color = colorMap[value] || '#8b8e94';
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="decision-model-label">${label}</span>
            <span class="decision-value" style="color:${color};">${value}</span>
        </div>`;
}

// Render all history records into the table
function renderHistory(data) {
    const tbody = document.getElementById('historyBody');

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#525357; padding:40px;">
                    No reports analyzed yet. Submit a report to see it here.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map((row, index) => {
        const models = row.models || {
            disaster:   { lr: row.disaster, svm: row.disaster },
            population: { lr: row.group,    svm: row.group }
        };

        const topDisaster = getTopDisaster(row);
        const dColor = disasterColors[topDisaster] || '#8b8e94';
        const dIcon  = disasterIcons[topDisaster];
        const iconHtml = dIcon ? `<i class="bi ${dIcon}"></i>` : '';

        return `
        <tr class="history-row" id="row-${index}">
            <td style="color:#525357; font-size:12px; white-space:nowrap;">${row.timestamp}</td>
            <td><span class="incident-pill">${row.report}</span></td>
            <td>
                <span class="disaster-type" style="color:${dColor}">
                    ${iconHtml} ${topDisaster}
                </span>
            </td>
            <td><span class="badge ${getBadgeClass(row.group)}">${row.group}</span></td>
            <td><span class="location-cell">${row.location}</span></td>
            <td>
                <button class="expand-btn" onclick="toggleRow(${index})" title="Show model decisions">
                    <i class="bi bi-chevron-down expand-chevron" id="chevron-${index}"></i>
                </button>
            </td>
        </tr>
        <tr class="decision-row" id="decision-${index}">
            <td colspan="6" style="padding:0;">
                <div class="decision-panel" id="panel-${index}">
                    <div class="decision-grid">
                        <div class="decision-card">
                            <p class="decision-card-title">Disaster Type</p>
                            ${modelDecisionRow('Logistic Regression', models.disaster.lr, disasterColors)}
                            ${modelDecisionRow('Support Vector Machine', models.disaster.svm, disasterColors)}
                        </div>
                        <div class="decision-card">
                            <p class="decision-card-title">Population Group</p>
                            ${modelDecisionRow('Logistic Regression', models.population.lr, populationColors)}
                            ${modelDecisionRow('Support Vector Machine', models.population.svm, populationColors)}
                        </div>
                    </div>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Toggle expandable model decision panel for a history row
function toggleRow(index) {
    const panel   = document.getElementById(`panel-${index}`);
    const chevron = document.getElementById(`chevron-${index}`);
    const isOpen  = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    chevron.classList.toggle('rotated', !isOpen);
}

// Delete all reports from Firebase Firestore
async function clearHistory() {
    if (confirm('Clear all report history?')) {
        const snapshot = await getDocs(collection(db, 'reports'));
        const deletes = snapshot.docs.map(d => deleteDoc(doc(db, 'reports', d.id)));
        await Promise.all(deletes);
        renderHistory([]);
    }
}

window.toggleRow = toggleRow;
window.clearHistory = clearHistory;

// Load and render history from Firebase on page load
document.addEventListener('DOMContentLoaded', async () => {
    const q = query(collection(db, 'reports'), orderBy('id', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => d.data());
    renderHistory(data);
});
