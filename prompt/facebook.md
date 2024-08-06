# Facebook comments

## Get All Comments 
```javascript
async function clickViewAllReplies() {
    document.querySelectorAll('div[role="button"]').forEach(button => {
        if (button.innerText.includes('View')) {
            button.click();
        }
    });
}

async function executeScript() {
    for (let i = 0; i < 5; i++) {
        await clickViewAllReplies();
        await new Promise(resolve => setTimeout(resolve, 800));
    }
}

function getCommentsHtml() {
    document.querySelectorAll('div').forEach(div => {
        if (div.innerText.includes('All comments')) {
            const topDiv = div.closest('div.html-div');
            if (topDiv) {
                const clonedDiv = topDiv.cloneNode(true);

                function cleanElement(el) {
                    ['class', 'attributionsrc', 'style', 'aria-hidden'].forEach(attr => el.removeAttribute(attr));
                    Array.from(el.children).forEach(cleanElement);
                }

                cleanElement(clonedDiv);

                ['circle', 'svg', 'input', 'img'].forEach(selector =>
                    clonedDiv.querySelectorAll(selector).forEach(el => el.remove())
                );

                console.log(clonedDiv.outerHTML);
            }
        }
    });
}

async function main() {
    await executeScript();
    getCommentsHtml();
}

main();
```