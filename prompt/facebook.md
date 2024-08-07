# Facebook comments

## Get All Comments 
```javascript
async function findDivReverse() {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (let i = allDivs.length - 1; i >= 0; i--) {
        const div = allDivs[i];
        if (div.innerHTML.includes('comment_id') && div.innerText.includes('All comments')) {
            return div;
        }
    }
    return null;
}

async function clickViewAllReplies() {
    document.querySelectorAll('div[role="button"]').forEach(button => {
        if (button.innerText.includes('View')) {
            button.click();
        }
    });
}

async function expandAllReplies(iterations = 5, delay = 800) {
    for (let i = 0; i < iterations; i++) {
        await clickViewAllReplies();
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

function cleanElement(el) {
    ['class', 'attributionsrc', 'style', 'aria-hidden'].forEach(attr => el.removeAttribute(attr));
    Array.from(el.children).forEach(cleanElement);
}

function removeUnwantedElements(el) {
    ['circle', 'svg', 'input', 'img'].forEach(selector =>
        el.querySelectorAll(selector).forEach(node => node.remove())
    );
}

function getCleanedHtml(div) {
    const clonedDiv = div.cloneNode(true);
    cleanElement(clonedDiv);
    removeUnwantedElements(clonedDiv);
    return clonedDiv.outerHTML;
}

function copyToClipboard(text) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
}

async function main() {
    await expandAllReplies();
    const targetDiv = await findDivReverse();
    if (targetDiv) {
        const cleanedHtml = getCleanedHtml(targetDiv);
        console.log(cleanedHtml);
        copyToClipboard(cleanedHtml);
    } else {
        console.log("No matching div found.");
    }
}

main();
```