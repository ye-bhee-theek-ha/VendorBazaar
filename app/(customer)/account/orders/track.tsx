// app/(customer)/account/orders/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "@/src/context/OrderContext";
import { Order } from "@/src/constants/types.order";

const OrderCard = ({ order }: { order: Order }) => {
  const router = useRouter();
  const isCompleted =
    order.status === "Completed" || order.status === "Cancelled";
  const firstItem = order.items[0];

  return (
    <View className="bg-white p-4 rounded-lg border border-gray-200 mb-3 mx-4">
      <View className="flex-row items-center">
        <Image
          source={{
            uri: firstItem.imagesUrl?.[0] || "https://placehold.co/100x100",
          }}
          className="w-16 h-16 rounded-md mr-4"
        />
        <View className="flex-1">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {firstItem.name}
          </Text>
          {order.items.length > 1 && (
            <Text className="text-sm text-gray-500">
              and {order.items.length - 1} more
            </Text>
          )}
          <Text className="text-lg font-bold mt-1">
            ${order.total.toFixed(2)}
          </Text>
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            isCompleted ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isCompleted ? "text-green-800" : "text-blue-800"
            }`}
          >
            {order.status}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-end mt-3">
        {isCompleted ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(customer)/account/orders/leave-review",
                params: { orderId: order.id },
              })
            }
            className="bg-black rounded-lg px-4 py-2"
          >
            <Text className="text-white font-semibold">Leave Review</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(customer)/account/orders/track",
                params: { orderId: order.id },
              })
            }
            className="bg-primary rounded-lg px-4 py-2"
          >
            <Text className="text-white font-semibold">Track Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function MyOrdersScreen() {
  const { ongoingOrders, completedOrders, loading, error } = useOrders();
  const [activeTab, setActiveTab] = useState<"Ongoing" | "Completed">(
    "Ongoing"
  );

  const data = activeTab === "Ongoing" ? ongoingOrders : completedOrders;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Tab Switcher */}
      <View className="flex-row p-1 bg-gray-200 rounded-full mx-4 my-2">
        <TouchableOpacity
          onPress={() => setActiveTab("Ongoing")}
          className={`flex-1 py-2 rounded-full ${
            activeTab === "Ongoing" ? "bg-white shadow" : ""
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "Ongoing" ? "text-black" : "text-gray-500"
            }`}
          >
            Ongoing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Completed")}
          className={`flex-1 py-2 rounded-full ${
            activeTab === "Completed" ? "bg-white shadow" : ""
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "Completed" ? "text-black" : "text-gray-500"
            }`}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : data.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="file-tray-stacked-outline" size={50} color="gray" />
          <Text className="text-lg font-bold mt-4">No {activeTab} Orders!</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => <OrderCard order={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10 }}
        />
      )}
    </SafeAreaView>
  );
}
