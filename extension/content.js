(function() {
  console.log('[OrbitPost X-Automator] Content script loaded on:', window.location.href);

  // --- 1. Dashboard Auto-Discovery Handshake ---
  // If we're on the OrbitPost dashboard, tell the page our Extension ID
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('orbitpost')) {
    console.log('[OrbitPost X-Automator] Dashboard detected. Sending handshake...');
    window.postMessage({ 
      type: 'ORBITPOST_EXTENSION_DISCOVERED', 
      extensionId: chrome.runtime.id 
    }, "*");
  }

  // --- 2. Twitter/X Automation Logic ---
  if (!window.location.hostname.includes('x.com') && !window.location.hostname.includes('twitter.com')) {
    return;
  }

  const runAutomation = async () => {
    // 1. Check if we have a pending tweet
    const tweet = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_PENDING_TWEET' }, (response) => {
        resolve(response?.content);
      });
    });

    if (!tweet) {
      console.log('[OrbitPost X-Automator] No pending tweet found.');
      return;
    }

    console.log('[OrbitPost X-Automator] Preparing to post:', tweet);

    // 2. Wait for the tweet box to appear
    const waitForElement = (selector, timeout = 10000) => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
          const el = document.querySelector(selector);
          if (el) return resolve(el);
          if (Date.now() - startTime > timeout) return reject('Timeout');
          setTimeout(check, 500);
        };
        check();
      });
    };

    try {
      const editor = await waitForElement('div[data-testid="tweetTextarea_0"]');
      console.log('[OrbitPost X-Automator] Editor found. Injecting text...');

      editor.focus();
      document.execCommand('insertText', false, tweet);

      await new Promise(r => setTimeout(r, 800));

      const postButton = await waitForElement('button[data-testid="tweetButtonInline"]');
      console.log('[OrbitPost X-Automator] Post button found. Clicking...');

      if (postButton.disabled) {
        console.warn('[OrbitPost X-Automator] Post button is disabled.');
        return;
      }

      postButton.click();
      console.log('[OrbitPost X-Automator] Post clicked!');

    } catch (err) {
      console.error('[OrbitPost X-Automator] Error during automation:', err);
    }
  };

  runAutomation();
})();
