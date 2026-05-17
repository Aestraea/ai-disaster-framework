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

// Load and display breakdown data from sessionStorage
document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('analysisResult');
    if (!raw) { window.location.href = 'index.html'; return; }

    const data = JSON.parse(raw);
    const bd   = data.breakdown;

    if (!bd) {
        document.querySelector('.sections').innerHTML =
            `<p style="color:#525357; text-align:center; padding:40px;">
                No breakdown data available. Please submit a new report.
            </p>`;
        return;
    }

    const pp = bd.preprocessing;

    // Stage 1: Raw Input
    document.getElementById('rawInput').innerText = pp.original;

    // Stage 2: Preprocessing steps
    document.getElementById('lowercased').innerText = pp.lowercased;
    document.getElementById('noPunct').innerText    = pp.no_punct;
    document.getElementById('tokens').innerText     = `[${pp.tokens.map(t => `"${t}"`).join(', ')}]`;
    document.getElementById('filtered').innerText   = `[${pp.filtered.map(t => `"${t}"`).join(', ')}]`;
    document.getElementById('cleaned').innerText    = pp.cleaned;

    // Stage 3: TF-IDF Keywords
    renderKeywords('disasterKeywords',   bd.disaster_keywords,   '#4dadff');
    renderKeywords('populationKeywords', bd.population_keywords, '#4dff88');

    // Stage 4: Model Predictions
    const df = bd.final.disaster;
    const pf = bd.final.population;

    setPredBadge('bdLrPred',      df.lr,      disasterColors[df.lr]      || '#8b8e94');
    setPredBadge('bdSvmPred',     df.svm,     disasterColors[df.svm]     || '#8b8e94');
    setPredBadge('bdRobertaPred', df.roberta, disasterColors[df.roberta] || '#8b8e94');

    setPredBadge('bpLrPred',      pf.lr,      populationColors[pf.lr]      || '#8b8e94');
    setPredBadge('bpSvmPred',     pf.svm,     populationColors[pf.svm]     || '#8b8e94');
    setPredBadge('bpRobertaPred', pf.roberta, populationColors[pf.roberta] || '#8b8e94');

    document.getElementById('bLocation').innerText = bd.final.location || 'Not identified';

    // Stage 5: Final Decision cards
    renderFinalCard('finalDisaster',   'Disaster Type',    df.prediction, df);
    renderFinalCard('finalPopulation', 'Population Group', pf.prediction, pf);

    const locCard = document.getElementById('finalLocation');
    locCard.innerHTML = `
        <div class="final-decision-inner">
            <div>
                <p class="final-decision-label">Location</p>
                <p class="final-decision-task">Extracted by RoBERTa NER</p>
            </div>
            <p class="final-decision-value">${bd.final.location || 'Not identified'}</p>
        </div>`;
});

// Render TF-IDF keyword bars for a given container
function renderKeywords(containerId, keywords, color) {
    const container = document.getElementById(containerId);
    if (!container || !keywords || keywords.length === 0) {
        container.innerHTML = `<p style="font-size:12px; color:#525357;">No keywords found.</p>`;
        return;
    }

    const maxScore = Math.max(...keywords.map(k => k.score));
    container.innerHTML = keywords.map(k => {
        const pct = maxScore > 0 ? (k.score / maxScore) * 100 : 0;
        return `
            <div class="conf-row">
                <span class="conf-label conf-label-top">${k.word}</span>
                <div class="conf-bar-track">
                    <div class="conf-bar-fill" style="width:${pct.toFixed(1)}%; background:${color};"></div>
                </div>
                <span class="conf-score conf-score-top">${k.score.toFixed(4)}</span>
            </div>`;
    }).join('');
}

// Set prediction badge text and color
function setPredBadge(id, value, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText   = value;
    el.style.color = color;
}

// Render final decision card with majority voting results
function renderFinalCard(id, task, prediction, models) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = `
        <div class="final-decision-inner">
            <div>
                <p class="final-decision-label">${task}</p>
                <div class="final-decision-votes">
                    <span class="vote-item">LR: ${models.lr}</span>
                    <span class="vote-item">SVM: ${models.svm}</span>
                    <span class="vote-item">RoBERTa: ${models.roberta}</span>
                </div>
            </div>
            <div class="final-decision-result">
                <p class="final-decision-task">Final</p>
                <p class="final-decision-value">${prediction}</p>
            </div>
        </div>`;
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