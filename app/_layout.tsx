// app/_layout.tsx

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useNavigation, useRouter, useSegments } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

import "@/global.css";

import LoadingScreen from "@/src/screens/LoadingScreen";

import { NotificationProvider } from "@/src/context/NotificationContext";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchProvider } from "@/src/context/SearchContext";
import { OrderProvider } from "@/src/context/OrderContext";
import { MessagingProvider } from "@/src/context/MessagingContext";

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
  const navigation = useNavigation();
  const navigationState = navigation.getState();

  const [fontsLoaded, fontError] = useFonts(AppFonts);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !initialAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialAuthLoading]);

  // useeffect to handle navigation
  useEffect(() => {
    console.log("Handling navigation based on user state and segments");
    const isRouterReady = navigationState?.key != null;

    if (!isRouterReady || initialAuthLoading) {
      return; // Wait for router and auth to be ready
    }

    const inAuthGroup = segments[0] === "(auth)";

    // If the user is not signed in and not in the auth group, redirect them.
    if (!user && !inAuthGroup) {
      console.log("No user. Redirecting to login.");
      router.replace("/(auth)/login");
      return;
    }

    // If the user is signed in, handle routing
    if (user) {
      const inOnboardingGroup = segments[0] === "(onboarding)";

      // If onboarding is not complete, redirect to onboarding.
      if (user.OnboardingCompleted === "false") {
        if (!inOnboardingGroup) {
          console.log("User not onboarded. Redirecting to onboarding.");
          router.replace("/(onboarding)");
        }
        return; // Stop further execution
      }

      // If user is onboarded and is in a public group (auth/onboarding), redirect to home.
      if (inAuthGroup || inOnboardingGroup) {
        if (user.role === "seller") {
          console.log("Redirecting seller to home.");
          router.replace("/(seller)/home");
        } else {
          console.log("Redirecting customer to home.");
          router.replace("/(customer)/home");
        }
      }
    }
  }, [user, segments, initialAuthLoading, router, navigationState]);

  if (!fontsLoaded || initialAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
      initialRouteName="(auth)"
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(seller)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen
        name="(messages)"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
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
          <MessagingProvider>
            <NotificationProvider>
              <SearchProvider>
                <OrderProvider>
                  <RootLayoutNav />
                </OrderProvider>
              </SearchProvider>
            </NotificationProvider>
          </MessagingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
