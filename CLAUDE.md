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
├── app/                      # File-based routing (Expo Router)
│   ├── _layout.tsx           # Root layout with AuthProvider
│   ├── index.tsx             # Entry point (redirects based on auth state)
│   ├── (auth)/               # Auth route group (login, signup, reset)
│   │   ├── _layout.tsx       # Auth layout (no header)
│   │   ├── login.tsx         # Login screen
│   │   ├── signup.tsx        # Signup screen with password strength
│   │   └── reset-password.tsx # Password reset flow
│   └── (app)/                # Protected app route group
│       ├── _layout.tsx       # App layout
│       └── home.tsx          # Main home screen
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx    # Gradient button with variants
│   │   │   ├── Input.tsx     # Glassmorphic input with validation
│   │   │   └── GradientBackground.tsx # Animated gradient bg
│   │   └── auth/
│   │       └── AuthCard.tsx  # Glassmorphic auth card container
│   ├── context/
│   │   └── AuthContext.tsx   # Mock auth state management
│   └── utils/
│       ├── colors.ts         # Futuristic theme colors
│       └── validation.ts     # Form validation helpers
├── assets/                   # App icons, splash screens, fonts, images
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Architecture

- **Expo SDK ~54.0** with new architecture enabled
- **Expo Router v6** for file-based navigation with route groups
- **React 19.1** with React Native 0.81
- **TypeScript 5.9** with strict mode enabled
- **expo-linear-gradient** for gradient backgrounds
- **expo-blur** for glassmorphism effects
- Mock authentication (no backend integration yet)

## Design System

The app uses a futuristic dark theme with:
- **Colors**: Deep blue/purple gradients, cyan accents, frosted glass
- **Components**: Glassmorphic cards, gradient buttons, animated inputs
- **Typography**: Bold headings with glow effects, clean body text
- All theme constants defined in `src/utils/colors.ts`

## Routing Convention

This project uses **Expo Router** for file-based routing with **route groups**.

### Current Routes

- `/` - Entry point, redirects to login or home based on auth state
- `/(auth)/login` - Login screen
- `/(auth)/signup` - Signup screen with password strength indicator
- `/(auth)/reset-password` - Password reset flow
- `/(app)/home` - Protected home screen (requires authentication)

### Route Groups

Route groups use parentheses `(name)` to organize routes without affecting URL structure:
- `(auth)` - Authentication screens (headerless)
- `(app)` - Protected app screens (with header)

### Navigation

```tsx
import { Link, router } from 'expo-router';

// Navigate to login
router.push('/(auth)/login');

// Replace navigation (no back)
router.replace('/(app)/home');

// Go back
router.back();

// Using Link component
<Link href="/(auth)/signup">Sign Up</Link>
```

## Authentication Flow

The app uses a mock authentication system (frontend-only):

1. **AuthContext** (`src/context/AuthContext.tsx`) manages auth state
2. **Entry point** (`app/index.tsx`) redirects based on `user` state
3. **Login/Signup** accept any credentials for demo purposes
4. **Protected routes** in `(app)` group require authentication
5. **Form validation** uses utilities in `src/utils/validation.ts`

### Adding Supabase (Future Step)

To integrate real backend:
1. Install `@supabase/supabase-js` and `expo-secure-store`
2. Replace mock functions in AuthContext with Supabase calls
3. Add secure token storage
4. Implement email verification flow

## Editor Configuration

- Format on save is enabled
- TypeScript strict mode enabled
- VS Code extensions: React Native, ESLint, TypeScript, Spell Checker, Claude Code
