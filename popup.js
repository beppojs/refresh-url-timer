document.addEventListener('DOMContentLoaded', init);

let isRefreshed = false;
let autoRefresh = false;
let lastRefreshDocumentSize = 0;
let lastRefreshDate;

/**
 * Initialize Popup
 */
function init() {
    // Register EventListener
    document.getElementById("apply").addEventListener("click", activeTimerForRefreshing);
    document.getElementById("autorefresh").addEventListener("change", changeAutoRefresh);

    // Assuming that there is no offset between local time and remote server time
    let txtTime = document.getElementById("time");
    startLiveClock(txtTime);
}

/**
 * Starts an Live Clock in the Popup and refreshes every 100Ms
 * @param txtTime
 */
function startLiveClock(txtTime) {

    const currentDate = new Date();
    let currentHour = currentDate.getHours();
    let currentMinute = currentDate.getMinutes();
    let currentSeconds = currentDate.getSeconds();
    let currentMilliseconds = currentDate.getMilliseconds();

    txtTime.textContent = checkTime(currentHour) + ":" + checkTime(currentMinute) + ":" + checkTime(currentSeconds) + ":" + checkTime(currentMilliseconds);

    setTimeout(function () {
        startLiveClock(txtTime);
    }, 100)

}

/**
 * Time Formatting
 */
function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }
    return i;
}

/**
 * Updating AutoRefresh value
 */
function changeAutoRefresh() {
    autoRefresh = document.querySelector("#autorefresh").checked;
}

/**
 * Actives the Timer for refreshing the Page to the defined time
 */
function activeTimerForRefreshing() {

    isRefreshed = false;

    // Get the defined refresh time
    let txtStartTime = document.getElementById("start_time");

    if (!txtStartTime.value) {
        showMessage("Please define an URL Opening Time");
        return;
    }

    let startDate = new Date();
    try {
        let startTime = txtStartTime.value.split(':');

        startDate.setHours(+startTime[0]); // set Time accordingly, using implicit type coercion
        startDate.setMinutes(startTime[1]);
        startDate.setSeconds(startTime[2]);
        startDate.setMilliseconds(0);

    } catch (err) {
        showMessage(err);
        return;
    }

    let txtOffset = document.getElementById("offset");
    if (!txtOffset.value) {
        showMessage("Please define an Offset in Milliseconds");
        return;
    } else if (txtOffset.value < 0) {
        showMessage("Please define a positive Offset in Milliseconds");
        return;
    }

    // Subtract Offset from current Date
    let startDateWithOffset = new Date(startDate.getTime() - txtOffset.value);
    let refreshHour = startDateWithOffset.getHours();
    let refreshMinute = startDateWithOffset.getMinutes();
    let refreshSeconds = startDateWithOffset.getSeconds();
    let refreshMilliseconds = startDateWithOffset.getMilliseconds();

    let txtTimeRefresh = document.getElementById("time_refresh");
    txtTimeRefresh.textContent = checkTime(refreshHour) + ":" + checkTime(refreshMinute) + ":" + checkTime(refreshSeconds) + ":" + checkTime(refreshMilliseconds)

    startRefreshWatcher(startDateWithOffset);
}

/**
 * Starts the refresh Watcher which checks the Time every Millisecond
 */
function startRefreshWatcher(startDateWithOffset) {
    const currentDate = new Date();

    if (isRefreshed === false && currentDate >= startDateWithOffset) {
        refreshTab();
        isRefreshed = true;
        return;
    }

    if (!isRefreshed) {
        setTimeout(function () {
            startRefreshWatcher(startDateWithOffset);
        }, 1)
    }
}

/**
 * Refresh the active Tab and logs the refresh interval
 */
function refreshTab() {
    if (lastRefreshDate) {
        // Logging the Refresh Interval in ms
        let refreshInterval = new Date() - lastRefreshDate;
        console.log(refreshInterval);
    }

    lastRefreshDate = new Date();
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
    });
}

function showMessage(message) {
    let messageBox = document.getElementById("messages");
    messageBox.innerHTML = message
}

/**
 * Check whether the page is fully loaded or not
 * If page is fully loaded, reload page if nothing changed
 */
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.status === "complete") {
            if (autoRefresh) {
                console.log("AutoRefresh is activated");

                // Check for Changes on the Body Content
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

                    // Receive from Content Script the Size of the given element
                    // If no elements defined, take body as default element
                    let message = {"message": "getDocumentLength"};

                    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
                        if (lastRefreshDocumentSize === 0) {
                            // First time the document was loaded
                            lastRefreshDocumentSize = response;
                            refreshTab();
                        } else if (lastRefreshDocumentSize === response) {
                            // Document did not change
                            refreshTab();
                        } else {
                            console.log("Page has changed. AutoRefresh stopped.");
                        }
                    });
                });
            }
        }
    });
