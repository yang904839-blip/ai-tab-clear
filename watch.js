const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 Chrome Extension Auto-Reload Watcher Started');
console.log('📁 Watching:', __dirname);
console.log('Press Ctrl+C to stop\n');

// Files/directories to watch
const watchPaths = [
  'popup.html',
  'popup.js',
  'popup.css',
  'background.js',
  'manifest.json',
  '_locales'
];

// Debounce timer
let reloadTimer = null;

// Function to reload extension
function reloadExtension() {
  console.log(`🔄 [${new Date().toLocaleTimeString()}] Changes detected, reloading extension...`);
  
  // AppleScript to reload Chrome extension
  const script = `
    tell application "Google Chrome"
      set reloaded to false
      repeat with w in windows
        repeat with t in tabs of w
          if URL of t starts with "chrome://extensions" then
            tell t to reload
            set reloaded to true
            exit repeat
          end if
        end repeat
        if reloaded then exit repeat
      end repeat
      
      if not reloaded then
        open location "chrome://extensions/"
        delay 0.3
      end if
    end tell
  `;
  
  exec(`osascript -e '${script}'`, (error) => {
    if (error) {
      console.log('⚠️  Could not auto-reload (Chrome may not be running)');
    } else {
      console.log('✅ Extension reloaded\n');
    }
  });
}

// Debounced reload function
function triggerReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(reloadExtension, 300);
}

// Watch files
watchPaths.forEach(watchPath => {
  const fullPath = path.join(__dirname, watchPath);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Watch directory recursively
      fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.json') || filename.endsWith('.js') || 
            filename.endsWith('.html') || filename.endsWith('.css'))) {
          console.log(`📝 Changed: ${path.join(watchPath, filename)}`);
          triggerReload();
        }
      });
      console.log(`👀 Watching directory: ${watchPath}/`);
    } else {
      // Watch single file
      fs.watch(fullPath, (eventType) => {
        if (eventType === 'change') {
          console.log(`📝 Changed: ${watchPath}`);
          triggerReload();
        }
      });
      console.log(`👀 Watching file: ${watchPath}`);
    }
  }
});

console.log('\n✨ Ready! Edit any file to trigger auto-reload.\n');
