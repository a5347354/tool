# Facebook comments

## Click All Reply
```javascript
function clickViewAllReplies() {
    document.querySelectorAll('div[role="button"]').forEach(button => {
        if (button.innerText.includes('View')) {
            button.click();
        }
    });
}
async function executeScript() {
    for (let i = 0; i < 5; i++) {
        clickViewAllReplies();
        await new Promise(resolve => setTimeout(resolve, 300)); 
    }
}
executeScript()
```

## Get html of Comments
```javascript
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
```