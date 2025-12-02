// AI Tab Clear - Background Service Worker

// Default settings
const DEFAULT_SETTINGS = {
  idleTime: 30, // minutes
  minTabCount: 10, // minimum number of tabs before auto-close starts
  closeDuplicateDomains: true, // close duplicate domain tabs when count > 3
  autoCloseNativeTabs: true, // auto close native tabs (chrome://)
  nativeTabIdleTime: 30, // minutes for native tabs
  ignorePinnedTabs: true, // never close pinned tabs
  historyLimit: 100, // max number of history items
  groupingMethod: 'local', // 'local' or 'ai'
  aiSettings: {
    enabled: false,
    provider: 'gemini', // gemini, openai, grok
    apiKey: '',
    model: '' // optional custom model
  },
  whitelist: [],
  blacklist: [],
  isPaused: false
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI Tab Clear installed');
  
  // Initialize settings if not exists
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  
  // Initialize closed tabs history
  const { closedTabs } = await chrome.storage.local.get('closedTabs');
  if (!closedTabs) {
    await chrome.storage.local.set({ closedTabs: [] });
  }
  
  // Create alarm for periodic checking
  chrome.alarms.create('checkIdleTabs', { periodInMinutes: 1 });
});

// Check if URL matches any pattern in the list
function matchesPattern(url, patterns) {
  if (!patterns || patterns.length === 0) return false;
  
  return patterns.some(pattern => {
    // Simple string inclusion (fuzzy matching)
    // Case insensitive
    return url.toLowerCase().includes(pattern.toLowerCase());
  });
}

// Local Grouping Algorithm
function classifyTabLocal(tab) {
  const url = tab.url.toLowerCase();
  const title = (tab.title || '').toLowerCase();
  
  // Define rules: keyword -> category
  const rules = [
    { category: 'Development', keywords: ['github', 'gitlab', 'stackoverflow', 'dev', 'code', 'api', 'docs', 'localhost', '127.0.0.1'] },
    { category: 'Work', keywords: ['mail', 'calendar', 'drive', 'docs.google', 'sheet', 'slide', 'zoom', 'meet', 'slack', 'teams', 'office', 'notion', 'jira', 'confluence'] },
    { category: 'Social', keywords: ['twitter', 'x.com', 'facebook', 'instagram', 'linkedin', 'reddit', 'weibo', 'zhihu', 'discord', 'telegram', 'whatsapp'] },
    { category: 'Entertainment', keywords: ['youtube', 'bilibili', 'netflix', 'spotify', 'twitch', 'tiktok', 'douyin', 'iqiyi', 'youku', 'music', 'video', 'game', 'steam'] },
    { category: 'Shopping', keywords: ['amazon', 'taobao', 'jd.com', 'tmall', 'ebay', 'shop', 'store', 'buy', 'price'] },
    { category: 'News & Reading', keywords: ['news', 'blog', 'article', 'medium', 'wikipedia', 'wiki', 'read', 'book'] },
    { category: 'Search', keywords: ['google', 'bing', 'baidu', 'search', 'query'] }
  ];
  
  for (const rule of rules) {
    if (rule.keywords.some(k => url.includes(k) || title.includes(k))) {
      return rule.category;
    }
  }
  
  // Fallback: Use domain name as category if no rule matches
  try {
    const urlObj = new URL(tab.url);
    let domain = urlObj.hostname.replace('www.', '');
    // Capitalize first letter
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    return 'Other';
  }
}

// AI Classification Service
async function classifyTab(tab, settings) {
  // Check grouping method
  const method = settings.groupingMethod || 'local'; // 'ai' or 'local'
  
  // If local method selected, or AI not enabled/configured
  if (method === 'local' || !settings.aiSettings?.enabled || !settings.aiSettings?.apiKey) {
    return classifyTabLocal(tab);
  }

  const { provider, apiKey, model } = settings.aiSettings;
  const prompt = `Classify this browser tab into one single category (e.g., Work, Entertainment, Development, Reading, Shopping, Social, Other). Return ONLY the category name.
Title: ${tab.title}
URL: ${tab.url}`;

  try {
    let category = 'Uncategorized';

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Uncategorized';
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      category = data.choices?.[0]?.message?.content?.trim() || 'Uncategorized';
    } else if (provider === 'grok') {
      // Assuming Grok uses OpenAI-compatible API structure
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'grok-beta',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      category = data.choices?.[0]?.message?.content?.trim() || 'Uncategorized';
    }

    // Clean up category string (remove punctuation, extra spaces)
    return category.replace(/[^\w\s]/gi, '').trim() || 'Uncategorized';

  } catch (error) {
    console.error('AI Classification failed:', error);
    // Fallback to local classification on error
    return classifyTabLocal(tab);
  }
}

// Save closed tab to history
async function saveToHistory(tab) {
  const { closedTabs = [], settings } = await chrome.storage.local.get(['closedTabs', 'settings']);
  const currentSettings = settings || DEFAULT_SETTINGS;
  
  // Check for duplicates (same URL in recent history)
  const existingIndex = closedTabs.findIndex(item => item.url === tab.url);
  
  // Classify tab (always try to classify, method is handled inside)
  const category = await classifyTab(tab, currentSettings);
  
  const historyItem = {
    id: Date.now(),
    title: tab.title || 'Untitled',
    url: tab.url,
    closedAt: Date.now(),
    category: category
  };
  
  if (existingIndex !== -1) {
    // Update existing entry
    closedTabs[existingIndex] = historyItem;
  } else {
    // Add new entry at the beginning
    closedTabs.unshift(historyItem);
  }
  
  // Keep only last N entries based on settings
  const limit = currentSettings?.historyLimit || 100;
  const trimmedHistory = closedTabs.slice(0, limit);
  
  await chrome.storage.local.set({ closedTabs: trimmedHistory });
}

// Check and close idle tabs
async function checkIdleTabs() {
  const { settings } = await chrome.storage.local.get('settings');
  const currentSettings = settings || DEFAULT_SETTINGS;
  
  // Skip if paused
  if (currentSettings.isPaused) {
    console.log('Auto-close is paused');
    return;
  }
  
  const tabs = await chrome.tabs.query({});
  
  const now = Date.now();
  const idleThreshold = currentSettings.idleTime * 60 * 1000; // Convert to milliseconds
  const resumeTime = currentSettings.resumeTime || 0;
  
  // Group tabs by domain for duplicate detection
  const domainGroups = {};
  
  for (const tab of tabs) {
    // Skip special URLs
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      continue;
    }
    
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;
      
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      
      // Use tab.lastAccessed or now if undefined (safety fallback)
      // Also consider resumeTime
      const effectiveLastActive = Math.max(tab.lastAccessed || now, resumeTime);
      
      domainGroups[domain].push({
        tab,
        lastActive: effectiveLastActive
      });
    } catch (e) {
      // Invalid URL, skip
      continue;
    }
  }
  
  // Regular idle time check
  // We need to handle native tabs, duplicate domains, and regular tabs differently
  // Native tabs are closed regardless of minTabCount
  // Duplicate domains and Regular tabs are closed only if total count > minTabCount
  
  const tabsToClose = [];
  const markedTabIds = new Set();
  let currentTabCount = tabs.length;
  
  // 1. Identify Native Tabs to close (Independent of minTabCount)
  if (currentSettings.autoCloseNativeTabs) {
    const nativeIdleThreshold = (currentSettings.nativeTabIdleTime || 30) * 60 * 1000;
    
    for (const tab of tabs) {
      const isNativeTab = tab.url && (tab.url.startsWith('chrome://') || tab.url === 'chrome://newtab/');
      if (!isNativeTab) continue;
      
      const lastActive = Math.max(tab.lastAccessed || now, resumeTime);
      const idleTime = now - lastActive;
      
      // Check if we should skip pinned tab based on settings
      const shouldSkipPinned = currentSettings.ignorePinnedTabs && tab.pinned;
      
      if (idleTime > nativeIdleThreshold && !tab.active && !tab.audible && !shouldSkipPinned) {
        console.log(`Marking native tab for closing: ${tab.title}`);
        tabsToClose.push(tab);
        markedTabIds.add(tab.id);
        currentTabCount--;
      }
    }
  }
  
  // 2. Identify Duplicate Domains to close (Dependent on minTabCount)
  if (currentSettings.closeDuplicateDomains) {
    for (const domain in domainGroups) {
      const domainTabs = domainGroups[domain];
      
      // If more than 3 tabs from same domain
      if (domainTabs.length > 3) {
        // Sort by last active time (oldest first)
        domainTabs.sort((a, b) => a.lastActive - b.lastActive);
        
        // Candidates to close (keep only 2 most recent)
        const candidates = domainTabs.slice(0, domainTabs.length - 2);
        
        for (const { tab } of candidates) {
          // Skip if already marked
          if (markedTabIds.has(tab.id)) continue;
          
          // Skip if in whitelist
          if (matchesPattern(tab.url, currentSettings.whitelist)) continue;
          
          // Skip pinned if protected
          if (currentSettings.ignorePinnedTabs && tab.pinned) continue;
          
          // Only close if we are above minTabCount
          if (currentTabCount > currentSettings.minTabCount) {
            console.log(`Marking duplicate domain tab (${domain}) for closing:`, tab.title);
            tabsToClose.push(tab);
            markedTabIds.add(tab.id);
            currentTabCount--;
          }
        }
      }
    }
  }
  
  // 3. Identify Regular Idle Tabs to close (Dependent on minTabCount)
  const regularCandidates = [];
  
  for (const tab of tabs) {
    // Skip if already marked
    if (markedTabIds.has(tab.id)) continue;
    
    // Skip native tabs (handled above)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url === 'chrome://newtab/')) continue;
    
    // Skip special extension URLs
    if (tab.url && tab.url.startsWith('chrome-extension://')) continue;
    
    // Skip if active, audible
    if (tab.active || tab.audible) continue;
    
    // Skip pinned if protected
    if (currentSettings.ignorePinnedTabs && tab.pinned) continue;
    
    // Check whitelist
    if (matchesPattern(tab.url, currentSettings.whitelist)) continue;
    
    // Check blacklist - close immediately regardless of idle time or count
    if (matchesPattern(tab.url, currentSettings.blacklist)) {
      console.log('Tab in blacklist, marking for closing:', tab.url);
      tabsToClose.push(tab);
      markedTabIds.add(tab.id);
      currentTabCount--;
      continue;
    }
    
    // Check idle time
    const lastActive = Math.max(tab.lastAccessed || now, resumeTime);
    const idleTime = now - lastActive;
    
    if (idleTime > idleThreshold) {
      regularCandidates.push({ tab, lastActive });
    }
  }
  
  // Sort candidates by last active time (oldest first)
  regularCandidates.sort((a, b) => a.lastActive - b.lastActive);
  
  // Close candidates as long as we stay above minTabCount
  for (const candidate of regularCandidates) {
    if (currentTabCount > currentSettings.minTabCount) {
      console.log('Marking idle tab for closing:', candidate.tab.title);
      tabsToClose.push(candidate.tab);
      markedTabIds.add(candidate.tab.id);
      currentTabCount--;
    } else {
      console.log(`Keeping idle tab to maintain min count (${currentSettings.minTabCount}):`, candidate.tab.title);
    }
  }
  
  // Execute closing
  for (const tab of tabsToClose) {
    await saveToHistory(tab);
    await chrome.tabs.remove(tab.id);
  }
}

// Alarm listener for periodic checks
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkIdleTabs') {
    checkIdleTabs();
  }
});

// Message listener for manual actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reclassifyHistory') {
    (async () => {
      try {
        const { closedTabs = [], settings } = await chrome.storage.local.get(['closedTabs', 'settings']);
        
        // Re-classify all tabs
        const updatedTabs = await Promise.all(closedTabs.map(async (item) => {
          const category = await classifyTab({ title: item.title, url: item.url }, settings);
          return { ...item, category };
        }));
        
        await chrome.storage.local.set({ closedTabs: updatedTabs });
        sendResponse({ success: true });
      } catch (error) {
        console.error('Reclassification failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep channel open for async response
  }
});
