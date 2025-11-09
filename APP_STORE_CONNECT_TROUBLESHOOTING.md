# App Store Connect Setup Troubleshooting

This guide helps resolve common issues when setting up an app in App Store Connect.

## Common Issues & Solutions

### Issue 1: "You do not have access to create apps"

**Cause:** Insufficient permissions in App Store Connect.

**Solution:**
1. Account Holder needs to grant permissions
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Click **Users and Access**
4. Find your user → Click **Edit**
5. Ensure role is **Admin** or **App Manager** (not Developer or Marketing)
6. Under **Apps**, ensure you have permission to create apps

**Required Role for App Creation:**
- **Account Holder** ✅ Can create apps
- **Admin** ✅ Can create apps
- **App Manager** ✅ Can create apps
- **Developer** ❌ Cannot create apps
- **Marketing** ❌ Cannot create apps

### Issue 2: "Bundle ID already in use" or "Bundle ID not available"

**Cause:** Bundle ID is already registered (possibly by another app or deleted app).

**Solution A - Use existing Bundle ID:**
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers**
4. Look for `com.accountabilityapp.main` or similar
5. If it exists, use it for the app
6. Update `app.json` to match the existing Bundle ID

**Solution B - Create new Bundle ID:**
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → Continue
5. Select **App** → Continue
6. Fill in:
   - **Description**: Accountability App
   - **Bundle ID**: Explicit → `com.yourname.accountabilityapp`
   - **Capabilities**: Check any needed (Push Notifications, etc.)
7. Click **Continue** → **Register**
8. Update `app.json` with new Bundle ID

**Solution C - Pick completely different Bundle ID:**
If `com.accountabilityapp.main` is taken, try:
- `com.yourname.accountability`
- `com.yourlastname.accountabilityapp`
- `com.yourcompany.accountability`

### Issue 3: "App Name already exists"

**Cause:** App name "Accountability App" is already taken globally on App Store.

**Solution:**
App names must be unique across the entire App Store. Try variations:
- "Accountability Tracker"
- "Goal Accountability"
- "Accountability Buddy"
- "Daily Accountability"
- "[YourName]'s Accountability App"

**Note:** You can change the name later before public release.

### Issue 4: "Unable to agree to agreements"

**Cause:** Paid Applications Agreement not signed.

**Solution:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Agreements, Tax, and Banking**
3. Look for **Paid Applications Agreement**
4. Click **Request** or **Review Agreement**
5. Fill in all required information:
   - Contact Information
   - Bank Information
   - Tax Forms (W-9 for US, W-8BEN for non-US)
6. Submit for review

**Note:** Only the Account Holder can sign agreements.

### Issue 5: "Your account is pending"

**Cause:** Apple Developer Program enrollment is still processing.

**Solution:**
- Wait 24-48 hours for enrollment to complete
- Check email for confirmation from Apple
- Contact Apple Developer Support if it takes longer than 48 hours

### Issue 6: Two-Factor Authentication Issues

**Cause:** 2FA required but not set up correctly.

**Solution:**
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Go to **Security** section
4. Enable **Two-Factor Authentication**
5. Add trusted phone number and/or device
6. Try logging into App Store Connect again

## Step-by-Step: Creating App in App Store Connect (Fresh Start)

If you want to start over, follow these steps carefully:

### Step 1: Verify Account Status
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Verify **Membership** shows "Active"
3. Note your **Team ID** (you'll need this later)

### Step 2: Create Bundle ID (If Not Exists)
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → **Continue**
5. Select **App** → **Continue**
6. Fill in:
   - **Description**: Accountability App
   - **Bundle ID**: `com.accountabilityapp.main` (or your chosen ID)
   - **Capabilities**: (optional, can add later)
7. Click **Continue** → **Register**
8. **Copy the exact Bundle ID** - you'll need it

### Step 3: Sign Agreements (Account Holder Only)
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **Agreements, Tax, and Banking**
3. Complete all pending agreements
4. Add bank and tax information (required for free apps too)

### Step 4: Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps**
3. Click **+** button (top left) → **New App**
4. Fill in the form:
   - **Platforms**: Check **iOS**
   - **Name**: Choose an available name (try variations if needed)
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select the one you created in Step 2
   - **SKU**: `accountability-app-001` (any unique identifier)
   - **User Access**: Full Access
5. Click **Create**

### Step 5: Note Important Information
After creating the app, collect these details:

1. **Bundle ID**: (from Step 2) - e.g., `com.accountabilityapp.main`
2. **Apple ID** (App Store Connect App ID):
   - In App Store Connect, go to **My Apps** → Your App
   - Click **App Information** (in sidebar)
   - Copy the number next to **Apple ID** (e.g., `1234567890`)
3. **Team ID**: (from Step 1) - e.g., `ABCD123456`

Update these in your project:
- `app.json` → `ios.bundleIdentifier`
- `eas.json` → `submit.production.ios` section

## Debugging Checklist

If you're still stuck, verify:

- [ ] Apple Developer Program enrollment is **complete and active**
- [ ] You have the correct **role** (Admin or higher) in App Store Connect
- [ ] **Paid Applications Agreement** is signed (even for free apps)
- [ ] **Two-Factor Authentication** is enabled on Apple ID
- [ ] Bundle ID is created in **Apple Developer Portal**
- [ ] Bundle ID is **not already used** by another app
- [ ] App name is **unique** (not taken by another app on App Store)
- [ ] You're logged in with the **correct Apple ID** (some people have multiple)

## Getting Help

If you're still encountering issues:

1. **Check Apple Developer Forums**: [developer.apple.com/forums](https://developer.apple.com/forums)
2. **Contact Apple Developer Support**:
   - Go to [developer.apple.com/contact](https://developer.apple.com/contact)
   - Select "App Store Connect" or "Membership and Account"
3. **Phone Support**: 1-800-633-2152 (US) - Available during business hours

## Alternative: Have Your Friend Add You

If your friend is the Account Holder, they can add you as an Admin:

1. Friend goes to [App Store Connect](https://appstoreconnect.apple.com)
2. Clicks **Users and Access** → **+** button
3. Adds your Apple ID email
4. Assigns **Admin** or **App Manager** role
5. Grants access to create apps
6. You'll receive an email invitation
7. Accept invitation and create the app yourself

This way, both of you can manage the app.

## Quick Reference: Required Information

When creating an app in App Store Connect, you'll need:

| Field | Example | Where to Get It |
|-------|---------|-----------------|
| App Name | "Accountability Tracker" | Must be unique on App Store |
| Bundle ID | `com.accountabilityapp.main` | Create in Apple Developer Portal |
| SKU | `accountability-app-001` | Make up any unique string |
| Primary Language | English (U.S.) | Your choice |
| Team ID | `ABCD123456` | Apple Developer Portal → Membership |
| App Store Connect App ID | `1234567890` | Generated after app creation |

## Next Steps After Setup

Once the app is created in App Store Connect:

1. Update `app.json` with the correct Bundle ID
2. Update `eas.json` with App Store Connect App ID and Team ID
3. Continue with the TestFlight deployment process
4. Follow `TESTFLIGHT_DEPLOYMENT.md` from Step 3 onwards
