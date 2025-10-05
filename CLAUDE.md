# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native accountability app project currently in the initial setup phase. The project uses a devcontainer-based development environment with Node.js 18.

## Development Environment

The project is configured to run in a devcontainer with:
- Node.js 18 (Debian Bullseye base)
- Watchman for file watching
- Metro Bundler on port 8081
- SSH key mounting for git operations

## Commands

**Note:** The project is in early setup phase. Once dependencies are added (package.json), the following commands will typically be available:

- `npm install` - Install dependencies (postCreateCommand is configured but currently empty)
- `npm start` - Start Metro Bundler for React Native
- `npx react-native run-android` - Run on Android emulator/device
- `npx react-native run-ios` - Run on iOS simulator/device (requires macOS)
- `npm test` - Run tests (once configured)
- `npm run lint` - Run ESLint (once configured)

## Architecture

The codebase structure has not yet been established. This is a greenfield React Native project.

## Editor Configuration

- Format on save is enabled
- ESLint integration expected once configured
- TypeScript support included
