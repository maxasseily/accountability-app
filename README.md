# Accountability App

A React Native accountability app built with Expo, TypeScript, and Supabase featuring a futuristic UI design.

## 🚀 Features

### Core Features
- **Authentication**: Email/password login and signup with Supabase
- **Daily Photo Upload**: Take and upload daily accountability photos
- **Groups**: Create or join accountability groups with unique 6-digit codes
- **Group Chat**: Real-time messaging within groups
- **Futuristic UI**: Dark theme with gradients and glassmorphism effects
- **Secure Storage**: Sessions persist across app restarts
- **Local Development**: Full Supabase local stack with Docker
- **TypeScript**: Full type safety throughout

### Goals & Progress
- **Running Goals**: Set weekly running goals (3x/week currently supported)
- **Weekly Progress Tracking**: Visual progress dots showing completion status
- **Auto-Reset**: Progress automatically resets each week
- **One-Tap Logging**: "Log Run" button to track goal completion
- **Photo Auto-Logging**: Uploading a photo automatically logs goal completion

### Gamification System
- **Credibility Score**: 0-100 score tracking how true you are to your word
- **Mojo Currency**: Earn and spend mojo through quest participation
- **Status Ladder**: Progress from Noob to Veteran based on credibility
- **Lifetime Goals**: Track total goals completed across all weeks

### Arena (Quests)
- **Alliance Quests**: Collaborate with teammates for double rewards
- **Battle Quests**: Compete head-to-head for mojo boosts
- **Prophecy Quests**: Predict teammate success for mojo rewards
- **Curse Quests**: Predict teammate failure for mojo rewards
- **Request System**: Send and accept quest challenges
- **Active Tracking**: View all ongoing quests and their status

### Statistics & Analytics
- **Personal Dashboard**: View your credibility, mojo, and lifetime goals
- **Credibility Charts**: Line charts tracking credibility over time
- **Goal Progress Charts**: Bar charts showing weekly/monthly progress
- **Group Leaderboard**: Compare credibility scores with group members
- **Time Periods**: View stats by week, month, or 6 months
- **Status Badges**: Visual indicators of your current rank

## 📋 What You'll Need

Before you start, make sure you have:

1. **Docker Desktop** - [Download here](https://www.docker.com/get-started) and make sure it's **running**
2. **VS Code** - [Download here](https://code.visualstudio.com/)
3. **Dev Containers extension** - [Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
4. **Git configured with SSH** - See the SSH setup guide below
5. **Supabase credentials** - Ask the project owner for these (you'll need a URL and API key)

> **New to Dev Containers?** Don't worry! They're just a way to give everyone the exact same development environment. Think of it like a pre-configured computer in a box. Everything you need is already installed inside.

---

## 🔑 SSH Setup for Git (First-Time Setup)

**Why do you need this?** To push and pull code from GitHub, you need SSH keys. The dev container automatically shares your SSH keys from your computer.

### Do you already have SSH keys?

Check if you already have SSH keys on your computer:

**On Mac/Linux:**
```bash
ls -la ~/.ssh
```

**On Windows (PowerShell):**
```powershell
dir $env:USERPROFILE\.ssh
```

**If you see files like `id_rsa` and `id_rsa.pub` (or `id_ed25519` and `id_ed25519.pub`)**, you're all set! Skip to [Quick Start](#-quick-start-5-minutes).

### Creating SSH Keys (If You Don't Have Them)

**Step 1: Generate your SSH key**

Open your terminal (Mac/Linux) or PowerShell (Windows) and run:

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

Replace `your.email@example.com` with your actual email.

**What you'll see:**
- `Enter file in which to save the key`: Just press **Enter** (uses default location)
- `Enter passphrase`: Press **Enter** for no passphrase (easier for development), or enter a passphrase (more secure)
- `Enter same passphrase again`: Press **Enter** again (or re-enter your passphrase)

You'll see something like:
```
Your identification has been saved in /Users/yourname/.ssh/id_ed25519
Your public key has been saved in /Users/yourname/.ssh/id_ed25519.pub
```

**Step 2: Add your SSH key to GitHub**

1. **Copy your public key:**

   **On Mac:**
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

   **On Linux:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output manually
   ```

   **On Windows (PowerShell):**
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
   ```

2. **Add it to GitHub:**
   - Go to [GitHub SSH Keys Settings](https://github.com/settings/keys)
   - Click **"New SSH key"**
   - Give it a title (like "My Laptop")
   - Paste your key in the "Key" field
   - Click **"Add SSH key"**

3. **Test your connection:**
   ```bash
   ssh -T git@github.com
   ```

   You should see: `Hi username! You've successfully authenticated...`

**Step 3: Configure git (if you haven't already)**

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

✅ **You're all set!** The dev container will automatically use these SSH keys.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Get the Code

Open your terminal and run:

```bash
git clone https://github.com/maxasseily/accountability-app.git
cd accountability-app
```

### Step 2: Open in VS Code

```bash
code .
```

VS Code will open the project folder.

### Step 3: Reopen in Dev Container

You'll see a popup in the bottom-right corner that says:

> **"Folder contains a Dev Container configuration file. Reopen folder to develop in a container?"**

Click **"Reopen in Container"**.

**Didn't see the popup?** No problem:
1. Press `F1` (or `Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on Mac)
2. Type: `reopen in container`
3. Click **"Dev Containers: Reopen in Container"**

**What's happening now?**
- VS Code is building your development environment (takes 2-5 minutes the first time)
- It's installing Node.js, React Native tools, and all project dependencies
- **Your SSH keys are automatically mounted** from `~/.ssh` (so git push/pull will work)
- You'll see a progress notification at the bottom-right
- ☕ Grab a coffee while you wait!

### Step 4: Start Local Supabase

The project uses **local Supabase** for development - a complete backend running on your computer!

**Start the local database:**

In the VS Code terminal (it opens at the bottom automatically), run:

```bash
npx supabase start
```

**What's happening:**
- Docker is starting up a local Supabase stack (PostgreSQL, Auth, Storage, Studio)
- First time takes 2-3 minutes (downloading Docker images)
- Future starts are much faster (~30 seconds)
- ☕ Grab a coffee while you wait!

You'll see output like:
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
```

### Step 5: Configure Your Environment

**Get your local credentials:**

```bash
npx supabase status -o env
```

This shows your local Supabase credentials:
```
SUPABASE_API_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Create your `.env` file:**

```bash
cp .env.example .env
```

**Add your credentials:**

1. Open the new `.env` file (you'll see it in the file explorer on the left)
2. Copy the anon key from `npx supabase status -o env` and add the `EXPO_PUBLIC_` prefix:
   ```bash
   # IMPORTANT: Use your computer's IP address for BOTH URLs (not 127.0.0.1!)
   EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321  # Replace with YOUR computer's IP
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Your computer's IP address (same as above)
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42  # Replace with YOUR computer's IP
   ```
3. **Find your computer's IP address** and use it for BOTH settings (see Step 6 below)
4. Save the file (`Ctrl+S` or `Cmd+S`)

> **Critical:** The `.env` file is already set up to be ignored by git automatically.

> **Tip:** Add your AI assistant tokens here too—set `CLAUDE_CODE_OAUTH_TOKEN`, `CODEX_API_KEY`, and `OPENAI_API_KEY` (same value) so the devcontainer picks them up and you stay signed in.

**Port Forwarding (Automatic):**
The devcontainer automatically forwards these ports from the container to your computer's network interface:
- `8081` - Metro Bundler (Expo dev server)
- `54321` - Supabase API (accessible at your computer's IP)
- `54323` - Supabase Studio (web UI - open in browser: `http://127.0.0.1:54323`)

**Understanding IP Addresses:**
- **Your phone needs your computer's IP for EVERYTHING**: Use the same IP (like `192.168.1.42`) for both Supabase URL and Metro hostname
- **Why not `127.0.0.1`?**: That's localhost - on your phone, `127.0.0.1` means the phone itself, not your computer
- **Port forwarding**: The devcontainer makes Supabase accessible at your computer's network IP (`0.0.0.0:54321`)
- **Your browser**: Can still use `http://127.0.0.1:54323` to access Studio UI locally

**In simple terms:**
- `127.0.0.1` = "this device" (your phone or your computer)
- `192.168.1.42` = "your computer on the network" (accessible from your phone)

### Step 6: Find Your Computer's IP Address

**Why do you need this?** Your phone needs to know where to find BOTH Metro Bundler AND Supabase running on your computer. You'll use the same IP address for both `EXPO_PUBLIC_SUPABASE_URL` and `REACT_NATIVE_PACKAGER_HOSTNAME`.

**Important:** Your phone cannot access `127.0.0.1` - that refers to the phone itself. Port forwarding makes Supabase accessible at your computer's network IP address (like `192.168.1.42:54321`).

**On Mac:**
1. Open Terminal (outside the dev container - use your Mac's terminal app)
2. Run: `ifconfig`
3. Look for the `en0` section
4. Find the line starting with `inet` (NOT `inet6`)
5. The IP address looks like `192.168.1.xxx` or `10.0.0.xxx`
6. Copy this address

Example:
```
en0: flags=8863<UP,BROADCAST,SMART,RUNNING>
    inet 192.168.1.42 netmask 0xffffff00 broadcast 192.168.1.255
```
In this example, your IP is `192.168.1.42`

**On Windows:**
1. Open PowerShell or Command Prompt
2. Run: `ipconfig`
3. Look for "Wireless LAN adapter Wi-Fi" (if using WiFi) or "Ethernet adapter" (if using cable)
4. Find the line that says `IPv4 Address`
5. The IP address looks like `192.168.1.xxx` or `10.0.0.xxx`
6. Copy this address

Example:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.42
```
In this example, your IP is `192.168.1.42`

**Add it to your .env file:**
```bash
# BOTH lines need your computer's IP address
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42
```

**Important notes:**
- Your IP address might change if you restart your router or move to a different WiFi network
- Make sure your phone is on the **same WiFi network** as your computer
- If you can't connect later, check if your IP changed and update BOTH URLs in the `.env` file
- **Use your computer's IP for BOTH settings** - not `127.0.0.1`

### Step 7: Start the App

In the VS Code terminal, run:

```bash
npm start
```

You'll see a QR code in the terminal. You have three options:

**Option A: Test on Your Phone (Recommended)**
1. Install **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. **Make sure your phone is on the same WiFi network as your computer**
3. Scan the QR code with your camera (iOS) or the Expo Go app (Android)
4. The app will load on your phone!

> **Can't connect?** Double-check that:
> - You set `REACT_NATIVE_PACKAGER_HOSTNAME` in your `.env` file (see Step 4 above)
> - Your phone is on the **same WiFi network** as your computer
> - Your IP address is correct (it may have changed)

**Option B: Test in Web Browser**
- Press `w` in the terminal

**Option C: Test in Emulator**
- Press `a` for Android or `i` for iOS (requires additional setup)

---

## ✅ Test That Everything Works

### Create Your First Account

1. The app should open showing a futuristic login screen
2. Click **"Sign Up"** at the bottom
3. Enter:
   - **Name**: Your name
   - **Email**: Use any email (even fake ones work for development)
   - **Password**: At least 8 characters
4. Click **"Sign Up"**
5. You should be taken to the home screen - Success! 🎉

### Test Login

1. Click **"Logout"** from the home screen
2. Enter the same email and password you just used
3. Click **"Sign In"**
4. You should be back at the home screen

### Test Session Persistence

1. Close the app completely on your phone
2. Open it again
3. You should **still be logged in** - no need to sign in again!

### Test Goal Setup (First-Time Onboarding)

1. After signing up, you'll see the **Credibility & Mojo Intro** screen
2. Read about how the gamification system works
3. Tap **"Next"** to learn about **Quest Types**
4. Review the four quest types (Alliance, Battle, Prophecy, Curse)
5. Tap **"Get Started"** to choose your goal
6. Select **"Running"** (currently the only available goal type)
7. Choose **"3 times per week"** frequency
8. Confirm your goal on the confirmation screen
9. You're all set! You'll see your home screen with progress dots

### Test Photo Upload & Goal Logging

1. From the home screen, tap **"Log Run"**
2. You'll see a green checkmark appear on today's progress dot
3. Your credibility score increases by 1 point
4. Alternatively, tap the photo frame to upload a photo
5. Grant camera/photo permissions when prompted
6. Select a photo from your gallery
7. The photo uploads AND automatically logs your goal for the day
8. Try uploading again - it will replace today's photo (but won't log twice)

### Test Groups & Chat

**Create a Group:**
1. Navigate to the **"Groups"** tab (people icon)
2. Tap **"Create New Group"**
3. Enter a group name
4. A 6-digit join code will be generated (e.g., `123456`)
5. Share this code with others to invite them

**Join a Group:**
1. Navigate to the **"Groups"** tab
2. Tap **"Join Existing Group"**
3. Enter a 6-digit code from someone who created a group
4. You'll see all group members and their latest photos

**Group Chat:**
1. In the Groups tab, tap the **chat icon** at the top-right
2. Send messages to your group members
3. Messages appear in real-time for all group members

### Test Arena (Quests)

1. Navigate to the **"Arena"** tab (shield icon)
2. **Note**: You must be in a group to access Arena features
3. View all group members with their credibility scores
4. Tap a member's card to see quest options
5. Choose a quest type (Alliance, Battle, Prophecy, or Curse)
6. Send the quest request
7. Wait for the member to accept (or have them accept your request)
8. View active quests in the **"Quests"** section
9. Check pending requests in the **"Requests"** section

### Test Statistics

1. Navigate to the **"Statistics"** tab (chart icon)
2. View your personal stats:
   - Current credibility score (large display)
   - Lifetime goals logged
   - Mojo total
   - Status badge (Noob, Beginner, etc.)
3. Tap the credibility score to see an explanation modal
4. Tap the status badge to see the full status ladder
5. Toggle to **"Group"** view to see:
   - Group leaderboard sorted by credibility
   - Group average credibility
   - Your rank highlighted in the list
6. Change time periods (Week, Month, 6 Months) to see different data ranges
7. View credibility line charts and goal progress bar charts

---

## 📁 Understanding the Code Structure

Here's where to find things when you start coding:

```
accountability-app/
├── app/                         # All your app screens (Expo Router file-based routing)
│   ├── (auth)/                  # Auth route group (login, signup, password reset)
│   │   ├── login.tsx           # 👈 Login screen
│   │   ├── signup.tsx          # 👈 Signup screen
│   │   └── reset-password.tsx  # 👈 Password reset
│   ├── (onboarding)/            # First-time user onboarding flow
│   │   ├── credibility-mojo-intro.tsx    # 👈 Explain credibility & mojo
│   │   ├── quest-types-intro.tsx         # 👈 Explain quest types
│   │   ├── goal-selection.tsx            # 👈 Choose goal type
│   │   ├── frequency-selection.tsx       # 👈 Choose frequency
│   │   └── goal-confirmation.tsx         # 👈 Confirm goal setup
│   └── (app)/                   # Protected app route group (requires authentication)
│       ├── home.tsx            # 👈 Home screen with photo upload & goal progress
│       ├── arena.tsx           # 👈 Quests and gamification screen
│       ├── statistics.tsx      # 👈 Personal stats & group leaderboard
│       └── groups/             # Group management screens
│           ├── index.tsx       # 👈 Groups overview (view members)
│           ├── create.tsx      # 👈 Create new group
│           ├── join.tsx        # 👈 Join existing group
│           └── chat.tsx        # 👈 Group chat screen
│
├── src/
│   ├── components/              # Reusable UI pieces
│   │   ├── ui/                  # Buttons, inputs, backgrounds
│   │   │   ├── Button.tsx      # Gradient button with variants
│   │   │   ├── Input.tsx       # Glassmorphic input
│   │   │   └── GradientBackground.tsx
│   │   ├── auth/                # Auth-specific components
│   │   ├── groups/              # Group-specific components
│   │   │   ├── GroupHeader.tsx
│   │   │   ├── MemberList.tsx
│   │   │   └── NoGroupState.tsx
│   │   ├── chat/                # Chat components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── MessageList.tsx
│   │   ├── arena/               # Arena/quest components
│   │   │   ├── ArenaMemberList.tsx
│   │   │   ├── QuestsSection.tsx
│   │   │   └── RequestsSection.tsx
│   │   └── navigation/
│   │       └── SwipeablePages.tsx
│   ├── context/
│   │   ├── AuthContext.tsx     # 👈 Handles login/logout logic
│   │   ├── GroupContext.tsx    # 👈 Manages group state
│   │   └── GoalContext.tsx     # 👈 Manages goal state & progress
│   ├── lib/
│   │   ├── supabase.ts         # 👈 Database connection
│   │   ├── goals.ts            # 👈 Goal database operations
│   │   ├── groups.ts           # 👈 Group database operations
│   │   └── statistics.ts       # 👈 Statistics queries
│   ├── types/
│   │   ├── groups.ts           # 👈 TypeScript types for groups
│   │   ├── goals.ts            # 👈 TypeScript types for goals
│   │   ├── statistics.ts       # 👈 TypeScript types for stats
│   │   └── arena.ts            # 👈 TypeScript types for quests
│   └── utils/
│       ├── colors.ts           # 👈 All the theme colors
│       ├── spacing.ts          # 👈 Spacing constants
│       ├── validation.ts       # 👈 Form validation (email, password)
│       ├── dailyPhoto.ts       # 👈 Photo upload/fetch logic
│       ├── groups.ts           # 👈 Group creation/join logic
│       └── arenaQuests.ts      # 👈 Quest logic
│
├── supabase/                    # Local Supabase development
│   ├── migrations/              # 👈 Database schema changes (version controlled)
│   ├── config.toml             # Local Supabase configuration
│   └── seed.sql                # Test data for local development
│
├── .env                         # 🔒 Your secret credentials (never commit!)
└── .env.example                 # Template showing what .env should look like
```

**Where to start coding:**
- **Add a new screen?** → Create a new file in `app/`
- **Change colors/theme?** → Edit `src/utils/colors.ts`
- **New button or input?** → Look in `src/components/ui/`
- **Modify login logic?** → Check `src/context/AuthContext.tsx`
- **Change database schema?** → Create migration in `supabase/migrations/`
- **Photo upload logic?** → Check `src/utils/dailyPhoto.ts`
- **Group features?** → Look in `src/lib/groups.ts` and `src/context/GroupContext.tsx`
- **Goal tracking?** → Check `src/lib/goals.ts` and `src/context/GoalContext.tsx`
- **Quest system?** → Look in `src/utils/arenaQuests.ts`
- **Statistics?** → Check `src/lib/statistics.ts`

---

## 🎨 The Design System

The app uses a futuristic dark theme:

- **Colors**: Deep blue/purple gradients with bright cyan accents
- **Style**: "Glassmorphism" - frosted glass effect on cards
- **Buttons**: Gradient backgrounds with glow effects
- **Inputs**: Semi-transparent with glowing borders when focused

All colors are defined in `src/utils/colors.ts` - change them there to change the entire theme!

---

## 🐛 Something Not Working?

### Git says "Permission denied (publickey)"

**This means the dev container can't access your SSH keys.**

**Fix:**
1. Make sure you've set up SSH keys following the [SSH Setup guide](#-ssh-setup-for-git-first-time-setup) above
2. Make sure your SSH keys are in the default location: `~/.ssh/` (Mac/Linux) or `C:\Users\YourName\.ssh\` (Windows)
3. Rebuild the dev container: Press `F1` → type `rebuild container` → Select **"Dev Containers: Rebuild Container"**

**Still not working?**
- Check file permissions on your SSH folder:
  ```bash
  # On Mac/Linux (run outside the container):
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/id_ed25519
  chmod 644 ~/.ssh/id_ed25519.pub
  ```
- Make sure you added your SSH key to GitHub (see SSH Setup guide)

### "Can't connect to Metro bundler" or "Can't connect to server"

This usually means your phone can't find the development server on your computer.

**Fix:**
1. **Make sure your phone is on the same WiFi network as your computer** (this is the most common issue!)
2. **Check your IP address hasn't changed:**
   - On Mac: Run `ifconfig` and look for `inet` under `en0`
   - On Windows: Run `ipconfig` and look for `IPv4 Address`
3. **Update your `.env` file** with the correct IP address in BOTH `EXPO_PUBLIC_SUPABASE_URL` and `REACT_NATIVE_PACKAGER_HOSTNAME`
4. **Restart the server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```
5. **Scan the QR code again** with your phone

**Important:** If you see errors about Supabase connection, make sure:
- `EXPO_PUBLIC_SUPABASE_URL` uses your computer's IP (e.g., `http://192.168.1.42:54321`) - NOT `127.0.0.1`
- Supabase is running: `npx supabase status`
- Port forwarding is working (should be automatic in devcontainer)
- Your phone is on the same WiFi network as your computer

### "Container build failed" or Docker errors

**Fix:**
1. Make sure Docker Desktop is open and running
2. In VS Code, press `F1`
3. Type: `rebuild container`
4. Select **"Dev Containers: Rebuild Container"**

**alternative fix:**
1. Go to Docker > Settings > Resources > File-Sharing
2. Explicitly add the path to the app directory (it will disappear as likely is under Users)
3. Try toggling /Users/ file access on and off again
4. Try rebuilding container

### App shows "Invalid API key" or login doesn't work

**Fix:**
1. Double-check your `.env` file has the correct credentials
2. Make sure there are no extra spaces or quotes
3. Stop Metro bundler (`Ctrl+C`) and restart: `npm start`

### Dependencies seem missing or code isn't working

**Fix:** Rebuild the container (it will reinstall everything):
1. Press `F1`
2. Type: `rebuild container`
3. Select **"Dev Containers: Rebuild Container"**
4. Wait for it to finish (2-5 minutes)


### Still stuck?

1. Make sure Docker Desktop is running
2. Try restarting VS Code
3. Check the **Troubleshooting** section below for more detailed help

---

## 🌳 Graphite Setup (Git Workflow)

This project uses **Graphite** for managing stacked pull requests and improving git workflow.

**Graphite is already installed** in the dev container, but you need to authenticate:

### First-Time Setup

1. **Get your Graphite auth token:**
   - Go to [graphite.dev/activate](https://graphite.dev/activate)
   - Sign in with GitHub
   - Copy your personal auth token

2. **Authenticate in the dev container:**
   ```bash
   gt auth --token <your-token-here>
   ```

3. **You're ready!** Now you can use Graphite commands like:
   ```bash
   gt create              # Create a new branch and track it
   gt submit              # Submit PR(s)
   gt stack               # See your stack of branches
   gt log                 # Enhanced git log
   ```

**Note:** Each team member must authenticate individually with their own token (don't share tokens).

**Learn more:** [Graphite Documentation](https://docs.graphite.dev/)

---

## 🔧 Useful Commands

### Working with Dev Containers

| What you want to do | How to do it |
|---------------------|--------------|
| Reopen project in container | `F1` → type `reopen in container` |
| Rebuild from scratch | `F1` → type `rebuild container` |
| Exit container, go back to local | `F1` → type `reopen folder locally` |
| See what's happening during build | `F1` → type `show container log` |

> **Tip:** You don't need to type the full command name. Just type a few letters like "rebuild" and it'll show up!

### Working with the App

```bash
# Start the app
npm start

# Clear cache and restart (if things are acting weird)
npx expo start -c

# Stop the app
# Press Ctrl+C in the terminal
```

**Note:** You no longer need to use `--tunnel` mode! The app connects directly to your computer's IP address (configured in `.env`).

---

## 🤝 Contributing

**Your first time contributing?** Here's the workflow:

1. **Make sure you're in the dev container** (you should see "Dev Container: React Native Dev Container" in the bottom-left corner of VS Code)

2. **Create a new branch for your work:**
   ```bash
   git checkout -b your-feature-name
   ```

3. **Make your changes** to the code

4. **Test your changes:**
   ```bash
   npm start
   # Test on your phone or in browser
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Describe what you changed"
   ```

6. **Push to GitHub:**
   ```bash
   git push origin your-feature-name
   ```

7. **Create a Pull Request** on GitHub

**Important things to remember:**
- ✅ Always work in the dev container
- ✅ Never commit the `.env` file (it's automatically ignored)
- ✅ Test your changes before pushing
- ✅ Write clear commit messages
- ✅ Your SSH keys are automatically shared with the container (you can git push/pull normally)

---

## 🗄️ How Database Changes Work (Simple Explanation)

**Think of the database like a filing cabinet** - it stores all the app's information (user accounts, photos, settings, etc.).

The project uses **local-first development** - you have your own complete copy of the database running on your computer!

### When You Need to Change the Database:

Let's say you want to add a new feature, like "user preferences". You'd need to add a new drawer to the filing cabinet. Here's how it works:

**1. Make Changes Locally (On Your Computer)**
```bash
# Start your local copy of the database
npx supabase start

# Make your changes in the web interface
# Visit: http://127.0.0.1:54323
```

Think of this as making a draft on paper - you can experiment safely without affecting anyone else!

**Understanding the key commands:**

```bash
# npx supabase db reset - Safe! Local only!
# What it does: Wipes your local database clean and re-applies all migrations
# When to use: Before creating a PR, after pulling new code, when DB is in bad state
# Cannot hurt production: Only affects your computer
npx supabase db reset

# npx supabase db push - Dangerous! Affects production!
# What it does: Pushes changes directly to production database
# When to use: NEVER manually! Only via GitHub Actions with approval
# Why dangerous: Bypasses review, could break production immediately

# Note: Remember your .env should use your computer's IP:
# EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321 (not 127.0.0.1)
```

**2. Save Your Changes (Create Migration)**

When you're happy with your changes, the system creates a "migration file" - it's like writing down instructions for how to update the filing cabinet.

```bash
# Generate migration from your Studio UI changes
npx supabase db diff -f my_new_feature

# Test that migration works from clean state
npx supabase db reset
```

**3. Ask Your Team to Review (Create Pull Request)**

Create a Pull Request (PR) on GitHub. This is like asking your coworkers: "Hey, I want to add this new drawer to our filing cabinet. Does this look good?"

**What happens automatically:**
- ✅ GitHub Actions validates your migration files
- ✅ Supabase creates a preview database for testing
- ✅ Team can review and test your changes

**4. Someone Approves It (Code Review)**

A senior team member reviews your changes and approves the PR. They're making sure your new drawer won't mess up the filing system!

**5. Merge to Main (Triggers Deployment)**

After approval, you merge to the `main` branch. This triggers the production deployment workflow.

**6. Manual Approval Required (Protection Gate)**

GitHub Actions **pauses** and waits for a tech lead to approve the production deployment. This is the final safety check!

**7. Automatic Deployment (Safe Push)**

Once approved, GitHub Actions runs `npx supabase db push` automatically:
- ✅ Full audit trail in GitHub Actions logs
- ✅ Team visibility via notifications
- ✅ Proper authentication and error handling
- ✅ Everyone's app now has access to the new feature!

### Why This Workflow Is Safe:

- ✅ **You can't accidentally break things** - multiple approval gates before production
- ✅ **Test locally first** - `npx supabase db reset` ensures migrations work
- ✅ **Preview branches** - Test in cloud environment before production
- ✅ **Manual approval required** - Tech lead must approve production deployment
- ✅ **Full audit trail** - Every deployment logged in GitHub Actions
- ✅ **Everything is backed up** - we can always undo if something goes wrong
- ✅ **History is saved** - we can see who changed what and when

### Protection Layers:

1. **Local Testing**: `npx supabase db reset` validates migrations work
2. **Code Review**: Team reviews PR before merge
3. **Preview Branch**: Test in cloud before production
4. **Approval Gate**: Manual approval required for production
5. **GitHub Actions**: Automated deployment with full logging

### Key Commands for Developers:

```bash
# Start your local database (safe sandbox)
npx supabase start

# See what's running and get URLs
npx supabase status

# Get environment variables for .env file
npx supabase status -o env

# Stop the local database
npx supabase stop

# Create a new migration file
npx supabase migration new describe_your_change

# Test your changes locally (USE THIS OFTEN!)
# Resets DB and re-applies all migrations - verifies migrations work
npx supabase db reset

# Generate migration from Studio UI changes
npx supabase db diff -f feature_name

# ⚠️ NEVER run this command manually (use GitHub Actions instead)
npx supabase db push
```

**Quick workflow:**
```bash
# 1. Start local Supabase
npx supabase start

# 2. Make changes in Studio UI (http://127.0.0.1:54323)

# 3. Generate migration
npx supabase db diff -f my_feature

# 4. Test migration works from clean state
npx supabase db reset

# 5. If successful, create PR!
git add supabase/migrations/
git commit -m "feat: add my feature"
git push
```

### ✅ Storage Buckets for Photo Uploads

The `daily-photos` storage bucket is **automatically created** by database migration when you run `npx supabase db reset`.

**Bucket Configuration:**
- **Name**: `daily-photos`
- **Public bucket**: ✅ Enabled
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

**Migration file**: `supabase/migrations/20251028234147_add_daily_photos_storage_bucket.sql`

**Note:** If you're having issues with photo uploads, verify the bucket exists by opening Supabase Studio (`http://127.0.0.1:54323`) → Storage tab.

**For more technical details**, see [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md)

---

## 📚 Advanced Topics

Want to dig deeper? Check these guides:

- **[CLAUDE.md](./CLAUDE.md)** - Complete technical architecture and development guide
- **[CODEX.md](./CODEX.md)** - Codex CLI context and project guidance
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database schema and local development setup
- **[SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md)** - Team workflow for database migrations (detailed)

---

## 🔒 Security Notes

- Your `.env` file contains secret credentials - **never commit it to git** (it's automatically ignored)
- The `.env.example` file is safe - it's just a template
- Don't share your Supabase credentials publicly
- User passwords are securely hashed (never stored as plain text)
- **SSH Keys**: Your `~/.ssh` folder is mounted into the dev container (read-only) so you can push/pull code. Your private keys never leave your computer.
