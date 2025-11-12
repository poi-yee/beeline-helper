# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension built with Vite + Vue 3 + vite-plugin-monkey that adds a floating window UI to beeline-ai.com websites. The extension provides automated course completion and question answering functionality through an injectable Vue application.

## Development Commands

- `npm install` - Install project dependencies
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version to `dist/芯位助手-Beeline Helper.user.js`
- `npm run preview` - Preview the built extension

**Note**: The extension only activates on `*://*.beeline-ai.com/*` URLs. Test on actual beeline-ai.com pages to verify functionality.

## Architecture

### Core Components

- **Entry Point** (`src/main.js`): Injects the Vue application into target pages by creating a container div and mounting the Vue app. Handles DOM readiness and prevents duplicate injections.
- **Main Component** (`src/App.vue`): Contains the floating window UI and control button. Manages window visibility state and provides the user interface.

### Build Configuration

- **Vite** with `vite-plugin-monkey` for userscript generation
- **Target Domain**: Only activates on `*://*.beeline-ai.com/*` URLs
- **External Vue**: Uses external Vue dependency to reduce bundle size
- **No Minification**: Builds without minification for easier debugging
- **Target**: `esnext` for modern browser compatibility
- **Version**: 0.7.6 (configured in vite.config.js, reads from package.json)
- **Icon**: Base64 encoded icon image for userscript header
- **Grants**: GM_getValue, GM_setValue, GM_deleteValue for persistent storage

### Key Features

- **Floating Window Interface**: Draggable window with multi-page navigation system
- **Auto Course Completion**: Automatically detects and clicks course completion buttons
- **Auto Answer System**: Intelligent question detection and automated answering using external question bank APIs
- **Status Monitoring**: Real-time operation logs and status display
- **Feature Persistence**: Saves user preferences using GM_* APIs
- **Network Request Interception**: Monitors API calls to detect question pages and automatically open answer interface
- **Video Management**: Auto-mute and auto-play functionality for video elements
- **Multi-page Navigation**: Main page with subpages for different features
- **State Exception Detection**: Automatically refreshes page when learning state reports return error codes
- **Rainbow Effects**: Dynamic background styling with glass effects and customizable settings

## File Structure

```
src/
├── main.js                    # Application entry point, handles DOM injection
├── App.vue                    # Main Vue component with floating window UI
├── components/
│   ├── FloatingWindow.vue     # Draggable window container
│   ├── ControlButton.vue      # Toggle button for window visibility
│   ├── StatusWindow.vue       # Fixed status display
│   ├── MainPage.vue           # Home page with feature navigation
│   ├── AutoCoursePage.vue     # Course completion configuration
│   ├── AutoAnswerPage.vue     # Question answering interface
│   ├── AdvancedSettingsPage.vue # Advanced configuration options
│   ├── AboutPage.vue          # About information and credits
│   └── AnswerSettingsPage.vue # Answer settings configuration with API token management
└── utils/
    ├── autoAnswer.js          # Core auto-answer functionality
    ├── questionDetection.js   # Question type and content detection
    ├── questionBankAPI.js     # External question bank API integration
    ├── sequentialAnswer.js    # Sequential question answering logic
    ├── questionBankConfig.js  # Question bank configuration management
    ├── subjectiveAnswer.js    # Subjective question answering
    ├── completionAnswer.js    # Completion question answering
    └── storage.js             # Storage utilities using GM_* APIs
```

## Extension Behavior

The extension creates a full-screen container (`beeline-helper-app`) that overlays the page but allows interaction with underlying content. The floating window and control button are positioned within this container using fixed positioning and high z-index values.

### UI Components

- **Floating Window**: Main interface with navigation system and draggable functionality
- **Status Window**: Fixed window showing operation history and current status
- **Control Button**: Toggle button at bottom-left to show/hide the main window

### Navigation System

The extension uses a multi-page navigation system:
- **Main Page**: Home screen with feature categories
- **Auto Course Page**: Subpage for course completion features with toggle switches
- **Auto Answer Page**: Subpage for question answering with API token configuration
- **Advanced Settings Page**: Subpage for advanced configuration options
- **About Page**: Full-screen modal with project information

### Auto Course Completion

The auto course completion feature:
- Searches for the button selector `#videoLayer > div > div > div.button-box > div.left`
- Waits 3 seconds before clicking to allow user interaction
- Provides feedback via console logs and status updates
- Includes operation history tracking with timestamps
- **State Exception Detection**: Automatically refreshes page when video learning state reports return code 500
- **Video Auto-play**: Automatically resumes paused videos with error handling
- **FxxKXinWei Function**: State exception detection with automatic page refresh for learning state anomalies

### Auto Answer System

The auto answer functionality includes:
- **Question Detection**: Identifies question types (single/multiple choice, judgment, completion, subjective)
- **Content Extraction**: Extracts question text and options from the page
- **External API Integration**: Queries external question bank APIs for answers (currently uses tk.enncy.cn API)
- **Answer Selection**: Automatically clicks the correct options with retry logic for checkboxes
- **Sequential Answering**: Processes all questions on a page in order with progress tracking
- **Network Monitoring**: Automatically detects when users navigate to question pages and opens the answer interface
- **Question Statistics**: Provides counts of total questions and supported types
- **API Token Management**: Supports token-based authentication for external APIs (currently tk.enncy.cn and SiliconFlow)
- **Agreement System**: Requires user agreement before using auto-answer features
- **Skip Logic**: Automatically skips questions that already have selections
- **Error Handling**: Comprehensive error handling with detailed logging

### Feature Persistence

User preferences are saved using GM_* APIs:
- Feature toggle states (auto-complete, auto-mute, state exception detection, auto-play, operation log, rainbow effects, FxxKXinWei)
- API tokens for question bank integration
- Operation history for debugging and monitoring
- Window position and visibility states
- User agreement state
- Rainbow effect settings (background image, opacity, glass effect intensity)

### Network Monitoring

The extension intercepts network requests to:
- Detect when users navigate to question pages (via `/api/learning-service/admin/studentLearning/getHomeworkPaperDetail/` endpoints)
- Monitor API responses for state exception detection (via `/api/learning-service/admin/studentLearning/videoLearnProcessReport` endpoints)
- Automatically open the auto-answer interface when appropriate
- Intercepts both `fetch` and `XMLHttpRequest` APIs to capture all network activity
- Uses separate monitoring systems for question detection and state exception detection to avoid conflicts
- **Question Detection**: Opens auto-answer page when homework paper details are requested
- **State Exception Detection**: Automatically refreshes page when learning state reports return code 500

### Event Handling

- **Drag Events**: Mouse and touch events for window dragging with boundary checking using requestAnimationFrame
- **Page Navigation**: Listens to popstate and hashchange events to detect page changes
- **Auto-detection**: Interval-based detection for course completion buttons (3s interval) and video states (2s interval)
- **DOM Observation**: MutationObserver for detecting new video elements and content changes
- **Video State Monitoring**: Detects when videos are paused and automatically resumes playback with error handling
- **Network Request Interception**: Overrides fetch and XMLHttpRequest to monitor API calls with proper error handling
- **Rainbow Effects**: DOM observation for dynamic content with glass effects, background styling, and element removal

### State Management

- **Window Position**: Reactive position tracking for drag functionality with GM_* API persistence
- **Page Navigation**: Current page state for multi-page interface with automatic page detection
- **Operation History**: Array of recent operations with timestamps (max 10 entries)
- **Feature States**: Toggle states and interval management for automated features with GM_* API persistence
- **Video State**: Monitoring and control of video elements (mute, play, pause) with DOM observation
- **Network State**: Tracking of intercepted API requests and responses with separate monitoring instances
- **Agreement State**: User agreement tracking for auto-answer feature with GM_* API
- **Rainbow Settings**: Background image, opacity, and glass effect intensity configuration with preview functionality
- **API Token**: External question bank API token for auto-answer functionality

When modifying the extension:
- Keep the userscript header in `vite.config.js` updated with version changes
- Ensure all UI elements use appropriate z-index values to avoid conflicts
- Test on actual beeline-ai.com pages to verify functionality
- Maintain drag boundary checking when changing window dimensions
- Update button selectors if the target element structure changes
- When adding new features, consider using the subpage navigation system for better organization
- Preserve GM_* API compatibility when changing feature state structure
- Handle both mouse and touch events for mobile compatibility
- Use requestAnimationFrame for smooth drag animations
- Monitor network requests carefully to avoid breaking site functionality
- For auto-answer features, ensure proper API token handling and error management
- Maintain separate network monitoring instances for different purposes to prevent conflicts
- Test auto-answer functionality on actual question pages with various question types