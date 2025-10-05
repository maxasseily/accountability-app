# Accountability App

A React Native accountability app built with Expo, TypeScript, and Supabase featuring a futuristic UI design.

## 🚀 Features

- **Authentication**: Email/password with Supabase
- **Futuristic UI**: Dark theme with gradients, glassmorphism effects
- **File-based Routing**: Expo Router for navigation
- **Secure Storage**: Session persistence with expo-secure-store
- **TypeScript**: Full type safety throughout the app

## 📋 Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn
- Expo Go app (for mobile testing)
- Supabase account

## 🛠️ Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd accountability-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

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

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

Quick setup:
1. Run the SQL schema in Supabase SQL Editor (see SUPABASE_SETUP.md)
2. Disable email confirmation in **Authentication → Settings** (for development)

### 5. Run the App

```bash
# Start Metro bundler
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Or for testing on physical device
npx expo start --tunnel
```

## 📱 Testing

**Create an account:**
1. Click "Sign Up"
2. Enter name, email, and password (min 8 characters)
3. Should redirect to home screen

**Login:**
1. Use the credentials you created
2. Sessions persist across app restarts

## 📁 Project Structure

```
accountability-app/
├── app/                      # File-based routing
│   ├── (auth)/              # Auth screens (login, signup, reset)
│   ├── (app)/               # Protected app screens
│   ├── _layout.tsx          # Root layout with AuthProvider
│   └── index.tsx            # Entry point (auth redirect)
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI (Button, Input, etc.)
│   │   └── auth/            # Auth-specific components
│   ├── context/
│   │   └── AuthContext.tsx  # Supabase auth integration
│   ├── lib/
│   │   └── supabase.ts      # Supabase client config
│   └── utils/
│       ├── colors.ts        # Theme colors
│       └── validation.ts    # Form validation
├── assets/                  # App icons, images
├── .env                     # Your credentials (gitignored)
├── .env.example             # Template for credentials
└── SUPABASE_SETUP.md        # Detailed Supabase setup guide
```

## 🎨 Design System

- **Colors**: Deep blue/purple gradients, cyan accents
- **Components**: Glassmorphic cards, gradient buttons
- **Theme**: Futuristic dark mode
- See `src/utils/colors.ts` for full palette

## 🔒 Security Notes

- **Never commit `.env`** - Your Supabase credentials are gitignored
- `.env.example` is a template only - contains no real credentials
- Sessions are stored securely with `expo-secure-store`
- Row Level Security (RLS) enabled on all database tables

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture and development guide
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration

## 🤝 Contributing

When setting up the project:
1. Copy `.env.example` to `.env`
2. Add your own Supabase credentials
3. Never commit your `.env` file

## 📄 License

[Your License Here]
