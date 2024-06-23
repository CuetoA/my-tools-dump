async function loadApiKey() {
    const response = await fetch('config.json');
    const config = await response.json();

    console.log('Im here inside loading apikey')

    return config.apiKey;
}


document.getElementById('compareButton').addEventListener('click', async () => {
    const apiKey = await loadApiKey(); 

    const refText = document.getElementById('referenceText').value;
    const compText = document.getElementById('compareText').value;

    const preprocessedRefText = preprocessText(refText);
    const preprocessedCompText = preprocessText(compText);

    const windowSize = 14;
    const tolerance = 3;

    const refWindows = createWindows(preprocessedRefText, windowSize);
    let highlightedRefText = '';
    let highlightedCompText = '';
    let lastCompIndex = 0;

    for (const refWindowObj of refWindows) {
        const refWindow = refWindowObj.window;
        const compWindowObj = findWindowInText(refWindow, preprocessedCompText.slice(lastCompIndex), tolerance);

        if (compWindowObj) {
            const refWords = refWindow.split(' ');
            const compWords = preprocessedCompText.split(' ').slice(compWindowObj.startIndex, compWindowObj.endIndex).join(' ');

            try {
                const differences = await compareWindows(refWindow, compWords);
                const highlighted = highlightDifferences(refWindow, compWords, differences);
                highlightedRefText += highlighted.highlightedRefText + ' ';
                highlightedCompText += highlighted.highlightedCompText + ' ';
                lastCompIndex = compWindowObj.endIndex;
            } catch (error) {
                console.error('Error comparing windows:', error);
            }
        } else {
            highlightedRefText += `<span style="background-color: orange;">${refWindow}</span> `;
            highlightedCompText += `<span style="background-color: green;">${refWindow}</span> `;
        }
    }

    document.getElementById('referenceTextContainer').innerHTML = `<div class="text-result">${highlightedRefText}</div>`;
    document.getElementById('compareTextContainer').innerHTML = `<div class="text-result">${highlightedCompText}</div>`;
});

function preprocessText(text) {
    // Remove leading and trailing spaces
    text = text.trim();
    // Replace punctuation with spaces
    text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    // Convert to lowercase
    text = text.toLowerCase();
    // Replace multiple spaces with a single space
    text = text.replace(/\s\s+/g, ' ');
    return text;
}

function createWindows(text, windowSize) {
    const words = text.split(' ');
    const windows = [];
    for (let i = 0; i <= words.length - windowSize; i += windowSize) {
        const window = words.slice(i, i + windowSize).join(' ');
        windows.push({ startIndex: i, window });
    }
    return windows;
}

function findWindowInText(window, compareText, tolerance) {
    const words = compareText.split(' ');
    const windowWords = window.split(' ');
    const windowSize = windowWords.length;
    const searchWindowSize = windowSize + 2 * tolerance;

    for (let i = 0; i <= words.length - searchWindowSize; i++) {
        const searchWindow = words.slice(i, i + searchWindowSize).join(' ');
        if (searchWindow.includes(windowWords[0]) && searchWindow.includes(windowWords[windowWords.length - 1])) {
            return { startIndex: i, endIndex: i + searchWindowSize };
        }
    }
    return null;
}

async function compareWindows(referenceWindow, comparisonWindow) {
    const prompt = `
        I will provide two texts: a reference text and a comparison text. Your task is to compare these texts and identify words that are different or missing in their respective positions. Output the differences as a dictionary in the following format:
        {reference_word1: comparison_word1, reference_word2: comparison_word2, ...}
        Only include words that are different or missing in their respective positions. Ensure the output is non-verbose and strictly follows the dictionary format.
        
        Reference text:
        "${referenceWindow}"
        
        Comparison text:
        "${comparisonWindow}"
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            "model": 'gpt-3.5-turbo',
            "messages": [{"role": 'user', "content": prompt}],
            "max_tokens": 1000,
            "temperature": 0.5
        })
    });
    
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Failed to parse API response: ${text}`);
    }
}

function highlightDifferences(refText, compText, differences) {
    const refWords = refText.split(' ');
    const compWords = compText.split(' ');

    refWords.forEach((word, index) => {
        if (differences[word]) {
            refWords[index] = `<span style="background-color: orange;">${word}</span>`;
            compWords[index] = `<span style="background-color: green;">${differences[word]}</span>`;
        }
    });

    return {
        highlightedRefText: refWords.join(' '),
        highlightedCompText: compWords.join(' ')
    };
}
