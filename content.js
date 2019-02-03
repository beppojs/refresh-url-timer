chrome.runtime.onMessage.addListener(
    function receiveMessage(request, sender, sendResponse) {
        if (request.message === "getDocumentLength") {
            // Take by default body length if elements are not defined in the request
            if (request.elements === undefined) {
                sendResponse(document.body.innerHTML.length)
            }
        }
    });