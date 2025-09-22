# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- **Build all packages**: `npm run build` (uses Turbo for monorepo builds)
- **Development mode**: `npm run dev` (starts webpack dev servers for all plugins)
- **Linting**: `npm run lint` (ESLint across all packages)
- **Type checking**: `npm run type-check` (TypeScript compilation check)
- **Clean**: `npm run clean` (removes dist, .turbo, node_modules)

For individual plugins:
- Navigate to `plugins/<plugin-name>` and use same commands locally
- Webpack dev server runs on `http://localhost:1268` for local plugin development

## Plugin Architecture

This is a monorepo for Builder.io plugins with a specific architecture:

### Structure
- `plugins/` - Individual Builder.io plugins (webpack bundled as UMD modules)
- `packages/builder-plugins/` - Shared components, hooks, and utilities
- Each plugin should be minimal and leverage shared components from `builder-plugins`

### Plugin Development Rules
- Builder.io plugins should only contain plugin configuration and top-level component rendering
- All sub-components, types, hooks, utilities should be stored in the `builder-plugins` package for reusability
- Plugins are built as SystemJS modules using webpack with entry point `plugin.tsx`
- Each plugin registers with Builder using `Builder.register("plugin", {...})` and may register editors, app tabs, etc.

### Plugin Types
- **Admin Tools Plugin**: Registers as an `appTab` with admin functionality for model sync and content management
- **Input Types Plugin**: Registers custom input editors (e.g., NumberSlider, CMSLink) via `Builder.registerEditor`

### Shared Package
- `builder-plugins` exports reusable components like SearchModelSelector, CMSLink, ConfigurationStatus
- Built with tsup targeting ESM/CJS with TypeScript declarations
- Should be imported by plugins as `builder-plugins`