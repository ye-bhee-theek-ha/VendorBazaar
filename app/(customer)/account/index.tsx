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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";

// Reusable list item component for the menu
const MenuItem = ({
  icon,
  text,
  onPress,
  isDestructive = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  onPress: () => void;
  isDestructive?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-white p-6 border-b border-gray-100"
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={24}
      color={isDestructive ? "#ef4444" : "#4B5563"}
    />
    <Text
      className={`text-[17px] text-black/90 font-medium ml-4 ${
        isDestructive ? "text-red-500" : "text-gray-800"
      }`}
    >
      {text}
    </Text>
    {!isDestructive && (
      <Ionicons
        name="chevron-forward-outline"
        size={22}
        color="#9CA3AF"
        className="ml-auto"
      />
    )}
  </TouchableOpacity>
);

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // The AuthContext will handle redirecting to the login screen
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView>
        <View className="my-4">
          <MenuItem
            icon="cube-outline"
            text="My Orders"
            onPress={() => router.push("/(customer)/account/orders")}
          />
        </View>

        {/* Account Section - Updated Paths */}
        <View className="my-4">
          <MenuItem
            icon="person-outline"
            text="My Details"
            onPress={() => router.push("/(customer)/account/details")}
          />
          <MenuItem
            icon="home-outline"
            text="Address Book"
            onPress={() => {
              router.push("/(customer)/account/address-book");
            }}
          />
          <MenuItem
            icon="wallet-outline"
            text="Payment Methods"
            onPress={() => {
              router.push("/(customer)/account/payment-methods");
            }}
          />
          <MenuItem
            icon="notifications-outline"
            text="Notifications"
            onPress={() => router.push("/notifications")}
          />
        </View>

        <View className="my-4">
          {/* Support Section */}
          <MenuItem icon="help-circle-outline" text="FAQs" onPress={() => {}} />
          <MenuItem
            icon="headset-outline"
            text="Help Center"
            onPress={() => {}}
          />
        </View>

        <View className="my-4">
          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center bg-white p-6 px-8"
            disabled={loading}
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
