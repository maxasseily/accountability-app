# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native accountability app built with Expo and TypeScript. The project uses a devcontainer-based development environment with Node.js 18.

## Development Environment

The project is configured to run in a devcontainer with:
- Node.js 18 (Debian Bullseye base)
- Watchman for file watching
- Metro Bundler on port 8081
- SSH key mounting for git operations

## Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (requires macOS)
- `npm run web` - Run in web browser

## Project Structure

```
accountability-app/
├── app/                 # File-based routing (Expo Router)
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Home screen (/)
├── src/
│   ├── components/      # Reusable UI components
│   └── utils/           # Helper functions, constants, utilities
├── assets/              # App icons, splash screens, fonts, images
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Architecture

- **Expo SDK ~54.0** with new architecture enabled
- **Expo Router v6** for file-based navigation
- **React 19.1** with React Native 0.81
- **TypeScript 5.9** with strict mode enabled
- Minimal setup with no linting or testing configured

## Routing Convention

This project uses **Expo Router** for file-based routing. Routes are automatically generated from the file structure in the `app/` directory.

### Route Examples

- `app/index.tsx` → `/` (home screen)
- `app/profile.tsx` → `/profile`
- `app/settings.tsx` → `/settings`
- `app/user/[id].tsx` → `/user/123` (dynamic route)
- `app/(tabs)/_layout.tsx` → Tab group layout
- `app/_layout.tsx` → Root layout (wraps all routes)

### Navigation

```tsx
import { Link, router } from 'expo-router';

// Using Link component
<Link href="/profile">Go to Profile</Link>

// Programmatic navigation
router.push('/settings');
router.back();
```

### Layouts

- Use `_layout.tsx` files to define layouts for route groups
- Layouts can use `<Stack>`, `<Tabs>`, or `<Drawer>` navigators from `expo-router`

## Editor Configuration

- Format on save is enabled
- TypeScript strict mode enabled
- VS Code extensions: React Native, ESLint, TypeScript, Spell Checker, Claude Code
