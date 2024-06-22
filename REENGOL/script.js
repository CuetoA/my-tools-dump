document.getElementById('compareButton').addEventListener('click', compareTexts);

function compareTexts() {
    const referenceText = document.getElementById('referenceText').value.split(' ');
    const compareText = document.getElementById('compareText').value.split(' ');

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
