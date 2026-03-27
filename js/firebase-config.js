// ============================================================
//  Worlds of Wonder — Firebase Configuration
//  
//  HOW TO SET UP (one-time, 5 minutes):
//  1. Go to https://console.firebase.google.com/
//  2. Click "Add project" → name it "Worlds of Wonder"
//  3. In project settings → "Add app" → Web app (</> icon)
//  4. Copy the firebaseConfig object and paste the values below
//  5. Enable Authentication:
//     Firebase Console → Authentication → Sign-in method
//     → Enable: Email/Password + Google
//  6. Enable Firestore:
//     Firebase Console → Firestore Database → Create database
//     → Start in test mode (for development)
//  7. Add your domain to Authorized Domains:
//     Authentication → Settings → Authorized domains → Add domain
// ============================================================

export const WOW_FB_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId:         "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId:             "PASTE_YOUR_APP_ID_HERE",
};

// ============================================================
//  Firestore Security Rules (paste into Firebase Console)
//  Firestore → Rules tab:
// ============================================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Bookings: user can read/write their own
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    // Passports: user can read/write their own
    match /passports/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/
