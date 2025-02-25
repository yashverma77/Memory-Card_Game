// Sound effects
const sounds = {
    flip: new Audio('https://assets.codepen.io/10053/flip.mp3'),
    match: new Audio('https://assets.codepen.io/10053/match.mp3'),
    wrong: new Audio('https://assets.codepen.io/10053/wrong.mp3'),
    win: new Audio('https://assets.codepen.io/10053/win.mp3'),
    bgMusic: new Audio('https://assets.codepen.io/10053/bg-music.mp3')
};

// Set background music to loop
sounds.bgMusic.loop = true;
sounds.bgMusic.volume = 0.3;

// Game configuration
const config = {
    difficulty: {
        easy: { rows: 4, cols: 4, timer: 120 },
        medium: { rows: 6, cols: 6, timer: 180 },
        hard: { rows: 8, cols: 8, timer: 300 }
    },
    themes: {
        animals: [
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
            '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
            '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄',
            '🐝', '🐛', '🦋', '🐌', '🐚', '🐞', '🐜', '🦗',
            '🕷️', '🦂', '🦞', '🦀'
        ],
        emojis: [
            '😀', '😂', '😍', '🤔', '😎', '🥳', '😴', '🤯', '👻', '👽', '🤖', '👑',
            '🌈', '🍕', '🚀', '🎮', '🎸', '🎭', '⚽', '🏆', '💯', '💰', '📱', '🔥',
            '🌞', '🌙', '⭐', '🌟', '🦄', '🦁', '🐶', '🦊'
        ],
        superheroes: [
            '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🦹‍♀️', '🕷️', '🦇', '🦸', '🛡️',  
            '🦾', '🦿', '⚡', '🔥', '❄️', '🧊', '🌀', '🌪️',  
            '🕶️', '🎭', '🦉', '🦈', '🦅', '🐉', '🦖', '🛸',  
            '🚀', '🔮', '☄️', '🧬', '🔫', '🗡️', '⚔️', '🏹',  
            '🖤', '👑', '🎯', '🕊️', '🔗', '🦠', '🦍', '🦊'  
        ]
    }
};

// Game state
let gameState = {
    cards: [],
    flippedCards: [],
    matches: 0,
    score: 0,
    timer: 0,
    timerInterval: null,
    isPlaying: false,
    isPaused: false,
    soundEnabled: true,
    currentDifficulty: 'easy',
    currentTheme: 'animals',
    totalPairs: 0,
    gameStarted: false
};

// DOM Elements
const elements = {
    gameBoard: document.getElementById('game-board'),
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    bestScore: document.getElementById('best-score'),
    pauseBtn: document.getElementById('pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    soundBtn: document.getElementById('sound-btn'),
    difficultyBtns: document.querySelectorAll('.difficulty-btn'),
    themeBtns: document.querySelectorAll('.theme-btn'),
    themeSwitch: document.getElementById('theme-switch'),
    gameOver: document.getElementById('game-over'),
    finalScore: document.getElementById('final-score'),
    finalTime: document.getElementById('final-time'),
    playAgain: document.getElementById('play-again'),
    pauseModal: document.getElementById('pause-modal'),
    resumeBtn: document.getElementById('resume-btn'),
    showLeaderboard: document.getElementById('show-leaderboard'),
    leaderboardContainer: document.getElementById('leaderboard-container'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    closeLeaderboard: document.getElementById('close-leaderboard'),
    startModal: document.getElementById('start-modal'),
    startGameBtn: document.getElementById('start-game-btn')
};

// Initialize game
function initGame() {
    loadBestScore();
    setupEventListeners();
    // Show start modal instead of immediately starting the game
    showElement(elements.startModal);
    prepareNewGame();
}

// Event Listeners
function setupEventListeners() {
    // Reset button
    elements.resetBtn.addEventListener('click', () => {
        playSound('flip');
        prepareNewGame();
    });

    // Start game button
    elements.startGameBtn.addEventListener('click', () => {
        hideElement(elements.startModal);
        startGame();
    });

    // Pause button
    elements.pauseBtn.addEventListener('click', togglePause);

    // Sound button
    elements.soundBtn.addEventListener('click', toggleSound);

    // Difficulty buttons
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.level;
            elements.difficultyBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentDifficulty = difficulty;
            playSound('flip');
            prepareNewGame();
        });
    });

    // Theme buttons
    elements.themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            elements.themeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTheme = theme;
            playSound('flip');
            prepareNewGame();
        });
    });

    // Dark mode toggle
    elements.themeSwitch.addEventListener('change', toggleDarkMode);

    // Play again button
    elements.playAgain.addEventListener('click', () => {
        hideElement(elements.gameOver);
        prepareNewGame();
    });

    // Resume button
    elements.resumeBtn.addEventListener('click', resumeGame);

    // Leaderboard buttons
    elements.showLeaderboard.addEventListener('click', showLeaderboard);
    elements.closeLeaderboard.addEventListener('click', () => {
        hideElement(elements.leaderboardContainer);
    });
}

// Prepare a new game (setup without starting timer)
function prepareNewGame() {
    clearInterval(gameState.timerInterval);
    
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matches = 0;
    gameState.score = 0;
    gameState.gameStarted = false;
    
    const difficultySettings = config.difficulty[gameState.currentDifficulty];
    gameState.timer = difficultySettings.timer;
    
    const rows = difficultySettings.rows;
    const cols = difficultySettings.cols;
    
    gameState.totalPairs = Math.floor((rows * cols) / 2);
    
    updateUI();
    createGameBoard(rows, cols);
    
    // Do not start playing immediately
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    // Show start modal
    showElement(elements.startModal);
}

// Start the actual game
function startGame() {
    gameState.isPlaying = true;
    gameState.gameStarted = true;
    startTimer();
    
    if (gameState.soundEnabled) {
        sounds.bgMusic.play();
    }
}

// Create the game board with cards
function createGameBoard(rows, cols) {
    elements.gameBoard.innerHTML = '';
    elements.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    // Get the theme and create pairs
    const availableImages = [...config.themes[gameState.currentTheme]];
    const neededPairs = Math.floor((rows * cols) / 2);
    
    // Shuffle and pick the needed number of images
    const selectedImages = shuffleArray(availableImages).slice(0, neededPairs);
    
    // Create pairs
    const cardPairs = [...selectedImages, ...selectedImages];
    
    // Shuffle the pairs
    const shuffledCards = shuffleArray(cardPairs);
    
    // Create card elements
    shuffledCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        cardElement.dataset.value = card;
        
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        cardBack.innerHTML = '<i class="fas fa-question"></i>';
        
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');
        
        // Display all themes as emojis
        const emojiSpan = document.createElement('span');
        emojiSpan.style.fontSize = '2.5rem';
        emojiSpan.textContent = card;
        cardFront.appendChild(emojiSpan);
        
        cardElement.appendChild(cardBack);
        cardElement.appendChild(cardFront);
        
        cardElement.addEventListener('click', () => handleCardClick(cardElement));
        
        elements.gameBoard.appendChild(cardElement);
    });
    
    gameState.cards = Array.from(document.querySelectorAll('.card'));
}

// Handle card click
function handleCardClick(card) {
    // Start game on first card click if not started
    if (!gameState.gameStarted) {
        startGame();
    }
    
    // Ignore clicks if game is paused or card is already flipped/matched
    if (gameState.isPaused || 
        gameState.flippedCards.length >= 2 || 
        card.classList.contains('flipped') ||
        card.classList.contains('matched')) {
        return;
    }
    
    playSound('flip');
    
    // Flip the card
    card.classList.add('flipped');
    gameState.flippedCards.push(card);
    
    // If two cards are flipped, check for a match
    if (gameState.flippedCards.length === 2) {
        checkForMatch();
    }
}

// Check if the two flipped cards match
function checkForMatch() {
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.dataset.value === card2.dataset.value) {
        // Cards match
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            gameState.flippedCards = [];
            gameState.matches++;
            gameState.score += 10;
            updateUI();
            playSound('match');
            
            // Check if all pairs are matched
            if (gameState.matches === gameState.totalPairs) {
                endGame();
            }
        }, 500);
    } else {
        // Cards don't match
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            gameState.flippedCards = [];
            gameState.score = Math.max(0, gameState.score - 2);
            updateUI();
            playSound('wrong');
        }, 1000);
    }
}

// Timer functions
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timer--;
            updateUI();
            
            if (gameState.timer <= 0) {
                clearInterval(gameState.timerInterval);
                endGame(false);
            }
        }
    }, 1000);
}

function togglePause() {
    if (gameState.isPlaying) {
        if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function pauseGame() {
    gameState.isPaused = true;
    elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    showElement(elements.pauseModal);
    playSound('flip');
}

function resumeGame() {
    gameState.isPaused = false;
    elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    hideElement(elements.pauseModal);
    playSound('flip');
}

// End game
function endGame(isWinner = true) {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;
    gameState.gameStarted = false;
    
    if (isWinner) {
        playSound('win');
        saveBestScore();
        saveToLeaderboard();
    }
    
    elements.finalScore.textContent = gameState.score;
    elements.finalTime.textContent = formatTime(gameState.timer);
    showElement(elements.gameOver);
}

// UI updates
function updateUI() {
    elements.timer.textContent = formatTime(gameState.timer);
    elements.score.textContent = gameState.score;
}

// Toggle sound
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        if (gameState.isPlaying && !gameState.isPaused) {
            sounds.bgMusic.play();
        }
    } else {
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        sounds.bgMusic.pause();
    }
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Play sound if enabled
function playSound(soundName) {
    if (gameState.soundEnabled) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
    }
}

// Helper functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showElement(element) {
    element.style.display = 'flex';
}

function hideElement(element) {
    element.style.display = 'none';
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Local Storage functions
function saveBestScore() {
    const currentBest = localStorage.getItem(`bestScore_${gameState.currentDifficulty}`) || 0;
    if (gameState.score > currentBest) {
        localStorage.setItem(`bestScore_${gameState.currentDifficulty}`, gameState.score);
        loadBestScore();
    }
}

function loadBestScore() {
    const bestScore = localStorage.getItem(`bestScore_${gameState.currentDifficulty}`) || 0;
    elements.bestScore.textContent = bestScore;
}

function saveToLeaderboard() {
    // Get existing leaderboard or create new one
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    // Add new entry
    const entry = {
        score: gameState.score,
        time: gameState.timer,
        difficulty: gameState.currentDifficulty,
        date: new Date().toISOString()
    };
    
    leaderboard.push(entry);
    
    // Sort by score (higher first) and then by time (higher first, as more time remaining is better)
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.time - a.time;
    });
    
    // Keep only top 10 entries
    leaderboard = leaderboard.slice(0, 10);
    
    // Save back to local storage
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    // Get leaderboard data
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    // Clear existing entries
    elements.leaderboardBody.innerHTML = '';
    
    // Add entries
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.score;
        
        const timeCell = document.createElement('td');
        timeCell.textContent = formatTime(entry.time);
        
        const difficultyCell = document.createElement('td');
        difficultyCell.textContent = entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1);
        
        row.appendChild(rankCell);
        row.appendChild(scoreCell);
        row.appendChild(timeCell);
        row.appendChild(difficultyCell);
        
        elements.leaderboardBody.appendChild(row);
    });
    
    // Show leaderboard
    showElement(elements.leaderboardContainer);
}

// Initialize the game
document.addEventListener('DOMContentLoaded', initGame);