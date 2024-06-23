document.getElementById('compareButton').addEventListener('click', async () => {
    const refText = document.getElementById('referenceText').value;
    const compText = document.getElementById('compareText').value;

    const preprocessedRefText = preprocessText(refText);
    const preprocessedCompText = preprocessText(compText);

    try {
        const { differences, contextual_differences } = await compareTexts(preprocessedRefText, preprocessedCompText);
        console.log('Differences:', differences);
        console.log('Contextual Differences:', contextual_differences);

        const highlighted = highlightDifferences(refText, compText, differences, contextual_differences);

        document.getElementById('referenceTextContainer').innerHTML = `<div class="text-result">${highlighted.highlightedRefText}</div>`;
        document.getElementById('compareTextContainer').innerHTML = `<div class="text-result">${highlighted.highlightedCompText}</div>`;
    } catch (error) {
        console.error('Error comparing texts:', error);
    }
});

function preprocessText(text) {
    // Remove leading and trailing spaces
    text = text.trim();
    // Replace punctuation with spaces
    text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ");
    text = text.replace(/’/g, "'");
    // Replace multiple spaces with a single space
    text = text.replace(/\s+/g, ' ');
    // Convert to lowercase
    text = text.toLowerCase();
    // Replace multiple spaces with a single space
    // text = text.replace(/\s\s+/g, ' ');
    return text;
}

async function compareTexts(referenceText, comparisonText) {
    const prompt = `
        I will provide two texts: a reference text and a comparison text. Your task is to compare these texts and identify words that are different or missing in their respective positions. Output the differences as two dictionaries.

        The first dictionary ("differences") should include only the words that are different or missing in their respective positions. 

        The second dictionary ("contextual_differences") should include the different words along with two words before and two words after the differing word in both texts.

        The format should be as follows:
        {
            "differences": {reference_word1: comparison_word1, reference_word2: comparison_word2, ...},
            "contextual_differences": {reference_phrase1: comparison_phrase1, reference_phrase2: comparison_phrase2, ...}
        }

        Example:
        Reference text:
        "This is my testing text, do you like it I’m not sure how good is it, but I think is improving a lot what about you The other day I ordered a taco and it was deliccious"

        Comparison text:
        "This is my testing test do you like it I am not sure how wood is it, but I think is improving a lot what about you The other week I swallowed a taco and it was deliccious"

        Output:
        {
            "differences": {"text": "test", "I’m": "I am", "good": "wood", "day": "week", "ordered": "swallowed"},
            "contextual_differences": {"testing text do": "testing test do", "I’m not sure": "I am not sure", "how good is": "how wood is", "other day I": "other week I", "I ordered a": "I swallowed a"}
        }

        Only provide the "differences" and "contextual_differences" dictionaries in the output, without any additional text.

        Reference text:
        "${referenceText}"

        Comparison text:
        "${comparisonText}"
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer `
        },
        body: JSON.stringify({
            "model": "gpt-4o",
            "messages": [{ "role": "user", "content": prompt }],
            "max_tokens": 1000,
            // "temperature": 0.5
        })
    });
    
    if (!response.ok) {
        const errorDetails = await response.json();
        console.error(`API request failed with status ${response.status}:`, errorDetails);
        throw new Error(`API request failed with status ${response.status}: ${errorDetails.error.message}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Failed to parse API response: ${text}`);
    }
}

function highlightDifferences(refText, compText, differences, contextualDifferences) {
    const refWords = refText.split(' ');
    const compWords = compText.split(' ');

    // Highlight differences in reference text
    for (const [refWord, compWord] of Object.entries(differences)) {
        const refPhrase = Object.keys(contextualDifferences).find(key => key.includes(refWord));
        const compPhrase = contextualDifferences[refPhrase];

        // Check if refPhrase and compPhrase are defined
        if (!refPhrase || !compPhrase) {
            console.error(`Phrase not found for word: ${refWord}`);
            continue;
        }

        const refPhraseWords = refPhrase.split(' ');
        const compPhraseWords = compPhrase.split(' ');

        const refIndex = refWords.findIndex((word, i) => refPhraseWords.every((phraseWord, j) => refWords[i + j] === phraseWord));
        const compIndex = compWords.findIndex((word, i) => compPhraseWords.every((phraseWord, j) => compWords[i + j] === phraseWord));

        if (refIndex !== -1) {
            refWords[refIndex + refPhraseWords.indexOf(refWord)] = `<span style="background-color: orange;">${refWord}</span>`;
        }

        if (compIndex !== -1) {
            compWords[compIndex + compPhraseWords.indexOf(compWord)] = `<span style="background-color: green;">${compWord}</span>`;
        }
    }

    return {
        highlightedRefText: refWords.join(' '),
        highlightedCompText: compWords.join(' ')
    };
}
