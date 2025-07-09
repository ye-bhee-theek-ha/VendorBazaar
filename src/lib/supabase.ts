// src/lib/supabase.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { auth } from "./firebase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    const token = await currentUser.getIdToken();
    return token;
  },
});
