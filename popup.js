// AI Tab Clear - Popup Script

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pauseBtn = document.getElementById('pauseBtn');
const pauseText = pauseBtn.querySelector('.pause-text');
const pauseIcon = pauseBtn.querySelector('.pause-icon');
const themeBtn = document.getElementById('themeBtn');
const themeIcon = themeBtn.querySelector('.theme-icon');
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const closedCount = document.getElementById('closedCount'); // New
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const idleTimeInput = document.getElementById('idleTime');
const minTabCountInput = document.getElementById('minTabCount');
const closeDuplicateDomainsInput = document.getElementById('closeDuplicateDomains');
const autoCloseNativeTabsInput = document.getElementById('autoCloseNativeTabs');
const ignorePinnedTabsInput = document.getElementById('ignorePinnedTabs');
const nativeTabIdleTimeInput = document.getElementById('nativeTabIdleTime');
const historyLimitInput = document.getElementById('historyLimit');
const groupingMethodInput = document.getElementById('groupingMethod');
const aiEnabledInput = document.getElementById('aiEnabled');
const aiConfigSection = document.getElementById('aiConfigSection');
const aiProviderInput = document.getElementById('aiProvider');
const aiApiKeyInput = document.getElementById('aiApiKey');
const whitelistInput = document.getElementById('whitelist');
const blacklistInput = document.getElementById('blacklist');
const saveBtn = document.getElementById('saveBtn');
const groupNowBtn = document.getElementById('groupNowBtn');
const saveMessage = document.getElementById('saveMessage');
const historySearchInput = document.getElementById('historySearchInput');
const languageSelect = document.getElementById('languageSelect');

// Search state
let allClosedTabs = []; // New

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Update active states
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${targetTab}Tab`).classList.add('active');
    
    // Load data when switching tabs
    if (targetTab === 'history') {
      loadHistory();
    } else if (targetTab === 'settings') {
      loadSettings();
    }
  });
});

// Format time ago
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return '刚刚';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// Get favicon URL
function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch (e) {
    return '🌐';
  }
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Load and display history
async function loadHistory(searchQuery = '') { // Modified to accept searchQuery
  const { closedTabs = [] } = await chrome.storage.local.get('closedTabs');
  allClosedTabs = closedTabs; // Store all tabs for search
  
  if (closedTabs.length === 0) {
    historyList.innerHTML = `<div class="empty-state">${getMessage('msg_empty_history')}</div>`;
    emptyHistory.classList.add('show'); // Keep this line if emptyHistory is still used for visibility
    closedCount.textContent = 0; // New
    return;
  }
  
  emptyHistory.classList.remove('show'); // Keep this line if emptyHistory is still used for visibility
  
  // Filter tabs based on search query
  const filteredTabs = searchQuery
    ? closedTabs.filter(tab => 
        tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : closedTabs;
  
  closedCount.textContent = filteredTabs.length; // New
  
  // Clear existing content
  historyList.innerHTML = ''; // New
  
  if (filteredTabs.length === 0) { // New
    historyList.innerHTML = `<div class="empty-state">${getMessage('msg_no_matching_tabs')}</div>`; // New
    return; // New
  }
  
  // Group tabs by category if available
  const groupedTabs = {};
  filteredTabs.forEach(tab => { // Changed from closedTabs to filteredTabs
    const category = tab.category || 'Uncategorized';
    if (!groupedTabs[category]) {
      groupedTabs[category] = [];
    }
    groupedTabs[category].push(tab);
  });
  
  const hasSearchQuery = searchQuery.trim().length > 0; // New
  
  // Sort categories (Uncategorized last)
  const categories = Object.keys(groupedTabs).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });
  
  categories.forEach(category => {
    // Localize category name
    let displayCategory = category;
    const categoryKey = `category_${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const localizedCategory = getMessage(categoryKey);
    if (localizedCategory) {
      displayCategory = localizedCategory;
    } else if (category === 'Uncategorized') {
      displayCategory = getMessage('category_uncategorized');
    }

    // Create collapsible group
    const groupDiv = document.createElement('div');
    groupDiv.className = 'history-group';
    
    // Header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'history-group-header';
    if (hasSearchQuery) { // New
      headerDiv.classList.add('expanded'); // New
    } // New
    headerDiv.innerHTML = `
      <span class="group-icon">▶</span>
      <span class="group-title">${displayCategory}</span>
      <span class="group-count">${groupedTabs[category].length}</span>
    `;
    
    // Content (hidden by default)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'history-group-content';
    // Auto-expand if searching
    contentDiv.style.display = hasSearchQuery ? 'block' : 'none'; // Modified
    
    contentDiv.innerHTML = groupedTabs[category].map(item => { // Modified
      let highlightedTitle = escapeHtml(item.title); // New
      let highlightedUrl = escapeHtml(item.url);     // New
      
      // Highlight search matches
      if (hasSearchQuery) { // New
        const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi'); // New
        highlightedTitle = highlightedTitle.replace(regex, '<mark>$1</mark>'); // New
        highlightedUrl = highlightedUrl.replace(regex, '<mark>$1</mark>');     // New
      } // New
      
      return `
        <div class="history-item" data-url="${item.url}">
          <img class="history-item-icon" src="${getFaviconUrl(item.url)}" alt="">
          <span class="history-item-fallback-icon" style="display:none;">🌐</span>
          <div class="history-item-content">
            <div class="history-item-title">${highlightedTitle}</div>
            <div class="history-item-url">${highlightedUrl}</div>
            <div class="history-item-time">${timeAgo(item.closedAt)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Toggle logic
    headerDiv.addEventListener('click', () => {
      const isExpanded = contentDiv.style.display !== 'none';
      contentDiv.style.display = isExpanded ? 'none' : 'block';
      headerDiv.classList.toggle('expanded', !isExpanded);
    });
    
    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(contentDiv);
    historyList.appendChild(groupDiv);
  });
  
  // Add error handlers for images and click listeners
  document.querySelectorAll('.history-item').forEach(item => {
    const img = item.querySelector('.history-item-icon');
    const fallback = item.querySelector('.history-item-fallback-icon');
    
    if (img) {
      img.addEventListener('error', () => {
        img.style.display = 'none';
        if (fallback) fallback.style.display = 'block';
      });
    }

    item.addEventListener('click', () => {
      const url = item.dataset.url;
      chrome.tabs.create({ url });
    });
  });
}

// Clear history
clearHistoryBtn.addEventListener('click', async () => {
  if (confirm(getMessage('msg_confirm_clear'))) {
    await chrome.storage.local.set({ closedTabs: [] });
    loadHistory();
  }
});

// Search history
historySearchInput.addEventListener('input', (e) => {
  loadHistory(e.target.value);
});

// Language change
languageSelect.addEventListener('change', async () => {
  const { settings } = await chrome.storage.local.get('settings');
  settings.language = languageSelect.value;
  await chrome.storage.local.set({ settings });
  
  // Reload popup to apply new language
  window.location.reload();
});

// Load settings
async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  
  if (settings) {
    idleTimeInput.value = settings.idleTime || 30;
    minTabCountInput.value = settings.minTabCount || 10;
    closeDuplicateDomainsInput.checked = settings.closeDuplicateDomains !== false;
    autoCloseNativeTabsInput.checked = settings.autoCloseNativeTabs !== false;
    ignorePinnedTabsInput.checked = settings.ignorePinnedTabs !== false;
    nativeTabIdleTimeInput.value = settings.nativeTabIdleTime || 30;
    historyLimitInput.value = settings.historyLimit || 100;
    groupingMethodInput.value = settings.groupingMethod || 'local';
    languageSelect.value = settings.language || 'zh_CN';
    
    // AI Settings
    if (settings.aiSettings) {
      aiEnabledInput.checked = settings.aiSettings.enabled;
      aiProviderInput.value = settings.aiSettings.provider || 'gemini';
      aiApiKeyInput.value = settings.aiSettings.apiKey || '';
    }
    
    // Show/Hide AI section based on method
    toggleAISection();
    
    whitelistInput.value = (settings.whitelist || []).join('\n');
    blacklistInput.value = (settings.blacklist || []).join('\n');
    updatePauseButton(settings.isPaused);
  }
}

// Save settings
saveBtn.addEventListener('click', async () => {
  const idleTime = parseInt(idleTimeInput.value);
  const minTabCount = parseInt(minTabCountInput.value);
  const nativeTabIdleTime = parseInt(nativeTabIdleTimeInput.value);
  const historyLimit = parseInt(historyLimitInput.value);
  const groupingMethod = groupingMethodInput.value;
  
  // AI Settings
  const aiSettings = {
    enabled: aiEnabledInput.checked,
    provider: aiProviderInput.value,
    apiKey: aiApiKeyInput.value.trim(),
    model: '' // Default model
  };

  if (groupingMethod === 'ai' && aiSettings.enabled && !aiSettings.apiKey) {
    showSaveMessage(getMessage('msg_error_api_key'), 'error');
    return;
  }
  
  if (isNaN(idleTime) || idleTime < 1) {
    showSaveMessage(getMessage('msg_error_idle_time'), 'error');
    return;
  }
  
  if (isNaN(minTabCount) || minTabCount < 1) {
    showSaveMessage(getMessage('msg_error_tab_count'), 'error');
    return;
  }

  if (isNaN(nativeTabIdleTime) || nativeTabIdleTime < 1) {
    showSaveMessage(getMessage('msg_error_native_idle'), 'error');
    return;
  }
  
  const whitelist = whitelistInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const blacklist = blacklistInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Validate regex patterns
  const invalidPatterns = [];
  [...whitelist, ...blacklist].forEach(pattern => {
    try {
      new RegExp(pattern);
    } catch (e) {
      invalidPatterns.push(pattern);
    }
  });
  
  if (invalidPatterns.length > 0) {
    showSaveMessage(`${getMessage('msg_error_regex')}${invalidPatterns.join(', ')}`, 'error');
    return;
  }
  
  const { settings: currentSettings } = await chrome.storage.local.get('settings');
  
  const settings = {
    idleTime,
    minTabCount,
    closeDuplicateDomains: closeDuplicateDomainsInput.checked,
    autoCloseNativeTabs: autoCloseNativeTabsInput.checked,
    ignorePinnedTabs: ignorePinnedTabsInput.checked,
    nativeTabIdleTime,
    historyLimit,
    groupingMethod,
    aiSettings,
    whitelist,
    blacklist,
    language: languageSelect.value,
    isPaused: currentSettings?.isPaused || false
  };
  
  await chrome.storage.local.set({ settings });
  showSaveMessage(getMessage('msg_save_success'), 'success');
});

// Show save message
function showSaveMessage(message, type) {
  saveMessage.textContent = message;
  saveMessage.className = `save-message show ${type}`;
  
  setTimeout(() => {
    saveMessage.classList.remove('show');
  }, 3000);
}

// Pause/Resume functionality
pauseBtn.addEventListener('click', async () => {
  const { settings } = await chrome.storage.local.get('settings');
  const newPausedState = !settings.isPaused;
  
  settings.isPaused = newPausedState;
  
  // When resuming, record the resume time
  // This prevents tabs from being closed immediately if they were idle during pause
  if (!newPausedState) {
    settings.resumeTime = Date.now();
  }
  
  await chrome.storage.local.set({ settings });
  
  updatePauseButton(newPausedState);
});

// Update pause button UI
function updatePauseButton(isPaused) {
  if (isPaused) {
    pauseBtn.classList.add('paused');
    pauseIcon.textContent = '▶';
    pauseText.textContent = '继续';
  } else {
    pauseBtn.classList.remove('paused');
    pauseIcon.textContent = '⏸';
    pauseText.textContent = '暂停';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Theme toggle functionality
themeBtn.addEventListener('click', async () => {
  const { theme } = await chrome.storage.local.get('theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  
  await chrome.storage.local.set({ theme: newTheme });
  applyTheme(newTheme);
});

// Apply theme
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    themeIcon.textContent = '🌙';
  }
}

// Load theme on startup
async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  applyTheme(theme || 'light');
}



function toggleAISection() {
  const method = groupingMethodInput.value;
  if (method === 'ai') {
    aiConfigSection.style.display = 'block';
  } else {
    aiConfigSection.style.display = 'none';
  }
}

// Grouping Method Toggle
groupingMethodInput.addEventListener('change', toggleAISection);

// Group Now Button
groupNowBtn.addEventListener('click', async () => {
  const originalText = groupNowBtn.textContent;
  groupNowBtn.textContent = '⏳';
  groupNowBtn.disabled = true;
  
  try {
    await chrome.runtime.sendMessage({ action: 'reclassifyHistory' });
    await loadHistory();
    // Show success feedback briefly
    groupNowBtn.textContent = '✅';
    setTimeout(() => {
      groupNowBtn.textContent = originalText;
      groupNowBtn.disabled = false;
    }, 1000);
  } catch (error) {
    console.error('Grouping failed:', error);
    groupNowBtn.textContent = '❌';
    setTimeout(() => {
      groupNowBtn.textContent = originalText;
      groupNowBtn.disabled = false;
    }, 1000);
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  localizeHtml();
  loadHistory();
  loadSettings();
  loadTheme();
});

// Custom i18n system
let currentMessages = {};

// Load messages for a specific locale
async function loadMessages(locale) {
  try {
    const response = await fetch(`_locales/${locale}/messages.json`);
    const messages = await response.json();
    currentMessages = messages;
    return messages;
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
    // Fallback to zh_CN
    if (locale !== 'zh_CN') {
      return loadMessages('zh_CN');
    }
    return {};
  }
}

// Get message from current locale
function getMessage(key) {
  if (currentMessages[key]) {
    return currentMessages[key].message;
  }
  // Fallback to Chrome's i18n
  return chrome.i18n.getMessage(key) || key;
}

// Localize HTML elements
async function localizeHtml() {
  // Load the selected language
  const { settings } = await chrome.storage.local.get('settings');
  const locale = settings?.language || 'zh_CN';
  
  await loadMessages(locale);
  
  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = getMessage(key);
    if (message) {
      const attr = element.getAttribute('data-i18n-attr');
      if (attr) {
        element.setAttribute(attr, message);
      } else {
        element.textContent = message;
      }
    }
  });
}

