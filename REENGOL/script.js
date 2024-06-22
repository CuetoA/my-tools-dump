document.getElementById('compareButton').addEventListener('click', compareTexts);

function preprocessText(text) {
    // Remove leading and trailing spaces
    text = text.trim();
    // Replace punctuation with spaces
    text = text.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    // Convert to lowercase
    text = text.toLowerCase();
    // Replace multiple spaces with a single space
    text = text.replace(/\s\s+/g, ' ');
    return text;
}

function compareTexts() {
    const referenceText = preprocessText(document.getElementById('referenceText').value).split(' ');
    const compareText = preprocessText(document.getElementById('compareText').value).split(' ');

    let referenceHTML = '';
    let compareHTML = '';

    let maxLength = Math.max(referenceText.length, compareText.length);

    for (let i = 0; i < maxLength; i++) {
        if (referenceText[i] === compareText[i]) {
            referenceHTML += `<span>${referenceText[i]} </span>`;
            compareHTML += `<span>${compareText[i]} </span>`;
        } else {
            if (referenceText[i] !== undefined) {
                referenceHTML += `<span style="background-color: orange;">${referenceText[i]} </span>`;
            }
            if (compareText[i] !== undefined) {
                compareHTML += `<span style="background-color: green;">${compareText[i]} </span>`;
            } else {
                compareHTML += `<span style="background-color: green;">&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
            }
        }
    }

    document.getElementById('referenceText').parentElement.innerHTML = referenceHTML;
    document.getElementById('compareText').parentElement.innerHTML = compareHTML;
}
