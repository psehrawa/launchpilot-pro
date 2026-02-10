# LaunchPilot Pro Chrome Extension

Capture leads from LinkedIn with one click.

## Features

- **One-click capture**: Save LinkedIn profiles directly to LaunchPilot
- **Floating button**: Appears on every LinkedIn profile page
- **Auto-extraction**: Pulls name, title, company, and profile URL
- **Daily counter**: Track how many leads you've captured today

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

## Usage

1. Navigate to any LinkedIn profile
2. Click the floating "Save Lead" button (bottom right)
3. Or click the extension icon in toolbar

The contact will be saved to your LaunchPilot Pro account.

## Configuration

Click the extension icon and enter your LaunchPilot URL if using a custom domain.

Default: `https://launchpilot-pro.vercel.app`

## Icons

Generate icons using any icon generator:
- icon16.png (16x16)
- icon48.png (48x48)  
- icon128.png (128x128)

Or use placeholder:
```bash
# Generate simple colored squares as placeholders
convert -size 16x16 xc:#6366f1 icons/icon16.png
convert -size 48x48 xc:#6366f1 icons/icon48.png
convert -size 128x128 xc:#6366f1 icons/icon128.png
```

## Privacy

This extension only runs on linkedin.com and only captures data when you click the save button. No automatic tracking or data collection.
