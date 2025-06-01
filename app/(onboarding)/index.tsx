// app/(onboarding)/index.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const onboardingIllustration = require("../../assets/images/auth/onboardingIllustration.webp");

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleProceed = async () => {
    setLoading(true);
    try {
      // router.replace("/(auth)/signup");
    } catch (e) {
      console.error("OnboardingScreen: Failed to save onboarding status", e);
      // router.replace("/(auth)/signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-around p-6 pt-10">
        <View className="items-center flex-2 justify-center">
          <Text className="text-hero font-bold text-primary mb-4 text-center font-display">
            Find everything at one place
          </Text>
          <Image
            source={onboardingIllustration}
            className="w-64 h-64 bg-black"
            resizeMode="contain"
          />
        </View>

        <View className="w-full flex-1 justify-end pb-5">
          <Text className="text-small text-gray-500 mb-6 text-center font-sans">
            Verifying your email address helps you to safely recover your
            password and retrieve your account.
          </Text>
          <TouchableOpacity
            onPress={handleProceed}
            className={`w-full py-3.5 rounded-lg items-center justify-center shadow-md mb-2 ${
              loading ? "bg-green-400" : "bg-action-green"
            }`}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-btn_title font-semibold font-sans">
                Sign Up for Marketplace
              </Text>
            )}
          </TouchableOpacity>
          <Text className="text-extra_small text-gray-400 text-center font-sans">
            By continuing, you agree to the Marketplace Terms of Agreement and
            acknowledge the Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
