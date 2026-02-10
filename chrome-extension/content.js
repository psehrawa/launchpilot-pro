// LaunchPilot Pro Chrome Extension - Content Script
// Extracts profile data from LinkedIn pages

function extractProfileData() {
  // Check if we're on a profile page
  const isProfilePage = window.location.href.includes('/in/');
  
  if (!isProfilePage) {
    return null;
  }
  
  // Try multiple selectors for name (LinkedIn changes these often)
  const nameSelectors = [
    'h1.text-heading-xlarge',
    '.pv-top-card--list li:first-child',
    '.pv-text-details__left-panel h1',
    '[data-generated-suggestion-target]',
    '.artdeco-entity-lockup__title',
  ];
  
  let name = '';
  for (const selector of nameSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      name = el.textContent.trim();
      break;
    }
  }
  
  // Try multiple selectors for title/headline
  const titleSelectors = [
    '.text-body-medium.break-words',
    '.pv-top-card--list-bullet li',
    '.pv-text-details__left-panel .text-body-medium',
    '[data-generated-suggestion-target] + div',
  ];
  
  let title = '';
  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      title = el.textContent.trim();
      break;
    }
  }
  
  // Extract company from experience section or headline
  const companySelectors = [
    '.pv-top-card--experience-list-item',
    '.experience-item__subtitle',
    '.pv-entity__secondary-title',
  ];
  
  let company = '';
  for (const selector of companySelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      company = el.textContent.trim();
      break;
    }
  }
  
  // If no company found, try to extract from headline
  if (!company && title) {
    // Common patterns: "Role at Company" or "Role @ Company"
    const atMatch = title.match(/(?:at|@)\s+(.+?)(?:\s*[|•·]|$)/i);
    if (atMatch) {
      company = atMatch[1].trim();
    }
  }
  
  // Get profile URL
  const profileUrl = window.location.href.split('?')[0];
  
  // Get profile image
  const imgSelectors = [
    '.pv-top-card-profile-picture__image',
    '.presence-entity__image',
    '.profile-photo-edit__preview',
  ];
  
  let imageUrl = '';
  for (const selector of imgSelectors) {
    const el = document.querySelector(selector);
    if (el?.src) {
      imageUrl = el.src;
      break;
    }
  }
  
  // Get location
  const locationSelectors = [
    '.pv-top-card--list-bullet .text-body-small',
    '.pv-top-card--list.pv-top-card--list-bullet li:last-child',
  ];
  
  let location = '';
  for (const selector of locationSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      location = el.textContent.trim();
      break;
    }
  }
  
  return {
    name,
    title,
    company,
    profileUrl,
    imageUrl,
    location,
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProfile') {
    const data = extractProfileData();
    sendResponse(data);
  }
  return true;
});

// Add floating capture button on profile pages
function addFloatingButton() {
  if (!window.location.href.includes('/in/')) return;
  if (document.getElementById('launchpilot-capture-btn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'launchpilot-capture-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    <span>Save Lead</span>
  `;
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.2s;
  `;
  
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
  });
  
  btn.addEventListener('click', async () => {
    const data = extractProfileData();
    if (!data) {
      alert('Could not extract profile data');
      return;
    }
    
    btn.innerHTML = '<span>Saving...</span>';
    btn.disabled = true;
    
    try {
      const apiUrl = await new Promise((resolve) => {
        chrome.storage.local.get(['apiUrl'], (data) => {
          resolve(data.apiUrl || 'https://launchpilot-pro.vercel.app');
        });
      });
      
      const nameParts = (data.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await fetch(`${apiUrl}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company: data.company || '',
          title: data.title || '',
          linkedin_url: data.profileUrl || '',
          source: 'linkedin_extension',
          status: 'new',
          tags: ['linkedin'],
        }),
      });
      
      if (!response.ok) throw new Error('Failed');
      
      btn.innerHTML = '✓ Saved!';
      btn.style.background = '#16a34a';
      
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>Save Lead</span>
        `;
        btn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
        btn.disabled = false;
      }, 2000);
      
    } catch (err) {
      btn.innerHTML = '✗ Failed';
      btn.style.background = '#dc2626';
      
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>Save Lead</span>
        `;
        btn.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
        btn.disabled = false;
      }, 2000);
    }
  });
  
  document.body.appendChild(btn);
}

// Run on page load and URL changes
addFloatingButton();

// Watch for URL changes (LinkedIn is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(addFloatingButton, 1000);
  }
}).observe(document, { subtree: true, childList: true });
