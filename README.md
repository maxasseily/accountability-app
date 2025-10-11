# Accountability App

A React Native accountability app built with Expo, TypeScript, and Supabase featuring a futuristic UI design.

## 🚀 Features

- **Authentication**: Email/password login and signup
- **Futuristic UI**: Dark theme with gradients and glassmorphism effects
- **Secure Storage**: Sessions persist across app restarts
- **TypeScript**: Full type safety throughout

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

### Step 4: Add Your Supabase Credentials

Once the container finishes building, you'll see the project files in VS Code.

**Create your environment file:**

In the VS Code terminal (it opens at the bottom automatically), run:

```bash
cp .env.example .env
```

**Add your credentials:**

1. Open the new `.env` file (you'll see it in the file explorer on the left)
2. You'll see two lines that look like this:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. **Ask the project owner for the real values** and replace the placeholders
4. Save the file (`Ctrl+S` or `Cmd+S`)

> **Important:** Never share these credentials or commit the `.env` file to git. It's already set up to be ignored automatically.

### Step 5: Start the App

In the VS Code terminal, run:

```bash
npm start
```

You'll see a QR code in the terminal. You have three options:

**Option A: Test on Your Phone (Recommended)**
1. Install **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code with your camera (iOS) or the Expo Go app (Android)
3. The app will load on your phone!

> **Can't connect?** Run `npx expo start --tunnel` instead of `npm start`

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

---

## 📁 Understanding the Code Structure

Here's where to find things when you start coding:

```
accountability-app/
├── app/                         # All your app screens
│   ├── (auth)/                  # Login, signup, password reset
│   │   ├── login.tsx           # 👈 Login screen
│   │   ├── signup.tsx          # 👈 Signup screen
│   │   └── reset-password.tsx  # 👈 Password reset
│   └── (app)/                   # Main app (after login)
│       └── home.tsx            # 👈 Home screen
│
├── src/
│   ├── components/              # Reusable UI pieces
│   │   ├── ui/                  # Buttons, inputs, backgrounds
│   │   └── auth/                # Auth-specific components
│   ├── context/
│   │   └── AuthContext.tsx     # 👈 Handles login/logout logic
│   ├── lib/
│   │   └── supabase.ts         # 👈 Database connection
│   └── utils/
│       ├── colors.ts           # 👈 All the theme colors
│       └── validation.ts       # 👈 Form validation (email, password)
│
├── .env                         # 🔒 Your secret credentials (never commit!)
└── .env.example                 # Template showing what .env should look like
```

**Where to start coding:**
- **Add a new screen?** → Create a new file in `app/`
- **Change colors/theme?** → Edit `src/utils/colors.ts`
- **New button or input?** → Look in `src/components/ui/`
- **Modify login logic?** → Check `src/context/AuthContext.tsx`

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

**Fix:** Use tunnel mode instead:
```bash
# Stop the current server (Ctrl+C)
npx expo start --tunnel
```

### "Container build failed" or Docker errors

**Fix:**
1. Make sure Docker Desktop is open and running
2. In VS Code, press `F1`
3. Type: `rebuild container`
4. Select **"Dev Containers: Rebuild Container"**

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

# Start with tunnel (if you can't connect from your phone)
npx expo start --tunnel

# Clear cache and restart (if things are acting weird)
npx expo start -c

# Stop the app
# Press Ctrl+C in the terminal
```

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

**2. Save Your Changes**

When you're happy with your changes, the system creates a "migration file" - it's like writing down instructions for how to update the filing cabinet.

**3. Ask Your Team to Review**

Create a Pull Request (PR) on GitHub. This is like asking your coworkers: "Hey, I want to add this new drawer to our filing cabinet. Does this look good?"

**4. Someone Approves It**

A senior team member reviews your changes and clicks "Approve" in GitHub. They're making sure your new drawer won't mess up the filing system!

**5. It Automatically Updates the Real Database**

Once approved, the system **automatically** updates the production database (the one the app actually uses). Everyone's app now has access to the new feature!

### Why This Is Safe:

- ✅ **You can't accidentally break things** - changes must be approved first
- ✅ **Everything is backed up** - we can always undo if something goes wrong
- ✅ **You test locally first** - no experimenting on the real database
- ✅ **History is saved** - we can see who changed what and when

### Key Commands for Developers:

```bash
# Start your local database (safe sandbox)
npx supabase start

# See what's running
npx supabase status

# Stop the local database
npx supabase stop

# Create a new change
npx supabase migration new describe_your_change

# Test your changes locally
npx supabase db reset
```

**For more technical details**, see [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md)

---

## 📚 Advanced Topics

Want to dig deeper? Check these guides:

- **[CLAUDE.md](./CLAUDE.md)** - Complete technical architecture and development guide
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database schema and local development setup
- **[SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md)** - Team workflow for database migrations (detailed)

---

## 🔒 Security Notes

- Your `.env` file contains secret credentials - **never commit it to git** (it's automatically ignored)
- The `.env.example` file is safe - it's just a template
- Don't share your Supabase credentials publicly
- User passwords are securely hashed (never stored as plain text)
- **SSH Keys**: Your `~/.ssh` folder is mounted into the dev container (read-only) so you can push/pull code. Your private keys never leave your computer.
