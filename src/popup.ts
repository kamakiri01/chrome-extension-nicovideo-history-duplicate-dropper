interface SwitchElement extends HTMLElement {
  checked: boolean;
}

document.addEventListener("DOMContentLoaded", function () {
    const switchElement = document.getElementById("my-switch") as SwitchElement;
    const statusDisplay = document.getElementById("status");

    // Check current state from storage
    chrome.storage.sync.get(["enabled"], function(result) {
        const isEnabled = result.enabled !== false; // Default to true if not set
        updateButtonState(isEnabled);
    })

    // Toggle button click handler
    switchElement.addEventListener("click", function() {
        console.log("click");
        chrome.storage.sync.get(["enabled"], function(result) {
            const newEnabled = switchElement.checked;

            // Update storage
            chrome.storage.sync.set({enabled: newEnabled}, function() {
                updateButtonState(newEnabled);
                const newIcon = newEnabled ? "image/chrome-extension-nicovideo-icon_on.png" : "image/chrome-extension-nicovideo-icon_off.png";
                chrome.action.setIcon({ path: newIcon });

                // Send message to content script
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to content script:", chrome.runtime.lastError);
                    } else {
                        chrome.tabs.sendMessage(tabs[0].id!, {action: "toggle", enabled: newEnabled});
                    }
                });
            });
        });
    });

    function updateButtonState(isEnabled: boolean) {
        switchElement.checked = isEnabled;
    }
});
