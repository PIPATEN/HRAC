// =====================================================================
// practice-logic.js
// This script contains all shared functions for the practice pages.
// =====================================================================

// Global state variable to hold the dynamic file paths and title temporarily
let currentQuizData = {
    title: '',
    qFile: '',
    aFile: ''
};

// DOM elements (These are common to all practice pages)
const modal = document.getElementById('selectionModal');
const modalTitleElement = document.getElementById('modalTitle');
const modalTestNameElement = document.getElementById('modalTestName');


/**
 * 1. Displays the custom modal when a unit button is clicked.
 * 2. Saves the quiz specific file paths for the next step.
 * @param {string} testName - The display name of the quiz (e.g., 'Quiz 1').
 * @param {string} qFile - The path to the question bank text file.
 * @param {string} aFile - The path to the answer bank text file.
 */
function showQuizOptions(testName, qFile, aFile) {
    // Store the relevant data for the next step
    currentQuizData.title = testName;
    currentQuizData.qFile = qFile;
    currentQuizData.aFile = aFile;

    // Update modal text
    modalTitleElement.textContent = `Select Practice Size`;
    modalTestNameElement.textContent = `for "${testName}"`;

    // Show the modal
    modal.style.display = 'flex';
}

/**
 * Handles the click on one of the three buttons inside the modal,
 * and redirects to the appropriate quiz template file based on limit.
 * @param {string} limit - '10', '20', or 'Full'
 */
function handleSelection(limit) {
    // Hide the modal immediately
    modal.style.display = 'none';

    // Encode the title for safe URL transfer
    const encodedTitle = encodeURIComponent(currentQuizData.title);

    let templateFile = '';

    // CORE LOGIC: Use practice-quiz-template for limited sets, quiz-template for Full.
    if (limit === 'Full') {
        templateFile = './quiz-template.html'; 
    } else {
        templateFile = './practice-quiz-template.html'; 
    }

    // Determine the current page (e.g., practice111.html) to use as the back-page URL parameter
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Construct the final URL and redirect the user
    let url = `${templateFile}?qfile=${currentQuizData.qFile}&afile=${currentQuizData.aFile}&title=${encodedTitle}&limit=${limit}&bpage=${currentPage}`;

    window.location.href = url;
}


/**
 * Load best scores from localStorage for the specific quizzes defined on the page
 * and displays them in the score bubbles, applying the gold style for >= 90%.
 */
function loadBestScores() {
    // pageQuizzes is expected to be a global variable defined in the HTML file
    if (typeof pageQuizzes === 'undefined' || !Array.isArray(pageQuizzes)) {
        console.error("Error: 'pageQuizzes' array not found. Cannot load scores.");
        return;
    }

    pageQuizzes.forEach(quiz => {
        const storageKey = 'bestScore_' + quiz.title.replace(/\s/g, '');
        const indicatorSpan = document.getElementById(quiz.spanId);
        
        // Find the main unit button associated with this score bubble
        // Assumes the button ID is 'btn-' + Title (no spaces)
        const unitButton = document.getElementById('btn-' + quiz.title.replace(/\s/g, ''));

        // Start by assuming no gold score: remove the class
        if (unitButton) {
             unitButton.classList.remove('score-achieved');
        }

        if (indicatorSpan) {
            const storedScoreString = localStorage.getItem(storageKey);
            let score = 0;
            // Default to the provided defaultTotal, or 40 if not present
            let total = quiz.defaultTotal || 40; 

            if (storedScoreString) {
                try {
                    // Score is stored as JSON: { score: X, total: Y }
                    const bestScore = JSON.parse(storedScoreString);
                    
                    if (typeof bestScore === 'object' && bestScore !== null) {
                        score = bestScore.score || 0;
                        total = bestScore.total || total;
                    } else if (!isNaN(parseInt(storedScoreString))) {
                        // Fallback for very old storage format (raw number)
                        score = parseInt(storedScoreString);
                    }
                } catch (e) {
                    console.warn(`Error parsing score for ${quiz.title}:`, e);
                }
            }

            // --- SCORE DISPLAY & BUTTON COLOR LOGIC ---
            if (score > 0) {
                indicatorSpan.textContent = `Best: ${score}/${total}`;
                indicatorSpan.className = 'score-bubble'; // Blue default styling

                // Calculate percentage (check for total > 0 to avoid division by zero)
                const percentage = total > 0 ? (score / total) * 100 : 0;
                
                // 🔑 Apply GOLD class to the button if score is 90% or greater
                if (percentage >= 90 && unitButton) {
                    unitButton.classList.add('score-achieved');

                    // If it's a perfect score (100%), add the star to the bubble
                    if (score === total) {
                         indicatorSpan.textContent = `⭐ Best: ${score}/${total} ⭐`;
                         indicatorSpan.classList.add('score-perfect');
                    }
                }

                indicatorSpan.style.display = 'block';
            } else {
                indicatorSpan.style.display = 'none';
            }
        }
    });
}

// ----------------------------------------------------
// Event Listeners (Run once when script loads)
// ----------------------------------------------------

// 1. Load scores when the page fully loads
document.addEventListener('DOMContentLoaded', loadBestScores);

// 2. Close modal if user clicks outside the content (improves UX)
if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}