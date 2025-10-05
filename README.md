# Accountability App

A React Native accountability app built with Expo, TypeScript, and Supabase featuring a futuristic UI design.

## 🚀 Features

- **Authentication**: Email/password with Supabase
- **Futuristic UI**: Dark theme with gradients, glassmorphism effects
- **File-based Routing**: Expo Router for navigation
- **Secure Storage**: Session persistence with expo-secure-store
- **TypeScript**: Full type safety throughout the app
- **Dev Containers**: Pre-configured development environment

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/get-started) (running)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- [Supabase](https://supabase.com) account

## 🛠️ Setup

This project uses **Dev Containers** to provide a consistent, pre-configured development environment with all dependencies included.

### 1. Clone the Repository

```bash
git clone https://github.com/maxasseily/accountability-app.git
cd accountability-app
```

### 2. Open in Dev Container

**Method 1: Automatic Prompt (Easiest)**
1. Open the project folder in VS Code:
   ```bash
   code .
   ```
2. VS Code will detect the dev container configuration
3. Click **"Reopen in Container"** when prompted

**Method 2: Command Palette**
1. Open VS Code
2. Press `F1` (or `Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on Mac)
3. Type and select: `Dev Containers: Reopen in Container`
4. Wait for the container to build (first time: 2-5 minutes)

**Method 3: From Outside the Folder**
1. Open VS Code
2. Press `F1`
3. Type and select: `Dev Containers: Open Folder in Container...`
4. Navigate to and select the `accountability-app` folder
5. Wait for container to build

### What Happens Automatically

When the dev container builds:
- ✅ Node.js 18 environment created
- ✅ Watchman installed (React Native file watching)
- ✅ **All dependencies installed** (`npm install` runs automatically via `postCreateCommand`)
- ✅ VS Code extensions installed (React Native, ESLint, TypeScript, Code Spell Checker, Claude Code)
- ✅ Editor settings configured (format on save enabled)
- ✅ Metro Bundler port (8081) forwarded

**You don't need to run `npm install` manually!**

### 3. Configure Environment Variables

Once inside the container, create your environment file:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Project Settings** (gear icon) → **API**
4. Copy:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. Set Up Supabase Database

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed SQL schema and instructions.

**Quick setup:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Copy and run the SQL from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) (creates `profiles` table and triggers)
3. Go to **Authentication** → **Settings**
4. Disable **"Enable email confirmations"** (for development only)
5. Click **Save**

### 5. Run the App

```bash
# Start Metro bundler
npm start

# Or for testing on physical device (recommended)
npx expo start --tunnel
```

Press `w` for web, `a` for Android, or `i` for iOS in the terminal, or scan the QR code with Expo Go app on your phone.

---

## 📱 Testing Authentication

**Create an account:**
1. Launch the app
2. Click **"Sign Up"**
3. Enter:
   - **Name**: Any name
   - **Email**: Any email (doesn't need to be real with confirmation disabled)
   - **Password**: Minimum 8 characters
4. Should automatically redirect to home screen

**Login:**
1. Click **Logout** from home screen
2. Enter the same credentials
3. Should redirect to home screen
4. Sessions persist across app restarts

**Verify in Supabase:**
- **Authentication** → **Users**: New user appears
- **Table Editor** → **profiles**: Profile row created automatically

---

## 📁 Project Structure

```
accountability-app/
├── .devcontainer/           # Dev container configuration
│   ├── devcontainer.json    # Container settings (Node 18, auto npm install)
│   └── Dockerfile           # Node.js 18 + Watchman + git
├── app/                     # File-based routing (Expo Router)
│   ├── (auth)/              # Auth screens (login, signup, reset)
│   │   ├── _layout.tsx      # Auth layout (no header)
│   │   ├── login.tsx        # Login screen
│   │   ├── signup.tsx       # Signup with password strength
│   │   └── reset-password.tsx  # Password reset flow
│   ├── (app)/               # Protected app screens
│   │   ├── _layout.tsx      # App layout
│   │   └── home.tsx         # Main home screen
│   ├── _layout.tsx          # Root layout with AuthProvider
│   └── index.tsx            # Entry point (auth redirect)
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx   # Gradient button with variants
│   │   │   ├── Input.tsx    # Glassmorphic input with validation
│   │   │   └── GradientBackground.tsx  # Animated gradient bg
│   │   └── auth/
│   │       └── AuthCard.tsx # Glassmorphic card container
│   ├── context/
│   │   └── AuthContext.tsx  # Supabase auth integration
│   ├── lib/
│   │   └── supabase.ts      # Supabase client with secure storage
│   └── utils/
│       ├── colors.ts        # Futuristic theme colors
│       └── validation.ts    # Form validation helpers
├── assets/                  # App icons, splash screens, images
├── .env                     # Your Supabase credentials (gitignored)
├── .env.example             # Template for credentials
├── SUPABASE_SETUP.md        # Detailed Supabase setup guide
└── CLAUDE.md                # Architecture and development guide
```

---

## 🎨 Design System

- **Theme**: Futuristic dark mode
- **Colors**: Deep blue/purple gradients, cyan accents, frosted glass
- **Components**: Glassmorphic cards, gradient buttons with glow effects
- **Typography**: Bold headings with glow, clean body text
- See `src/utils/colors.ts` for full color palette

---

## 🔒 Security Notes

- **Never commit `.env`**: Your Supabase credentials are gitignored
- **`.env.example`**: Template only - contains no real credentials
- **Secure sessions**: Tokens stored with `expo-secure-store`
- **Row Level Security**: RLS enabled on all database tables
- **Password requirements**: Minimum 8 characters enforced

---

## 🐛 Troubleshooting

### Dev Container Issues

**Container won't start:**
```bash
# Make sure Docker Desktop is running
# Then in VS Code, press F1 and run:
Dev Containers: Rebuild Container
```

**Slow build:**
- First build takes 2-5 minutes (downloads Node.js image)
- Subsequent builds are much faster (uses cache)
- Ensure Docker has 4GB+ RAM allocated

**Can't connect to dev container:**
```bash
# Check Docker Desktop is running
# Restart VS Code
# Try: Dev Containers: Rebuild Container
```

### Metro Bundler Issues

**Clear cache and restart:**
```bash
npx expo start -c
```

**Complete reset:**
```bash
rm -rf node_modules
npm install
npx expo start
```

### Supabase Connection Issues

**Check credentials:**
1. Verify `.env` file exists and has correct values
2. Restart Metro bundler after editing `.env`:
   ```bash
   # Stop Metro (Ctrl+C), then:
   npm start
   ```

**"Invalid API key":**
- Make sure you copied the `anon` key, not the `service_role` key
- Check for extra spaces or quotes in `.env`

**"Failed to create account":**
- Check Supabase dashboard → **Authentication** → **Settings**
- Ensure email confirmation is disabled for development

---

## 🔧 Useful Dev Container Commands

| Command | Description |
|---------|-------------|
| `F1` → `Dev Containers: Reopen in Container` | Reopen project in dev container |
| `F1` → `Dev Containers: Rebuild Container` | Rebuild container from scratch |
| `F1` → `Dev Containers: Reopen Folder Locally` | Exit dev container, return to local |
| `F1` → `Dev Containers: Show Container Log` | View container build logs |

---

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Complete architecture, routing, and development guide
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**: Database schema, SQL setup, testing guide

---

## 🤝 Contributing

**Setup workflow:**
1. Clone the repository
2. Open in dev container (`F1` → `Dev Containers: Reopen in Container`)
3. Wait for automatic setup (dependencies install automatically)
4. Copy `.env.example` to `.env`
5. Add your Supabase credentials
6. Run `npm start`

**Important:**
- ✅ Use the dev container for consistent environment
- ✅ Dependencies install automatically - no manual `npm install` needed
- ❌ Never commit your `.env` file
- ✅ Format on save is enabled automatically

---
