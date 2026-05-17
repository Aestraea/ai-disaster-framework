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

// Load and display analysis results from sessionStorage
document.addEventListener('DOMContentLoaded', () => {
    const raw    = sessionStorage.getItem('analysisResult');
    const report = sessionStorage.getItem('currentReport');

    if (!raw) { window.location.href = 'index.html'; return; }

    const data = JSON.parse(raw);

    if (report) document.getElementById('reportText').innerText = report;

    const dLrPred  = data.disaster.lr.prediction;
    const dSvmPred = data.disaster.svm.prediction;

    setModelCard({
        predId: 'disasterLrPrediction',  confId: 'disasterLrConfidence',
        barsId: 'disasterLrBars',        iconId: 'disasterLrIcon',
        prediction: dLrPred, confidence: data.disaster.lr.confidence,
        iconMap: disasterIcons, colorMap: disasterColors
    });
    setModelCard({
        predId: 'disasterSvmPrediction', confId: 'disasterSvmConfidence',
        barsId: 'disasterSvmBars',       iconId: 'disasterSvmIcon',
        prediction: dSvmPred, confidence: data.disaster.svm.confidence,
        iconMap: disasterIcons, colorMap: disasterColors
    });

    setAgreementBadge('disasterAgreement', dLrPred, dSvmPred);
    document.getElementById('disasterSummary').innerText =
        `LR: ${dLrPred} · SVM: ${dSvmPred}`;

    const pLrPred  = data.population.lr.prediction;
    const pSvmPred = data.population.svm.prediction;

    setModelCard({
        predId: 'populationLrPrediction',  confId: 'populationLrConfidence',
        barsId: 'populationLrBars',        iconId: null,
        prediction: pLrPred, confidence: data.population.lr.confidence,
        iconMap: {}, colorMap: populationColors
    });
    setModelCard({
        predId: 'populationSvmPrediction', confId: 'populationSvmConfidence',
        barsId: 'populationSvmBars',       iconId: null,
        prediction: pSvmPred, confidence: data.population.svm.confidence,
        iconMap: {}, colorMap: populationColors
    });

    setAgreementBadge('populationAgreement', pLrPred, pSvmPred);
    document.getElementById('populationSummary').innerText =
        `LR: ${pLrPred} · SVM: ${pSvmPred}`;
});

// Render a model prediction card with confidence bars
function setModelCard({ predId, confId, barsId, iconId, prediction, confidence, iconMap, colorMap }) {
    const topConf = confidence[prediction];
    document.getElementById(predId).innerText = prediction;
    document.getElementById(confId).innerText  = topConf.toFixed(1) + '% Confidence';

    if (iconId) {
        const iconEl = document.getElementById(iconId);
        if (iconEl) {
            iconEl.className  = `bi ${iconMap[prediction] || 'bi-question-circle'}`;
            iconEl.style.color = colorMap[prediction] || '#8b8e94';
        }
    }

    renderConfidenceBars(barsId, confidence, prediction, colorMap);
}

// Render confidence score bars sorted by score
function renderConfidenceBars(containerId, confidenceObj, topPred, colorMap) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    Object.entries(confidenceObj)
        .sort((a, b) => b[1] - a[1])
        .forEach(([label, score]) => {
            const isTop = label === topPred;
            const color = colorMap[label] || '#8b8e94';
            container.innerHTML += `
                <div class="conf-row">
                    <span class="conf-label ${isTop ? 'conf-label-top' : ''}">${label}</span>
                    <div class="conf-bar-track">
                        <div class="conf-bar-fill" style="width:${score}%; background:${isTop ? color : '#2a2b30'};"></div>
                    </div>
                    <span class="conf-score ${isTop ? 'conf-score-top' : ''}">${score.toFixed(1)}%</span>
                </div>`;
        });
}

// Show agreement or disagreement badge between two model predictions
function setAgreementBadge(elementId, pred1, pred2) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (pred1 === pred2) {
        el.innerText   = '✓ Models agree';
        el.className   = 'agreement-badge agree';
    } else {
        el.innerText   = '⚠ Models disagree';
        el.className   = 'agreement-badge disagree';
    }
}

// Toggle collapsible section open or closed
function toggleSection(btn) {
    const block   = btn.closest('.section-block');
    const panel   = block.querySelector('.section-panel');
    const chevron = btn.querySelector('.section-chevron');
    const isOpen  = block.dataset.open === 'true';

    block.dataset.open = !isOpen;
    panel.classList.toggle('open', !isOpen);
    chevron.classList.toggle('rotated', !isOpen);
}

// Clear session and return to home page
function startNew() {
    sessionStorage.removeItem('analysisResult');
    sessionStorage.removeItem('currentReport');
    window.location.href = 'index.html';
}

window.toggleSection = toggleSection;
window.startNew = startNew;
