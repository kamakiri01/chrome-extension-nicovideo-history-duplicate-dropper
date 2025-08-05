document.addEventListener('DOMContentLoaded', function () {
  // const toggleButton = document.getElementById('toggle');
  const switchElement = document.getElementById('my-switch');
  const statusDisplay = document.getElementById('status');

  // Check current state from storage
  chrome.storage.sync.get(['enabled'], function(result) {
    const isEnabled = result.enabled !== false; // Default to true if not set
    updateButtonState(isEnabled);
  })

  // Toggle button click handler
  switchElement.addEventListener("click", function() {
    console.log("click");
    chrome.storage.sync.get(['enabled'], function(result) {
      //const isEnabled = result.enabled !== false;
      //const newEnabled = !isEnabled;
      const newEnabled = switchElement.checked;
      
       // Update storage
       chrome.storage.sync.set({enabled: newEnabled}, function() {
         updateButtonState(newEnabled);
         
         // Send message to content script
         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
           if (chrome.runtime.lastError) {
             console.error('Error sending message to content script:', chrome.runtime.lastError);
           } else {
             chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle', enabled: newEnabled});
           }
         });
       });
      });
  });

  function updateButtonState(isEnabled) {
    switchElement.checked = isEnabled;
    //toggleButton.textContent = isEnabled ? 'Disable' : 'Enable';
    //statusDisplay.textContent = `Status: ${isEnabled ? 'On' : 'Off'}`;
  }
});