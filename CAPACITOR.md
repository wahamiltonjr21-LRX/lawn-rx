# LawnRX — App Store Build Guide (Capacitor)

This guide walks you through packaging LawnRX for Google Play and the Apple App Store using Capacitor.

---

## How it works

Capacitor wraps your existing web app in a native shell. The app loads your **live deployed LawnRX URL** inside a WebView, so auth, the API, and Stripe all work exactly as they do on the web — no code changes needed.

---

## Prerequisites

You'll need these installed on your local machine:

- **Node.js 18+** and **pnpm**
- **For Android**: [Android Studio](https://developer.android.com/studio) with the Android SDK
- **For iOS**: A Mac with [Xcode 15+](https://developer.apple.com/xcode/) installed

---

## Step 1 — Download this project

Download or clone the project to your local machine from Replit.

---

## Step 2 — Install dependencies

```bash
pnpm install
```

---

## Step 3 — Set your deployed URL

Open `artifacts/lawn-iq/capacitor.config.ts` and replace the URL with your actual deployed Replit domain:

```ts
url: "https://YOUR-APP-NAME.replit.app",
```

---

## Step 4 — Initialize Capacitor and add platforms

Run these from inside the `artifacts/lawn-iq` directory:

```bash
cd artifacts/lawn-iq

# Initialize (only needed once)
npx cap init LawnRX com.lawnrx.app --web-dir dist/public

# Add platforms (only needed once each)
npx cap add android
npx cap add ios       # Mac only
```

---

## Step 5 — Build and sync

This builds the web app and copies it into the native project:

```bash
pnpm run cap:sync
```

Run this command every time you update your app.

---

## Step 6 — Open in Android Studio / Xcode

```bash
pnpm run cap:open:android   # opens Android Studio
pnpm run cap:open:ios       # opens Xcode (Mac only)
```

From here you build, sign, and export the app as you would any native app.

---

## Step 7 — Submit to the stores

### Google Play Store
1. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**
2. Sign with a keystore (create one if you don't have one — Android Studio will guide you)
3. Go to [play.google.com/console](https://play.google.com/console) → Create app → Upload the `.aab`
4. Fill in store listing details, screenshots, and submit for review (usually 1–3 days)

### Apple App Store
1. In Xcode: Set your **Bundle Identifier** to `com.lawnrx.app` and your **Team** to your Apple Developer account
2. **Product → Archive**, then **Distribute App → App Store Connect**
3. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → New App → fill in details and submit for review (usually 1–3 days)

---

## Store accounts you'll need

| Store | Account | Cost |
|-------|---------|------|
| Google Play | [play.google.com/console](https://play.google.com/console/signup) | $25 one-time |
| Apple App Store | [developer.apple.com](https://developer.apple.com/programs/) | $99/year |

---

## App assets you'll need for submission

- **App icon**: 1024×1024 PNG (no transparency)
- **Screenshots**: At least 3 per device size (iPhone, iPad for iOS; phone, tablet for Android)
- **Short description** (80 chars) and **full description**
- **Privacy policy URL** (required by both stores)
