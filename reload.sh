#!/bin/bash

# Auto-reload Chrome Extension on file changes
# This script watches for file changes and triggers extension reload

echo "🔄 Starting Chrome Extension Auto-Reload Watcher..."
echo "📁 Watching directory: $(pwd)"
echo "Press Ctrl+C to stop"
echo ""

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
    echo "❌ fswatch is not installed."
    echo "📦 Installing fswatch via Homebrew..."
    brew install fswatch
fi

# Extension ID will be detected automatically or you can set it manually
# To find your extension ID: chrome://extensions/ -> Developer mode -> Copy ID
EXTENSION_ID=""

# Function to reload extension
reload_extension() {
    echo "🔄 [$(date '+%H:%M:%S')] Detected changes, reloading extension..."
    
    # Try to reload via AppleScript (works for Chrome/Edge)
    osascript -e 'tell application "Google Chrome"
        set extensionReloaded to false
        repeat with w in windows
            repeat with t in tabs of w
                if URL of t starts with "chrome://extensions" then
                    tell t to reload
                    set extensionReloaded to true
                    exit repeat
                end if
            end repeat
            if extensionReloaded then exit repeat
        end repeat
        
        if not extensionReloaded then
            -- Open extensions page and reload
            open location "chrome://extensions/"
            delay 0.5
        end if
    end tell' 2>/dev/null
    
    echo "✅ Extension reload triggered"
}

# Watch for changes in relevant files
fswatch -o \
    --exclude='\.git' \
    --exclude='node_modules' \
    --exclude='\.DS_Store' \
    --exclude='reload\.sh' \
    --exclude='\.gemini' \
    --include='\.js$' \
    --include='\.html$' \
    --include='\.css$' \
    --include='\.json$' \
    . | while read change; do
    reload_extension
done
