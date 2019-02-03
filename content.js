chrome.runtime.onMessage.addListener(
    function receiveMessage(request, sender, sendResponse) {
        if (request.message === "getDocumentLength") {
            if (request.elements === undefined) {
                sendResponse(document.body.innerHTML.length)
            }
        }
    });