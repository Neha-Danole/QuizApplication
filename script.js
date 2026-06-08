// ====================================================================
// SYSTEM RUNTIME STATE ENGINE (NAVIGATION & STOPWATCH MODIFIED)
// ====================================================================
let activeCategory = "";
let activeSubCategory = ""; 
let activeQuestionSet = [];
let currentQuestionIndex = 0;
let userScore = 0;

let userAnswers = []; 

let stopwatchTimer = null;
let questionTimeElapsed = 0; 
let totalTrackTimeElapsed = 0; 
let questionTimeLogs = []; 

/**
 * PAGE NAVIGATION: ROUTE TO SUB-TRACK LIST SELECTION PAGE (PAGE 2)
 */
window.showTrackSelection = function(category) {
    activeCategory = category;
    activeSubCategory = ""; 
    
    document.getElementById('menu-screen').classList.add('hidden');
    
    const tracksScreen = document.getElementById('tracks-screen');
    const tracksTitle = document.getElementById('tracks-title');
    const container = document.getElementById('dynamic-sub-container');
    
    const cleanTitle = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    tracksTitle.innerText = `${cleanTitle} Tracks`;
    
    container.innerHTML = "";
    
    const subCategories = Object.keys(quizDatabase[category]);
    let optionsHtml = `
        <button class="menu-btn selected" onclick="selectSubCategoryScope(this, 'ALL')">
            <span>Full Mixed Comprehensive Deck (100 Questions)</span><span class="status-indicator">&check;</span>
        </button>
    `;
    
    subCategories.forEach(sub => {
        const totalCount = quizDatabase[category][sub].length;
        optionsHtml += `
            <button class="menu-btn" onclick="selectSubCategoryScope(this, '${sub.replace(/'/g, "\\'")}')">
                <span>${sub} (${totalCount} Questions)</span><span class="status-indicator">&rarr;</span>
            </button>
        `;
    });
    
    container.innerHTML = optionsHtml;
    tracksScreen.classList.remove('hidden');
};

window.selectSubCategoryScope = function(buttonElement, subCategoryTarget) {
    const siblings = buttonElement.parentElement.querySelectorAll('.menu-btn');
    siblings.forEach(el => {
        el.classList.remove('selected');
        const indicator = el.querySelector('.status-indicator');
        if (indicator) indicator.innerHTML = '&rarr;';
    });
    
    buttonElement.classList.add('selected');
    buttonElement.querySelector('.status-indicator').innerHTML = '&check;';
    
    activeSubCategory = (subCategoryTarget === 'ALL') ? "" : subCategoryTarget;
};

window.goToInstructions = function() {
    document.getElementById('tracks-screen').classList.add('hidden');
    const instructionsScreen = document.getElementById('instructions-screen');
    const instructionsTitle = document.getElementById('instructions-title');
    const cleanTrackTitle = activeSubCategory !== "" ? activeSubCategory : "Full Comprehensive Deck";
    instructionsTitle.innerText = `${cleanTrackTitle} - Rules`;
    instructionsScreen.classList.remove('hidden');
};

window.returnToTracks = function() {
    document.getElementById('instructions-screen').classList.add('hidden');
    document.getElementById('tracks-screen').classList.remove('hidden');
};

window.showMenu = function() {
    document.getElementById('instructions-screen').classList.add('hidden');
    document.getElementById('tracks-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
};

window.initiateActiveQuiz = function() {
    activeQuestionSet = [];
    currentQuestionIndex = 0;
    userScore = 0;
    totalTrackTimeElapsed = 0;
    questionTimeLogs = [];
    
    if (activeSubCategory !== "") {
        activeQuestionSet = [...quizDatabase[activeCategory][activeSubCategory]];
    } else {
        Object.keys(quizDatabase[activeCategory]).forEach(sub => {
            activeQuestionSet = activeQuestionSet.concat(quizDatabase[activeCategory][sub]);
        });
    }
    
    if (activeQuestionSet.length === 0) {
        alert("Execution Error: Target collection subset empty.");
        return;
    }
    
    activeQuestionSet.sort(() => Math.random() - 0.5);
    userAnswers = new Array(activeQuestionSet.length).fill(null);
    questionTimeLogs = new Array(activeQuestionSet.length).fill(null).map((_, idx) => ({
        questionNum: idx + 1,
        timeTaken: 0
    }));
    
    document.getElementById('instructions-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    renderCurrentQuestionState();
};

function renderCurrentQuestionState() {
    clearInterval(stopwatchTimer);
    
    const totalQuestions = activeQuestionSet.length;
    const currentQuestion = activeQuestionSet[currentQuestionIndex];
    
    const displayCategoryTitle = activeSubCategory !== "" ? activeSubCategory : activeCategory.replace(/([A-Z])/g, ' $1').toUpperCase();
    document.getElementById('category-title').innerText = `${displayCategoryTitle} (${currentQuestionIndex + 1}/${totalQuestions})`;
    document.getElementById('question-text').innerText = currentQuestion.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = "";
    
    const pastSavedAnswer = userAnswers[currentQuestionIndex];
    
    currentQuestion.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        if (pastSavedAnswer === opt) btn.classList.add('selected');
        
        btn.innerText = opt;
        btn.onclick = () => {
            optionsContainer.querySelectorAll('.option-btn').forEach(s => s.classList.remove('selected'));
            btn.classList.add('selected');
            userAnswers[currentQuestionIndex] = opt;
        };
        optionsContainer.appendChild(btn);
    });
    
    // NAVIGATION UI UPDATES
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.style.display = (currentQuestionIndex === 0) ? 'none' : 'block';
    nextBtn.innerText = (currentQuestionIndex === totalQuestions - 1) ? "Finish Test" : "Save & Next";
    
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / totalQuestions) * 100}%`;
    
    // STOPWATCH
    questionTimeElapsed = questionTimeLogs[currentQuestionIndex].timeTaken;
    document.getElementById('timer').innerText = `Time: ${questionTimeElapsed}s`;
    
    stopwatchTimer = setInterval(() => {
        questionTimeElapsed++;
        totalTrackTimeElapsed++;
        questionTimeLogs[currentQuestionIndex].timeTaken = questionTimeElapsed;
        document.getElementById('timer').innerText = `Time: ${questionTimeElapsed}s`;
    }, 1000);
}

window.handleNextClick = function() {
    clearInterval(stopwatchTimer);
    if (currentQuestionIndex < activeQuestionSet.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestionState();
    } else {
        triggerEvaluationCompleteSummary();
    }
};

window.previousQuestion = function() {
    if (currentQuestionIndex > 0) {
        clearInterval(stopwatchTimer);
        currentQuestionIndex--;
        renderCurrentQuestionState();
    }
};

function triggerEvaluationCompleteSummary() {
    clearInterval(stopwatchTimer);
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    
    userScore = 0;
    activeQuestionSet.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) userScore++;
    });
    
    document.getElementById('final-score').innerText = userScore;
    document.getElementById('total-questions').innerText = activeQuestionSet.length;
    document.getElementById('total-time-display').innerText = `Total Duration: ${totalTrackTimeElapsed}s`;
    
    const logsContainer = document.getElementById('per-question-time-log');
    logsContainer.innerHTML = "";
    questionTimeLogs.forEach(log => {
        const itemLine = document.createElement('div');
        itemLine.innerHTML = `<span>Question #${log.questionNum}:</span> <span style="color:var(--primary); font-weight:bold; float:right;">${log.timeTaken}s</span>`;
        logsContainer.appendChild(itemLine);
    });
    
    document.getElementById('feedback-msg').innerText = (userScore / activeQuestionSet.length) >= 0.5 ? "Assessment Cleared." : "Review required.";
    renderLeaderboardDisplayView();
}

window.saveLeaderboardData = function() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert("Enter a name.");
    
    const storageKey = `leaderboard_${activeCategory}`;
    let records = JSON.parse(localStorage.getItem(storageKey)) || [];
    records.push({ name: username, score: userScore, max: activeQuestionSet.length, timestamp: new Date().toLocaleDateString() });
    records.sort((a, b) => (b.score / b.max) - (a.score / a.max));
    localStorage.setItem(storageKey, JSON.stringify(records.slice(0, 5)));
    renderLeaderboardDisplayView();
};

function renderLeaderboardDisplayView() {
    const records = JSON.parse(localStorage.getItem(`leaderboard_${activeCategory}`)) || [];
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = records.length ? records.map(r => `<li class="leaderboard-item"><span>${r.name}</span><span>${r.score}/${r.max}</span></li>`).join('') : "No records.";
}

window.exitQuiz = function() {
    if (confirm("Terminate assessment?")) {
        clearInterval(stopwatchTimer);
        window.showMenu();
    }
};