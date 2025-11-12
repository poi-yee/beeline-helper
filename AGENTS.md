# AGENTS.md

## Build/Lint/Test Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version to `dist/芯位助手-Beeline Helper.user.js`
- `npm run preview` - Preview the built extension

## Code Style Guidelines

### Imports
- Use ES6 import syntax with named imports
- Import Vue components with PascalCase naming
- Import utility functions from `./utils/` directory
- External dependencies: Vue 3, vite-plugin-monkey

### Formatting
- Vue 3 Composition API with `<script setup>` syntax
- Use 2-space indentation (no tabs)
- Template uses kebab-case for event names and props
- CSS uses scoped styling with BEM-like class naming

### Types
- Use JSDoc comments for function documentation
- No TypeScript - use descriptive variable names and JSDoc
- Async/await for all storage operations

### Naming Conventions
- Components: PascalCase (e.g., `FloatingWindow.vue`)
- Variables: camelCase with descriptive names
- Constants: UPPER_SNAKE_CASE for magic values
- Storage keys: `beelineHelper_featureName` format

### Error Handling
- Wrap GM_* API calls in try-catch blocks
- Console.warn for non-critical errors
- Graceful fallbacks for storage operations
- Network request interception with proper cleanup

### Vue Patterns
- Composition API with reactive refs and computed properties
- Emit events for component communication
- Use Vue transitions for animations
- Template refs for DOM manipulation

### Storage
- Use `GM_getValue`, `GM_setValue`, `GM_deleteValue` for persistence
- JSON serialize/deserialize objects automatically
- Feature states stored under single key `beelineHelper_featureStates`

### Browser Compatibility
- Target modern browsers (ESNext)
- Handle both mouse and touch events
- Use MutationObserver for dynamic content
- Intercept both fetch and XMLHttpRequest APIs