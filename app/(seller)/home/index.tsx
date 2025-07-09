// app/(seller)/home/index.tsx
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSellerDashboard } from "@/src/context/seller/SellerDashboardContext";
import { useAuth } from "@/src/context/AuthContext";

const MetricCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) => (
  <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
    <View className="flex-row justify-between items-start">
      <Text className="text-base font-semibold text-gray-600">{title}</Text>
      <View className={`p-2 rounded-full ${color}`}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
    </View>
    <Text className="text-3xl font-bold mt-2">{value}</Text>
  </View>
);

// Reusable component for activity items
const ActivityItemCard = ({ item }: { item: any }) => {
  const isOrder = item.type === "order";
  return (
    <View className="flex-row items-center p-3 border-b border-gray-100">
      <View
        className={`p-2.5 rounded-full ${
          isOrder ? "bg-blue-100" : "bg-yellow-100"
        }`}
      >
        <Ionicons
          name={isOrder ? "receipt-outline" : "star-outline"}
          size={22}
          color={isOrder ? "#2563eb" : "#ca8a04"}
        />
      </View>
      <View className="flex-1 ml-4">
        <Text className="font-semibold">{item.title}</Text>
        <Text className="text-sm text-gray-500">{item.subtitle}</Text>
      </View>
      <Text className="text-xs text-gray-400">
        {item.createdAt
          .toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const { metrics, activities, loading, error } = useSellerDashboard();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="p-4">
          <Text className="text-2xl font-bold">
            Welcome, {user?.fullName || "Seller"}!
          </Text>
          <Text className="text-gray-500">
            Here's a look at your shop today.
          </Text>
        </View>

        {/* Key Metrics Section */}
        <View className="flex-row px-4 gap-x-4">
          <MetricCard
            title="Sales Today"
            value={`$${metrics.salesToday.toFixed(2)}`}
            icon="cash-outline"
            color="bg-green-500"
          />
          <MetricCard
            title="New Orders"
            value={metrics.newOrders}
            icon="cube-outline"
            color="bg-blue-500"
          />
        </View>

        {/* To-Do List Section */}
        <View className="p-4 mt-4">
          <Text className="text-xl font-bold mb-2">To-Do</Text>
          <View className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => router.push("/(seller)/orders")}
              className="flex-row items-center justify-between p-2"
            >
              <Text className="text-base">Orders to Fulfill</Text>
              <Text className="font-bold text-base">{metrics.newOrders}</Text>
            </TouchableOpacity>
            <View className="h-px bg-gray-100 my-1" />
            <TouchableOpacity
              onPress={() => {}}
              className="flex-row items-center justify-between p-2"
            >
              <Text className="text-base">Unread Messages</Text>
              <Text className="font-bold text-base">
                {metrics.unreadMessages}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View className="p-4 mt-2">
          <Text className="text-xl font-bold mb-2">Recent Activity</Text>
          <View className="bg-white rounded-xl shadow-sm border border-gray-100">
            {activities.length > 0 ? (
              <FlatList
                data={activities.slice(0, 5)} // Show latest 5 activities
                renderItem={({ item }) => <ActivityItemCard item={item} />}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // The main view is a ScrollView
              />
            ) : (
              <Text className="p-4 text-center text-gray-500">
                No recent activity.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
