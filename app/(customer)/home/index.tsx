// app/(tabs)/home/index.tsx
import React from "react";
import { View, Text, Button, ScrollView, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext"; // Adjust path
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    // Navigation to login is handled by AuthContext effect
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {user?.displayName || user?.email || "User"}!
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            Explore amazing products and connect with sellers.
          </Text>

          {/* Example Product Card */}
          <View className="bg-white p-4 rounded-lg shadow-md mb-4">
            <View className="w-full h-40 bg-gray-200 rounded-md mb-3"></View>
            <Text className="text-lg font-semibold text-gray-700">
              Awesome Product 1
            </Text>
            <Text className="text-blue-600 font-bold mt-1">$99.99</Text>
            <Link href="/(tabs)/home/index" asChild>
              <TouchableOpacity className="mt-3 bg-blue-500 py-2 px-4 rounded-md self-start">
                <Text className="text-white font-medium">View Details</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="bg-white p-4 rounded-lg shadow-md mb-4">
            <View className="w-full h-40 bg-gray-200 rounded-md mb-3"></View>
            <Text className="text-lg font-semibold text-gray-700">
              Another Great Item
            </Text>
            <Text className="text-blue-600 font-bold mt-1">$49.50</Text>
            <Link href="/(tabs)/home/index" asChild>
              <TouchableOpacity className="mt-3 bg-blue-500 py-2 px-4 rounded-md self-start">
                <Text className="text-white font-medium">View Details</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Link href="/(tabs)/home/index" asChild>
            <TouchableOpacity className="my-4 bg-green-500 p-3 rounded-lg items-center">
              <Text className="text-white text-lg font-semibold">
                Go to Messages
              </Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            onPress={handleSignOut}
            className="mt-8 bg-red-500 p-3 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-semibold">Sign Out</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-2 text-center">
            User ID: {user?.uid}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
