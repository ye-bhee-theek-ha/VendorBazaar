// app/_layout.tsx

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

import "@/global.css";

import LoadingScreen from "@/src/screens/LoadingScreen";

import { ProductProvider } from "@/src/context/ProductContext";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchProvider } from "@/src/context/SearchContext";
import { CartProvider } from "@/src/context/CartContext";
import { OrderProvider } from "@/src/context/OrderContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(login)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const AppFonts = {
  AlbertSans: require("../assets/fonts/AlbertSans-Variable.ttf"),
  ...FontAwesome.font,
};

function RootLayoutNav() {
  const { user, initialAuthLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts(AppFonts);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!initialAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [initialAuthLoading]);

  if (!fontsLoaded || initialAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(seller)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Notifications",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="close" size={28} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProductProvider>
            <NotificationProvider>
              <SearchProvider>
                <CartProvider>
                  <OrderProvider>
                    <RootLayoutNav />
                  </OrderProvider>
                </CartProvider>
              </SearchProvider>
            </NotificationProvider>
          </ProductProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
