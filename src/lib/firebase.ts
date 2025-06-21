// src/lib/firebase.ts

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
//@ts-ignore
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

const firebaseConfig = Constants.expoConfig?.web?.config?.firebase;

let app;
if (firebaseConfig) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  // Handle the case where firebaseConfig is undefined, e.g., throw an error or log a warning.
  console.error(
    "Firebase config is not defined. Please check your expo-constants setup."
  );
  // Or throw new Error("Firebase config is not defined.");
}

export const auth = initializeAuth(app!, {
  // Added non-null assertion operator as app might be undefined if firebaseConfig is not set
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app!);
export const storage = getStorage(app!);
