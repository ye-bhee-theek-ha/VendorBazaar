import 'dotenv/config';

export default {
  "expo": {
    "name": "VendorBazaar",
    "slug": "VendorBazaar",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "vendorbazaar",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.aleeabdullah.SafeBuyAfrica",
      "googleServicesFile": process.env.GOOGLE_SERVICE_INFO_PLIST || "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "splash": {
        "image": "./assets/images/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.aleeabdullah.SafeBuyAfrica",
      "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      "softwareKeyboardLayoutMode": "pan",
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png",
      "config": {
        "firebase": {
          "apiKey": process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          "authDomain": process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          "projectId": process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          "storageBucket": process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          "messagingSenderId": process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          "appId": process.env.EXPO_PUBLIC_FIREBASE_APP_ID
        }
      }
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-web-browser",
      "@react-native-google-signin/google-signin",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "3488e348-93c5-4ab5-85b9-b6e374d5e64a"
      }
    }
  }
};