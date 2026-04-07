chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('[OrbitPost X-Automator] Received external message:', request);

  if (request.type === 'POST_TWEET') {
    const { content } = request;

    // Store the text to be posted
    chrome.storage.local.set({ pendingTweet: content }, () => {
      // Open Twitter Compose
      chrome.tabs.create({ url: 'https://x.com/compose/post' }, (tab) => {
        sendResponse({ success: true, tabId: tab.id });
      });
    });
    return true; // Keep channel open for async response
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PENDING_TWEET') {
    chrome.storage.local.get(['pendingTweet'], (result) => {
      sendResponse({ content: result.pendingTweet });
      // Clear after retrieval
      chrome.storage.local.remove(['pendingTweet']);
    });
    return true;
  }
});
