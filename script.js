

document.addEventListener('DOMContentLoaded', () => {
    
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const generatedCodeElement = document.getElementById('generated-code');
    const copyButton = document.getElementById('copy-button');
    const accessibilityList = document.getElementById('accessibility-list');
    
    
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

    
    generateButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            errorMessage.textContent = 'Please enter a description.';
            errorMessage.classList.remove('hidden');
            return;
        }

        
        errorMessage.classList.add('hidden');
        resultContainer.classList.add('hidden');
        generateButton.disabled = true;
        generateButton.innerHTML = `<span class="loading-spinner"></span> Generating...`;

        
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

        
        const apiKey = "AIzaSyA0reQDr4s8a9gzsKfOe0PjjV_45tcxllY";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        
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
                    
                    
                    generatedCodeElement.textContent = parsedJson.code;
                    accessibilityList.innerHTML = '';s
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

    
    copyButton.addEventListener('click', () => {
        copyToClipboard(generatedCodeElement.textContent);
    });
});
