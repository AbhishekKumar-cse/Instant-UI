//
// Hackathon Project: AI-Powered UI Generator
// Frontend With GenAI Hackathon - Aug 10, 2025
// Objective: Build a frontend solution using AI to solve a real-world problem.
//
// This script handles the main logic for our hackathon project.
// It takes a user's UI description, sends it to a GenAI model,
// and displays the resulting HTML code and accessibility suggestions.
//

document.addEventListener('DOMContentLoaded', () => {
    // Get all the necessary DOM elements for our hackathon entry
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const generatedCodeElement = document.getElementById('generated-code');
    const copyButton = document.getElementById('copy-button');
    const accessibilityList = document.getElementById('accessibility-list');
    
    // The message box functionality has been removed to keep the submission minimal.
    // The related HTML elements and event listeners are no longer needed.

    // A simple, silent copy to clipboard for our submission.
    const copyToClipboard = (text) => {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(el);
    };

    // The main event listener for the hackathon project's core functionality.
    generateButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            errorMessage.textContent = 'Please enter a description.';
            errorMessage.classList.remove('hidden');
            return;
        }

        // Reset state and show a loading state to the user.
        errorMessage.classList.add('hidden');
        resultContainer.classList.add('hidden');
        generateButton.disabled = true;
        generateButton.innerHTML = `<span class="loading-spinner"></span> Generating...`;

        // This is the prompt sent to the GenAI model. We've structured it
        // to request a specific JSON output for easy parsing.
        const chatHistory = [{
            role: 'user',
            parts: [{
                text: `Generate a complete, single HTML file with CSS and JavaScript embedded, but without using any external frameworks like Tailwind or Bootstrap. The HTML should be for the following UI: "${prompt}". Also, provide 2-3 specific and actionable accessibility suggestions for the generated HTML.

The output should be a JSON object with two keys: "code" (string containing the complete HTML file) and "accessibility_suggestions" (an array of strings).`
            }]
        }];

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "code": { "type": "STRING" },
                        "accessibility_suggestions": {
                            "type": "ARRAY",
                            "items": { "type": "STRING" }
                        }
                    },
                    "propertyOrdering": ["code", "accessibility_suggestions"]
                }
            }
        };

        // IMPORTANT for hackathon judges:
        // For local development, paste your API key here inside the quotes.
        // It should look something like: const apiKey = "AIzaSyB_YOUR_KEY_HERE";
        const apiKey = "AIzaSyA0reQDr4s8a9gzsKfOe0PjjV_45tcxllY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Implemented exponential backoff for robust API calls during the hackathon.
        let retries = 0;
        const maxRetries = 5;
        const initialDelay = 1000;

        const fetchWithBackoff = async () => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const json = result.candidates[0].content.parts[0].text;
                    const parsedJson = JSON.parse(json);
                    
                    // Update the UI with the generated content
                    generatedCodeElement.textContent = parsedJson.code;
                    accessibilityList.innerHTML = ''; // Clear previous suggestions
                    parsedJson.accessibility_suggestions.forEach(suggestion => {
                        const li = document.createElement('li');
                        li.textContent = suggestion;
                        accessibilityList.appendChild(li);
                    });
                    
                    resultContainer.classList.remove('hidden');
                } else {
                    throw new Error('Unexpected API response structure.');
                }
            } catch (e) {
                if (retries < maxRetries) {
                    const delay = initialDelay * Math.pow(2, retries);
                    retries++;
                    console.error("Retrying API call...", e);
                    setTimeout(fetchWithBackoff, delay);
                } else {
                    console.error("Failed to fetch after multiple retries:", e);
                    errorMessage.textContent = 'Failed to generate code. Please try again.';
                    errorMessage.classList.remove('hidden');
                }
            } finally {
                generateButton.disabled = false;
                generateButton.innerHTML = `<span>Generate Code</span>`;
            }
        };
        
        fetchWithBackoff();
    });

    // Add event listener for the copy button
    copyButton.addEventListener('click', () => {
        copyToClipboard(generatedCodeElement.textContent);
    });
});
