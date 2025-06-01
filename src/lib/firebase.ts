// src/lib/firebase.ts

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
//@ts-ignore
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbCsMitrwPaeDJna_ZDzxES_MQGBKyM4A",
  authDomain: "vendorbazarr-6bfc5.firebaseapp.com",
  projectId: "vendorbazarr-6bfc5",
  storageBucket: "vendorbazarr-6bfc5.firebasestorage.app",
  messagingSenderId: "902077437711",
  appId: "1:902077437711:web:063295292a7ca564f6507a",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
