// app/(customer)/account/index.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { MenuItem } from "@/app/(seller)/account";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, loading, user } = useAuth();
  const { effectiveTheme } = useTheme();

  const isSeller = user?.role === "seller";

  const handleSignOut = async () => {
    await signOut();
    // The AuthContext will handle redirecting to the login screen
  };

  return (
    <SafeAreaView className="flex-1 px-3">
      <ScrollView>
        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          {isSeller && (
            <MenuItem
              iconComponent={
                <MaterialCommunityIcons
                  name="account-switch-outline"
                  size={26}
                  color="#0b6649"
                />
              }
              effectiveTheme={effectiveTheme}
              text="Switch to Selling"
              onPress={() => router.push("/(seller)/home")}
            />
          )}
          <MenuItem
            icon="cube-outline"
            text="My Orders"
            onPress={() => router.push("/(customer)/account/orders")}
            effectiveTheme={effectiveTheme}
          />
        </View>

        {/* Account Section - Updated Paths */}
        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          <MenuItem
            icon="person-outline"
            text="My Details"
            onPress={() => router.push("/(customer)/account/details")}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="home-outline"
            text="Address Book"
            onPress={() => {
              router.push("/(customer)/account/address-book");
            }}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="notifications-outline"
            text="Notifications"
            onPress={() => router.push("/notifications")}
            effectiveTheme={effectiveTheme}
          />
        </View>

        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          {/* Support Section */}
          <MenuItem
            icon="help-circle-outline"
            text="FAQs"
            onPress={() => {}}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="headset-outline"
            text="Help Center"
            onPress={() => {}}
            effectiveTheme={effectiveTheme}
          />
        </View>

        <View className="my-4 rounded-[10px] overflow-hidden">
          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center p-6 px-8 rounded-2xl shadow-lg border"
            disabled={loading}
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              elevation: 5,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            )}
            <Text className="text-[17px] text-red-500 ml-4">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
