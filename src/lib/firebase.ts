// src/lib/firebase.ts

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
//@ts-ignore
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";
import { getFunctions } from "firebase/functions";

const firebaseConfig = Constants.expoConfig?.web?.config?.firebase;

let app;
if (firebaseConfig) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  console.error(
    "Firebase config is not defined. Please check your expo-constants setup."
  );
}

export const auth = initializeAuth(app!, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app!);
export const storage = getStorage(app!);
export const functions = getFunctions(app!);
