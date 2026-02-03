/**
 * InoreaderAI Frontend Application
 *
 * This module provides:
 * - GitHub API wrapper functions
 * - Token management (localStorage)
 * - Tag configuration management
 * - Statistics loading and display
 * - File download utilities
 */

// Configuration Constants
const CONFIG = {
  // User needs to modify these values to match their GitHub repository
  GITHUB_OWNER: 'FireTigerStudio',  // GitHub username
  GITHUB_REPO: '-InoreaderAI',            // Repository name
  TAGS_PATH: 'config/tags.json',         // Tags configuration file path
  DATA_DIR: 'data',                      // Excel files directory
  GITHUB_API_BASE: 'https://api.github.com'
};

// ============================================================================
// Token Management
// ============================================================================

/**
 * Get GitHub token from localStorage
 * @returns {string|null} GitHub token or null if not set
 */
function getToken() {
  return localStorage.getItem('github_token');
}

/**
 * Set GitHub token to localStorage
 * @param {string} token - GitHub personal access token
 */
function setToken(token) {
  localStorage.setItem('github_token', token);
}

/**
 * Remove GitHub token from localStorage
 */
function removeToken() {
  localStorage.removeItem('github_token');
}

/**
 * Check if GitHub token is set
 * @returns {boolean} True if token exists
 */
function hasToken() {
  return !!getToken();
}

// ============================================================================
// GitHub API Wrapper Functions
// ============================================================================

/**
 * Get file contents from GitHub repository
 * @param {string} path - Path to file in repository
 * @returns {Promise<Object>} GitHub API response with file content and SHA
 * @throws {Error} If API request fails
 */
async function githubGet(path) {
  const token = getToken();
  if (!token) {
    throw new Error('GitHub token not set. Please configure your token first.');
  }

  const url = `${CONFIG.GITHUB_API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub GET request failed:', error);
    throw error;
  }
}

/**
 * Update or create file in GitHub repository
 * @param {string} path - Path to file in repository
 * @param {string} content - File content (will be Base64 encoded automatically)
 * @param {string} sha - Current file SHA (required for updates)
 * @param {string} message - Commit message
 * @returns {Promise<Object>} GitHub API response
 * @throws {Error} If API request fails
 */
async function githubPut(path, content, sha, message) {
  const token = getToken();
  if (!token) {
    throw new Error('GitHub token not set. Please configure your token first.');
  }

  const url = `${CONFIG.GITHUB_API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;

  // Encode content to Base64 (handles UTF-8 properly)
  const base64Content = btoa(unescape(encodeURIComponent(content)));

  const body = {
    message: message,
    content: base64Content
  };

  // Include SHA if provided (required for updates)
  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub PUT request failed:', error);
    throw error;
  }
}

/**
 * List files in a directory from GitHub repository
 * @param {string} path - Path to directory in repository
 * @returns {Promise<Array>} Array of file objects
 * @throws {Error} If API request fails
 */
async function githubListFiles(path) {
  const token = getToken();
  if (!token) {
    throw new Error('GitHub token not set. Please configure your token first.');
  }

  const url = `${CONFIG.GITHUB_API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub list files request failed:', error);
    throw error;
  }
}

// ============================================================================
// Tags Management
// ============================================================================

/**
 * Load tags from GitHub repository
 * @returns {Promise<Object>} Object with tags array and file SHA
 * @throws {Error} If loading fails
 */
async function loadTagsFromGitHub() {
  try {
    const data = await githubGet(CONFIG.TAGS_PATH);

    // Decode Base64 content (properly handle UTF-8)
    const binaryString = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);
    const tagsData = JSON.parse(content);

    return {
      tags: tagsData.tags || [],
      sha: data.sha
    };
  } catch (error) {
    console.error('Failed to load tags from GitHub:', error);
    throw error;
  }
}

/**
 * Save tags to GitHub repository
 * @param {Array} tags - Array of tag objects
 * @param {string} sha - Current file SHA (required for updates)
 * @param {string} [commitMessage] - Optional custom commit message
 * @returns {Promise<Object>} GitHub API response
 * @throws {Error} If saving fails
 */
async function saveTagsToGitHub(tags, sha, commitMessage = 'Update tags configuration') {
  try {
    // Format tags as JSON with proper indentation
    const content = JSON.stringify({ tags }, null, 2);

    // Save to GitHub
    const result = await githubPut(CONFIG.TAGS_PATH, content, sha, commitMessage);

    return result;
  } catch (error) {
    console.error('Failed to save tags to GitHub:', error);
    throw error;
  }
}

/**
 * Load tags from localStorage (fallback/cache)
 * @returns {Array} Array of tag objects
 */
function loadTagsFromLocalStorage() {
  const saved = localStorage.getItem('inoreader_tags');
  return saved ? JSON.parse(saved) : [];
}

/**
 * Save tags to localStorage (cache)
 * @param {Array} tags - Array of tag objects
 */
function saveTagsToLocalStorage(tags) {
  localStorage.setItem('inoreader_tags', JSON.stringify(tags));
}

// ============================================================================
// Statistics Management
// ============================================================================

/**
 * Load today's statistics from data directory
 * @returns {Promise<Object>} Statistics object with total, urgent, normal counts
 */
async function loadTodayStats() {
  try {
    // Try to load stats.json if it exists
    const statsPath = 'stats.json';
    const data = await githubGet(statsPath);
    // Decode Base64 content (properly handle UTF-8)
    const binaryString = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(content);
  } catch (error) {
    console.warn('Could not load stats.json, returning default stats:', error);
    // Return default stats if file doesn't exist
    return {
      date: new Date().toISOString().split('T')[0],
      total: 0,
      urgent: 0,
      normal: 0,
      lastUpdate: new Date().toISOString()
    };
  }
}

/**
 * List historical Excel files from data directory
 * @returns {Promise<Array>} Array of file objects with name, date, and download URL
 */
async function loadHistoricalFiles() {
  try {
    const files = await githubListFiles(CONFIG.DATA_DIR);

    // Filter for Excel files and sort by name (date) descending
    const excelFiles = files
      .filter(file => file.name.endsWith('.xlsx'))
      .sort((a, b) => b.name.localeCompare(a.name))
      .map(file => ({
        name: file.name,
        date: extractDateFromFilename(file.name),
        downloadUrl: file.download_url,
        size: file.size
      }));

    return excelFiles;
  } catch (error) {
    console.error('Failed to load historical files:', error);
    return [];
  }
}

/**
 * Extract date from filename (e.g., news_2026-02-03.xlsx -> 2026-02-03)
 * @param {string} filename - Filename to parse
 * @returns {string|null} Date string or null if not found
 */
function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Get relative date label (e.g., "今天", "昨天", "2天前")
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Relative date label in Chinese
 */
function getRelativeDateLabel(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const diffTime = today - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '2天前';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:MM
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validate GitHub token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token format is valid
 */
function isValidToken(token) {
  return token && (token.startsWith('ghp_') || token.startsWith('github_pat_'));
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Filename for download
 */
function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in milliseconds (default: 2000)
 */
function showNotification(message, type = 'success', duration = 2000) {
  const colors = {
    success: 'bg-gray-900',
    error: 'bg-red-600',
    warning: 'bg-orange-600',
    info: 'bg-blue-600'
  };

  const bgColor = colors[type] || colors.success;

  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
  notification.style.opacity = '1';
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * Show loading state
 * @param {HTMLElement} element - Element to show loading state in
 * @param {string} message - Loading message
 */
function showLoading(element, message = '加载中...') {
  element.innerHTML = `
    <div class="flex items-center justify-center p-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
      <p class="text-gray-500">${message}</p>
    </div>
  `;
}

/**
 * Show error state
 * @param {HTMLElement} element - Element to show error state in
 * @param {string} message - Error message
 */
function showError(element, message = '加载失败') {
  element.innerHTML = `
    <div class="flex flex-col items-center justify-center p-12">
      <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-gray-500">${message}</p>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Export API
// ============================================================================

// Export all functions and constants via window object for use in HTML pages
window.InoreaderApp = {
  // Configuration
  CONFIG,

  // Token Management
  getToken,
  setToken,
  removeToken,
  hasToken,
  isValidToken,

  // GitHub API
  githubGet,
  githubPut,
  githubListFiles,

  // Tags Management
  loadTagsFromGitHub,
  saveTagsToGitHub,
  loadTagsFromLocalStorage,
  saveTagsToLocalStorage,

  // Statistics
  loadTodayStats,
  loadHistoricalFiles,
  extractDateFromFilename,
  getRelativeDateLabel,

  // Utilities
  formatDate,
  formatTime,
  downloadFile,
  showNotification,
  showLoading,
  showError,
  escapeHtml
};

// Log initialization
console.log('InoreaderApp initialized. Configure GitHub settings in app.js:', CONFIG);
console.log('GitHub token status:', hasToken() ? 'Set' : 'Not set');
