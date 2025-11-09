# TestFlight Deployment Guide

This guide walks you through deploying the accountability app to TestFlight for iOS beta testing.

## Prerequisites

### 1. Apple Developer Account
- Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- Wait for enrollment confirmation (can take 24-48 hours)

### 2. App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** button → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Accountability App (or your preferred name)
   - **Primary Language**: English
   - **Bundle ID**: Create new → `com.accountabilityapp.main`
   - **SKU**: `accountability-app-001` (internal identifier)
   - **User Access**: Full Access
4. Click **Create**
5. Note your **App Store Connect App ID** (found in App Information)

### 3. Install EAS CLI
```bash
npm install -g eas-cli
```

### 4. Create Expo Account
- Sign up at [expo.dev](https://expo.dev) if you don't have an account
- This is free and separate from Apple Developer Account

## Step-by-Step Deployment

### Step 1: Login to EAS
```bash
eas login
```
Enter your Expo account credentials.

### Step 2: Configure Your Project
```bash
eas build:configure
```
This will detect the existing `eas.json` file and link your project to Expo.

### Step 3: Set Production Environment Variables

Your app needs to know the **production Supabase URL and API key** (not your local development ones).

```bash
# Set production Supabase URL (already in eas.json)
# Set production Supabase anon key as a secret
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your-production-anon-key>
```

To get your production Supabase anon key:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `moqzugvlwzdotgnjmndd`
3. Go to **Settings** → **API**
4. Copy the `anon` `public` key

### Step 4: Update Submit Configuration

Edit `eas.json` and update the `submit.production.ios` section:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",        // Your Apple ID email
      "ascAppId": "1234567890",                       // From App Store Connect
      "appleTeamId": "ABCD123456"                     // From Apple Developer Portal
    }
  }
}
```

**Finding your Apple Team ID:**
1. Go to [Apple Developer Account](https://developer.apple.com/account)
2. Click **Membership** in sidebar
3. Copy **Team ID**

**Finding your App Store Connect App ID:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** → Your App
3. Go to **App Information**
4. Copy the **Apple ID** number (e.g., `1234567890`)

### Step 5: Build for Production

```bash
eas build --platform ios --profile production
```

**What happens:**
- Your code is uploaded to EAS servers
- Dependencies are installed
- iOS app is built using Xcode on Apple hardware
- Build takes ~15-30 minutes
- You'll get a build URL when complete

**During the build, you may be prompted to:**
- Generate Apple credentials (let EAS handle this)
- Create provisioning profiles (answer Yes)
- Allow EAS to manage certificates (recommended)

### Step 6: Monitor Build Progress

```bash
# Check build status
eas build:list

# Or visit the build URL provided in your terminal
```

You can also monitor builds at [expo.dev/builds](https://expo.dev/builds)

### Step 7: Submit to TestFlight

Once the build completes successfully:

```bash
eas submit --platform ios --latest
```

**Alternatively, submit a specific build:**
```bash
eas submit --platform ios --id <build-id>
```

**During submission, you'll be prompted for:**
- App Store Connect API Key (EAS can generate this for you)
- Or your Apple ID password and app-specific password

**To create an app-specific password:**
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in → **Security** → **App-Specific Passwords**
3. Click **+** to generate
4. Label it "EAS Submit" and copy the password

### Step 8: Configure TestFlight in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** → **Accountability App** → **TestFlight**
3. Wait for build processing (~5-10 minutes after submission)
4. Once build appears, click on it
5. Fill in **What to Test** (release notes for testers)
6. Click **Save**

### Step 9: Add Testers

**Internal Testing (up to 100 testers, no review required):**
1. Go to **TestFlight** → **Internal Testing**
2. Click **+** next to **Internal Testers**
3. Add testers by email (must be added to App Store Connect first)
4. They'll receive an email with TestFlight link

**External Testing (unlimited testers, requires Apple review):**
1. Go to **TestFlight** → **External Testing**
2. Click **+** to create a new group
3. Add testers by email or public link
4. Submit for Beta App Review (~24-48 hours)

### Step 10: Share with Testers

Testers need the **TestFlight app**:
1. Install [TestFlight](https://apps.apple.com/app/testflight/id899247664) from App Store
2. Open email invitation or public link
3. Accept invite → Install app

## Future Updates

When you make changes and want to deploy a new version:

```bash
# Build new version
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest
```

EAS will automatically increment the build number (configured with `autoIncrement: true` in `eas.json`).

## Common Issues

### Build Fails: "No matching provisioning profile"
**Solution:** Run `eas credentials` to regenerate provisioning profiles.

### Build Fails: "Missing permissions in Info.plist"
**Solution:** Check `app.json` → `ios.infoPlist` has all required camera/photo permissions.

### Testers Can't Install: "App Not Available"
**Solution:** Ensure build has been processed and TestFlight invite was sent.

### Environment Variables Not Working
**Solution:**
```bash
# List secrets
eas secret:list

# Delete old secret
eas secret:delete --name EXPO_PUBLIC_SUPABASE_ANON_KEY

# Recreate with correct value
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <correct-key>
```

### Supabase Connection Issues in Production Build
**Problem:** App works locally but not in TestFlight.
**Solution:**
1. Verify production Supabase URL in `eas.json` → `build.production.env`
2. Verify anon key secret: `eas secret:list`
3. Check Supabase RLS policies allow access from production
4. Check Supabase project is not paused (free tier)

## Cost Summary

- **Apple Developer Program**: $99/year (required)
- **EAS Build Free Tier**:
  - iOS: 30 builds/month
  - For more builds, see [EAS Pricing](https://expo.dev/pricing)
- **Expo Account**: Free

## Automation (Optional)

You can automate builds on every merge to main using GitHub Actions.

Create `.github/workflows/eas-build-ios.yml`:

```yaml
name: EAS Build iOS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    name: Build iOS App
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive --no-wait
```

**Setup:**
1. Generate Expo token: `eas token:create`
2. Add token to GitHub: **Settings** → **Secrets** → **Actions** → **New repository secret**
3. Name: `EXPO_TOKEN`, Value: (paste token)

## Testing Checklist

Before deploying to TestFlight, verify:

- [ ] All features work in production mode locally: `npx expo start --no-dev`
- [ ] Environment variables point to production Supabase
- [ ] Camera/photo permissions work
- [ ] Authentication flow works (signup, login, reset password)
- [ ] Group creation and joining works
- [ ] Daily photo upload works
- [ ] Quest system works
- [ ] Chat works (real-time messaging)
- [ ] Statistics display correctly
- [ ] App icon and splash screen look correct

## Support

- **EAS Documentation**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **TestFlight Help**: [developer.apple.com/testflight](https://developer.apple.com/testflight)
- **Expo Forums**: [forums.expo.dev](https://forums.expo.dev)

## Next Steps

1. Deploy to TestFlight using this guide
2. Test with internal testers (team members)
3. Fix any issues
4. Submit for external beta review
5. Gather feedback from beta testers
6. Iterate and improve
7. Submit to App Store for public release (separate process)
