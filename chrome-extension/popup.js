// LaunchPilot Pro Chrome Extension - Popup

const DEFAULT_API_URL = 'https://launchpilot-pro.vercel.app';

let currentContact = null;

// Load settings
chrome.storage.local.get(['apiUrl', 'captureCount', 'lastCaptureDate'], (data) => {
  document.getElementById('api-url').value = data.apiUrl || DEFAULT_API_URL;
  
  // Reset count if new day
  const today = new Date().toDateString();
  if (data.lastCaptureDate !== today) {
    chrome.storage.local.set({ captureCount: 0, lastCaptureDate: today });
    updateCount(0);
  } else {
    updateCount(data.captureCount || 0);
  }
});

// Save API URL on change
document.getElementById('api-url').addEventListener('change', (e) => {
  chrome.storage.local.set({ apiUrl: e.target.value });
});

// Check if on LinkedIn and get profile data
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  
  if (!tab.url?.includes('linkedin.com')) {
    document.getElementById('status').textContent = 'Not on LinkedIn';
    document.getElementById('status').className = 'status disconnected';
    return;
  }

  document.getElementById('status').textContent = 'Connected to LinkedIn';
  document.getElementById('status').className = 'status connected';
  
  // Get profile data from content script
  chrome.tabs.sendMessage(tab.id, { action: 'getProfile' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      document.getElementById('status').textContent = 'Navigate to a profile page';
      return;
    }
    
    currentContact = response;
    document.getElementById('capture-area').style.display = 'block';
    document.getElementById('contact-name').textContent = response.name || '-';
    document.getElementById('contact-title').textContent = response.title || '-';
    document.getElementById('contact-company').textContent = response.company || '-';
  });
});

// Capture button click
document.getElementById('capture-btn').addEventListener('click', async () => {
  if (!currentContact) return;
  
  const btn = document.getElementById('capture-btn');
  const msg = document.getElementById('message');
  const apiUrl = document.getElementById('api-url').value || DEFAULT_API_URL;
  
  btn.disabled = true;
  btn.innerHTML = '<span>Saving...</span>';
  
  try {
    // Parse name
    const nameParts = (currentContact.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Extract domain from company (if possible)
    const company = currentContact.company || '';
    
    const response = await fetch(`${apiUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        company: company,
        title: currentContact.title || '',
        linkedin_url: currentContact.profileUrl || '',
        source: 'linkedin_extension',
        status: 'new',
        tags: ['linkedin'],
      }),
    });
    
    if (!response.ok) throw new Error('Failed to save');
    
    // Update count
    chrome.storage.local.get(['captureCount'], (data) => {
      const newCount = (data.captureCount || 0) + 1;
      chrome.storage.local.set({ captureCount: newCount });
      updateCount(newCount);
    });
    
    msg.className = 'success';
    msg.textContent = '✓ Saved to LaunchPilot!';
    msg.style.display = 'block';
    
    btn.innerHTML = '✓ Saved!';
    
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Save to LaunchPilot`;
      msg.style.display = 'none';
    }, 2000);
    
  } catch (err) {
    msg.className = 'error';
    msg.textContent = 'Failed to save. Check API URL.';
    msg.style.display = 'block';
    
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Save to LaunchPilot`;
  }
});

function updateCount(count) {
  document.getElementById('count').textContent = `${count} lead${count === 1 ? '' : 's'} captured today`;
}
