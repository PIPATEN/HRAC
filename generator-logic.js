// generator-logic.js - Logs all form input values (and processes question and answer file content) on submit.

// 💥 Assumed Global Dependency: 'db' (Firestore object) is defined in main.js 💥
// 💥 Assumed Global Dependency: 'generateBtn' is queried here for state control 💥
const generateBtn = document.querySelector('.action-btn[type="submit"]');

// Helper to manage UI state during upload
function toggleLoadingState(isLoading, message = 'Generating Questions...') {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        // Blue for loading, Red for error (default), Green for success
        errorMessage.style.color = isLoading ? '#4285F4' : (errorMessage.style.color === 'red' ? 'red' : '#27ae60');
        errorMessage.textContent = isLoading ? message : '';
    }
    if (generateBtn) {
        generateBtn.disabled = isLoading;
        generateBtn.textContent = isLoading ? 'Uploading...' : 'Generate Questions';
    }
}


// Async function to read and process the answer file (No changes needed)
function processAnswerFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            const fileContent = event.target.result;
            // Split content into lines, filter out empty lines, and trim whitespace
            const answers = fileContent.trim().split('\n')
                .filter(line => line.trim() !== '')
                .map(line => line.trim());
            
            resolve(answers);
        };

        reader.onerror = function() {
            console.error("Error reading answer file:", reader.error);
            resolve({ error: "Failed to read answer file." });
        };

        // Start reading the file as text
        reader.readAsText(file);
    });
}


// Async function to read and process the question file (No changes needed)
function processQuestionFile(file, formPackage) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            const fileContent = event.target.result;
            const lines = fileContent.trim().split('\n').filter(line => line.trim() !== '');
            const questionPackages = [];
            
            // Your specified format: Question + Answer A + Answer B + Answer C + Answer D (5 items per package)
            const itemsPerQuestion = 5;
            
            if (lines.length % itemsPerQuestion !== 0) {
                console.error("File parsing error: The number of content lines is not a multiple of 5 (Question + 4 Answers).");
                formPackage.parsedQuestions = { error: "File lines mismatch expected format (5 items per question package)." };
                resolve(formPackage);
                return;
            }

            // Loop through the lines, creating a question package every 5 lines
            for (let i = 0; i < lines.length; i += itemsPerQuestion) {
                const questionPackage = {
                    question_id: `Q${(i / itemsPerQuestion) + 1}`,
                    text: lines[i].trim(),
                    options: [
                        lines[i + 1] ? lines[i + 1].trim() : '',
                        lines[i + 2] ? lines[i + 2].trim() : '',
                        lines[i + 3] ? lines[i + 3].trim() : '',
                        lines[i + 4] ? lines[i + 4].trim() : '',
                    ]
                };
                questionPackages.push(questionPackage);
            }
            
            // Store the processed data in the final package
            formPackage.parsedQuestions = questionPackages;
            // Store the total number of questions for metadata
            formPackage.numberOfQuestions = questionPackages.length;
            resolve(formPackage);
        };

        reader.onerror = function() {
            console.error("Error reading file:", reader.error);
            formPackage.parsedQuestions = { error: "Failed to read file." };
            resolve(formPackage);
        };

        // Start reading the file as text
        reader.readAsText(file);
    });
}


// Function to combine questions and answers with normalization (No changes needed)
function combineQuestionAndAnswerData(questions, answers) {
    
    if (!Array.isArray(questions) || !Array.isArray(answers)) {
        return { error: "Question or answer data is missing or malformed." };
    }
    
    if (questions.length !== answers.length) {
        return { error: `Mismatch: Found ${questions.length} questions but ${answers.length} answers. Cannot combine data.` };
    }
    
    // Helper map for converting letter answers to zero-based index
    const answerIndexMap = {
        'A': 0, 'a': 0,
        'B': 1, 'b': 1,
        'C': 2, 'c': 2,
        'D': 3, 'd': 3
    };

    const combinedData = questions.map((question, index) => {
        const rawAnswer = answers[index].trim();
        let normalizedAnswer = rawAnswer;
        
        // Convert 'A', 'B', 'C', 'D' to 0, 1, 2, 3 if it matches the map
        if (answerIndexMap.hasOwnProperty(rawAnswer)) {
            normalizedAnswer = answerIndexMap[rawAnswer];
        }

        return {
            ...question,
            answer: normalizedAnswer 
        };
    });
    
    return combinedData;
}


document.addEventListener('DOMContentLoaded', () => {
    // Get all relevant form elements (unchanged)
    const questionForm = document.getElementById('question-form');
    
    const classSelect = document.getElementById('classSelect');
    const quizTestInput = document.getElementById('quizTestName');
    const weeklyMaterialSelect = document.getElementById('weeklyMaterialSelect');
    const questionTypeSelect = document.getElementById('questionTypeSelect');

    const bookNameSelect = document.getElementById('bookNameSelect');
    const unitNumberInput = document.getElementById('unitNumberInput');
    
    // Get the file input elements (unchanged)
    const uploadQuestionData = document.getElementById('uploadQuestionData');
    const uploadAnswerData = document.getElementById('uploadAnswerData');
    
    // Get the error message element for feedback (unchanged)
    const errorMessage = document.getElementById('error-message');

    // Check if the form exists before adding the listener
    if (questionForm) {
        
        questionForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Crucial: Stops the page from reloading.
            
            // Clear previous messages
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.color = 'red'; 
            }
            
            // --- Collect Form Data (Logic to determine sourceName and modeDetails remains the same) ---
            const classToggle = document.getElementById('classToggle');
            const isClassMode = classToggle && classToggle.classList.contains('active');
            
            let sourceName = '';
            let modeDetails = {};
            
            if (isClassMode) {
                const quizTestActive = document.getElementById('quizTestToggle').classList.contains('active');
                
                if (quizTestActive) {
                    sourceName = quizTestInput.value.trim();
                    modeDetails.Type = 'Quiz & Test';
                    modeDetails.Name = sourceName;
                } else {
                    const selectedWeekOption = weeklyMaterialSelect.options[weeklyMaterialSelect.selectedIndex];
                    sourceName = selectedWeekOption ? selectedWeekOption.text : 'N/A';
                    modeDetails.Type = 'Weekly Material';
                    modeDetails.Week = weeklyMaterialSelect.value;
                }

                modeDetails.Class = classSelect.value;
                
            } else {
                modeDetails.Book = bookNameSelect.value;
                modeDetails.Unit = unitNumberInput.value.trim();
                modeDetails.BookName = bookNameSelect.options[bookNameSelect.selectedIndex].text;
                sourceName = modeDetails.BookName + " - " + modeDetails.Unit;
            }
            
            // Get the file objects
            const questionFile = uploadQuestionData.files[0];
            const answerFile = uploadAnswerData.files[0];

            const questionFileName = questionFile ? questionFile.name : null;
            const answerFileName = answerFile ? answerFile.name : null;
            
            
            // --- VALIDATION CHECK (Filename and Presence) ---
            if (!questionFile || !answerFile) {
                alert("Error: Both Question Data and Answer Data files are required for processing.");
                return; 
            }

            const questionBaseName = questionFileName.substring(0, questionFileName.lastIndexOf('.'));
            const questionFileExtension = questionFileName.substring(questionFileName.lastIndexOf('.'));
            const expectedAnswerFileName = questionBaseName + 'answer' + questionFileExtension;
            
            if (answerFileName !== expectedAnswerFileName) {
                alert(`Filename Mismatch Error! ❌\n\nQuestion File: ${questionFileName}\nExpected Answer File: ${expectedAnswerFileName}\nActual Answer File: ${answerFileName}\n\nPlease rename the answer file to match the expected format.`);
                console.error("Filename Mismatch Error: Expected", expectedAnswerFileName, "but got", answerFileName);
                return;
            }
            // --- END VALIDATION CHECK ---

            
            // Start loading state and process files
            toggleLoadingState(true, 'Processing files and structuring data...');
            
            // Determine the Question Set Name
            const questionSetName = `${isClassMode ? modeDetails.Class : modeDetails.BookName} - ${sourceName}`;
            
            // --- Package Initialization & File Reading ---
            let finalPackageLog = {
                questionSetName: questionSetName, 
                questionType: questionTypeSelect.value,
                Mode_Details: modeDetails, 
                uploadedQuestionFileName: questionFileName,
                uploadedAnswerFileName: answerFileName,
                // numberOfQuestions will be added by processQuestionFile
            };
            
            finalPackageLog = await processQuestionFile(questionFile, finalPackageLog);
            finalPackageLog.parsedAnswers = await processAnswerFile(answerFile);
            
            // If there was a parsing error, stop here
            if (finalPackageLog.parsedQuestions.error) {
                toggleLoadingState(false);
                errorMessage.textContent = `❌ Upload failed: ${finalPackageLog.parsedQuestions.error}`;
                errorMessage.style.color = 'red';
                return;
            }

            // --- Construct Question Set Metadata ---
            const questionSetMetadata = {
                questionSetName: finalPackageLog.questionSetName,
                numberOfQuestions: finalPackageLog.numberOfQuestions,
                questionType: finalPackageLog.questionType,
                uploadFileName: finalPackageLog.uploadedQuestionFileName,
                modeType: isClassMode ? modeDetails.Type : 'Book Material',
                "Class": isClassMode ? modeDetails.Class : 'N/A', 
                "type": isClassMode ? 'Class' : 'Book',
                "subType": isClassMode ? modeDetails.Type : 'N/A',
                webStatus: "false", // <--- NEW FIELD ADDED HERE
                ...(isClassMode ? { 
                    "Class": modeDetails.Class // Include Class field only in Class Mode
                } : { 
                    "BookName": modeDetails.BookName, 
                    "Unit": modeDetails.Unit 
                })
            };

            // LOG METADATA
            console.log("--- QUESTION SET METADATA FOR 'questionSets' COLLECTION ---");
            console.log(questionSetMetadata);
            console.log("----------------------------------------------------------");
            
            
            // --- Combine & Inject Metadata ---
            const questions = finalPackageLog.parsedQuestions;
            const answers = finalPackageLog.parsedAnswers;
            const uploadFileName = finalPackageLog.uploadedQuestionFileName; 

            if (Array.isArray(questions) && Array.isArray(answers)) {
                let combinedData = combineQuestionAndAnswerData(questions, answers);
                
                if (Array.isArray(combinedData)) {
                    finalPackageLog.combinedData = combinedData.map(question => {
                        const baseData = {
                            ...question,
                            questionSetName: finalPackageLog.questionSetName,
                            questionType: finalPackageLog.questionType,
                            uploadFileName: uploadFileName, // Linking field
                        };

                        if (isClassMode) {
                            baseData.classRelated = modeDetails.Class;
                            baseData.type = modeDetails.Type;
                        } else {
                            baseData.bookName = modeDetails.BookName;
                            baseData.unit = modeDetails.Unit; 
                        }
                        return baseData;
                    });
                } else {
                    finalPackageLog.combinedData = combinedData; 
                }
            } else {
                finalPackageLog.combinedData = { error: "Missing or malformed data prevented combination." };
            }
            
            
            // --- FIREBASE UPLOAD PROCESS (Both collections) ---
            const finalQuestionArray = finalPackageLog.combinedData;
            
            if (!Array.isArray(finalQuestionArray)) {
                console.error("Upload failed: Structured data is invalid.", finalQuestionArray.error);
                toggleLoadingState(false); // Stop loading
                errorMessage.textContent = `❌ Upload failed: ${finalQuestionArray.error || 'Data structuring error.'}`;
                errorMessage.style.color = 'red';
                return;
            }

            // Clean up the temporary arrays
            delete finalPackageLog.parsedQuestions;
            delete finalPackageLog.parsedAnswers;
            delete finalPackageLog.Mode_Details;
            delete finalPackageLog.questionType;
            delete finalPackageLog.questionSetName;
            delete finalPackageLog.uploadedQuestionFileName;
            delete finalPackageLog.uploadedAnswerFileName;
            delete finalPackageLog.numberOfQuestions;

            // Start the Firebase upload
            toggleLoadingState(true, `Uploading ${finalQuestionArray.length} questions and set metadata...`);
            
            try {
                // 1. Initialize Firestore Batch
                const batch = db.batch();
                const questionBankRef = db.collection('questionBank'); 
                const questionSetsRef = db.collection('questionSets'); 

                // 2. ADD QUESTION SET METADATA (One single document for the whole set)
                // Using the uploadFileName as the document ID
                const setDocRef = questionSetsRef.doc(questionSetMetadata.uploadFileName); 
                batch.set(setDocRef, questionSetMetadata);

                // 3. Loop through individual questions and add them to the batch (questionBank)
                finalQuestionArray.forEach(question => {
                    const docRef = questionBankRef.doc(); // Firestore auto-generates a document ID
                    batch.set(docRef, question);
                });
                
                // 4. Commit the batch (single network request for both collections)
                await batch.commit();

                // 5. Success feedback
                console.log(`✅ SUCCESSFULLY UPLOADED ${finalQuestionArray.length} questions to 'questionBank' and 1 document to 'questionSets'.`);
                toggleLoadingState(false);
                errorMessage.textContent = `✅ Upload complete! ${finalQuestionArray.length} Qs uploaded & Set: ${questionSetName} registered.`;
                errorMessage.style.color = '#27ae60';
                
            } catch (error) {
                // 6. Failure feedback
                console.error("🔥 FATAL FIREBASE UPLOAD ERROR:", error);
                toggleLoadingState(false);
                errorMessage.textContent = `❌ Upload failed. See console for Firebase error details.`;
                errorMessage.style.color = 'red';
            }
            
        });
    }
});