# DuCount 💰

A simple, free expense splitting app - like Splitwise/Tricount but simpler. No sign-up required, just share a link and start tracking expenses.


## ✨ Features

- **No Sign-up Required** - Create a group and share the link
- **Optional Google Sign-In** - Sign in to manage your groups
- **My Groups** - See all groups you've created in one place
- **Expense Tracking** - Track who paid for what
- **Smart Splitting** - Equal or custom splits
- **Edit & Delete** - Modify expenses and delete groups
- **Balance Calculation** - See who owes whom with debt simplification
- **Settlement Recording** - Track payments between members
- **Share Modal** - Easy link sharing when creating groups
- **Mobile-First** - Responsive design for phone and desktop
- **Real-time Sync** - Changes sync instantly via Firestore

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Firebase project with Firestore enabled

### 1. Clone and Install

```bash
git clone
cd ducount
npm install
```

### 2. Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add a Web app to your project
4. Enable **Cloud Firestore** in the Firebase Console
   - Go to Build > Firestore Database
   - Click "Create database"
   - Choose a location close to your users
   - Start in **test mode** (you can add security rules later)
5. Copy your Firebase config

### 3. Configure Environment

Copy the template file and fill in your Firebase config:

```bash
cp env.template .env.local
```

Edit `.env.local` with your Firebase credentials (from Firebase Console > Project Settings > Your apps > Web app):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 🔒 Firestore Security Rules

**Important:** Deploy the security rules to production to keep your app secure and working properly.

The project includes a `firestore.rules` file with proper security rules. Deploy them using one of these methods:

### Option 1: Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` and paste them into the editor
5. Click **Publish**

### Option 2: Firebase CLI
```bash
firebase login
firebase deploy --only firestore:rules
```

### Security Model
- **Groups**: Anyone can read/create groups (for guest access), but only authenticated users who are members can update/delete
- **Expenses & Settlements**: Anyone with the group link can manage (supports guest users)

**Note:** Guest users can create and use groups without authentication. Sign-in is optional for managing multiple groups.

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Firebase Firestore** - Database
- **React Router** - Routing

## 📱 Firestore Free Tier Limits

The app is designed to work within Firestore's free tier:
This is plenty for personal use and small groups!


## 📋 Changelog

### v1.12 (Current)
- **React 19 Upgrade** - Updated to React 19.2.1 with new features (use(), useFormStatus, etc.)
- **Smart Home Redirect** - Signed-in users go to My Groups, guests see group creation
- **New `/new` Route** - Dedicated route for creating new groups
- **Mobile UI Fixes** - Date/Paid By fields stack on mobile, constrained date picker width
- **User Menu Fix** - Dropdown now closes when tapping outside (React Portal)

### v1.11
- **Claim Profile Banner** - Visible button for signed-in users to claim their profile anytime
- **Auth-aware Session** - Sign in after skipping now re-triggers claim prompt
- **Smart Modal Start** - Already signed-in users skip welcome step, go straight to member selection

### v1.10
- **My Groups Fix** - Claimed groups now appear in "My Groups" (not just created groups)
- **userIds Array** - Groups track all associated user IDs for efficient querying
- **Skip Join for Creators** - Group creators don't see the join prompt for their own groups

### v1.9
- **Join Group Flow** - Prompt to sign in when opening group link on new device
- **Member Claiming** - Signed-in users can claim which group member they are
- **Add Yourself** - Option to add yourself as a new member when joining
- **Session Persistence** - Join prompt only shown once per session per group

### v1.8
- **Delete Groups** - Users can delete groups they created (with all expenses/settlements)
- **Edit Expenses** - Click any expense to edit its details

### v1.7
- **Copy Link Feedback** - Visual feedback (checkmark + green color) when copying links
- **Fixed Home Navigation** - Home button redirects signed-in users to My Groups

### v1.6
- **My Groups Page** - View all groups created by the signed-in user
- **Group Ownership** - Groups track who created them (`createdBy` field)
- **Smart Navigation** - After sign-in, redirect to My Groups if user has groups

### v1.5
- **Google Sign-In** - Optional authentication with Google
- **User Menu** - Avatar dropdown with sign out option

### v1.4
- **Share Modal** - After creating a group, offer to share the link immediately
- **Exit Admin Mode** - Added `?exit` parameter to leave admin mode

### v1.3
- **Admin Panel** - Secret URL parameter (`?admin=key`) to access admin page
- **Admin Features** - List all groups, copy links, delete groups

### v1.2
- **Backup created** - Pre-admin panel state

### v1.1
- **Firestore Fix** - Removed composite index requirements
- **Client-side Sorting** - Expenses and settlements sorted in browser

### v1.0
- **Initial Release** - Core expense splitting functionality
- **Group Creation** - Create groups with custom members and currency
- **Expense Management** - Add expenses with equal or custom splits
- **Balance Calculation** - Automatic debt simplification
- **Settlements** - Record payments between members

## 📄 License

MIT License - feel free to use this project for anything!
