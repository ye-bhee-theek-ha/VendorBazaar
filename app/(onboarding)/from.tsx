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
import AntDesign from "@expo/vector-icons/AntDesign";
import { db } from "@/src/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/src/context/AuthContext";

const onboardingIllustration = require("../../assets/images/auth/onboardingIllustration.webp");

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const { user } = useAuth();

  const handleProceed = async () => {
    // setLoading(true);
    // if (!user || !user.uid) {
    //   console.error("OnboardingScreen: User is not authenticated");
    //   router.replace("/(auth)/signup");
    // }
    // const userDocRef = doc(db, "users", user?.uid || "");
    // await setDoc(
    //   userDocRef,
    //   {
    //     OnboardingCompleted: "true",
    //   },
    //   { merge: true }
    // );
    // try {
    //   router.replace("/(customer)/home");
    // } catch (e) {
    //   console.error("OnboardingScreen: Failed to save onboarding status", e);
    //   router.replace("/(auth)/signup");
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 h-screen w-screen">
        <View className="items-center justify-start h-[78%] relative ">
          <Text className="text-[64px] font-bold text-black mb-4 text-start">
            Find everything at one place
          </Text>
          <View className="w-full absolute bottom-0 opacity-90 -z-10">
            <Image
              source={onboardingIllustration}
              className="self-center h-[400px]"
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="w-full flex-1 justify-end pb-5 items-center">
          <Text className="text-small text-gray-500 mb-6 text-center font-sans">
            Verifying your email address helps you to safely recover your
            password and retrieve your account.
          </Text>
          <TouchableOpacity
            onPress={handleProceed}
            className={`w-[90%] py-3.5 rounded-lg items-center justify-center shadow-md mb-2 ${
              loading ? "bg-primary-dark" : "bg-primary"
            }`}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-white text-btn_title font-semibold">
                  Sign Up for Marketplace
                </Text>
                <AntDesign name="arrowright" size={24} color={"white"} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
