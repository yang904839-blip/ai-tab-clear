# Chrome Extension Auto-Reload Scripts

This directory contains scripts to automatically reload the Chrome extension when you make changes to the code.

## Option 1: Bash Script (Recommended for Mac)

### Prerequisites
```bash
brew install fswatch
```

### Usage
```bash
./reload.sh
```

This will watch for changes in `.js`, `.html`, `.css`, and `.json` files and automatically trigger a reload in Chrome.

## Option 2: Node.js Script

### Prerequisites
Node.js must be installed (no additional packages needed).

### Usage
```bash
node watch.js
```

## How It Works

Both scripts:
1. Watch for file changes in the extension directory
2. Detect changes to relevant files (JS, HTML, CSS, JSON)
3. Use AppleScript to trigger Chrome to reload the extensions page
4. Provide console feedback when reloading

## Tips

- Keep the `chrome://extensions/` page open in a tab for faster reloads
- The scripts will automatically open the extensions page if it's not already open
- Press `Ctrl+C` to stop the watcher

## Troubleshooting

If auto-reload doesn't work:
1. Make sure Chrome is running
2. Enable "Developer mode" in `chrome://extensions/`
3. Grant necessary permissions if macOS asks
4. Manually reload once from `chrome://extensions/` to ensure the extension is loaded

## Manual Reload

If you prefer manual reloading:
1. Go to `chrome://extensions/`
2. Click the reload icon (🔄) on your extension card
