// app/(seller)/orders/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Order } from "@/src/constants/types.order";
import { useSellerOrders } from "@/src/context/seller/SellerOrderContext";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

const TABS = ["New", "Processing", "Shipped", "Completed"];

const OrderCard = ({
  order,
  effectiveTheme,
}: {
  order: Order;
  effectiveTheme: "light" | "dark";
}) => {
  const router = useRouter();
  const firstItem = order.items[0];

  return (
    <Link
      href={`/(seller)/orders/${order.id}`}
      className="bg-white p-4 rounded-lg border border-gray-200 mb-3 mx-4"
      asChild
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-bold text-base">
          Order #{order.id.substring(0, 6)}
        </Text>
        <Text className="text-sm text-gray-500">
          {order.createdAt.toDate().toLocaleDateString()}
        </Text>
      </View>
      <View className="h-px bg-gray-100 my-2" />
      <View className="flex-row items-center">
        <Image
          source={{
            uri: firstItem.imagesUrl?.[0] || "https://placehold.co/100x100",
          }}
          className="w-16 h-16 rounded-md mr-4 bg-gray-100"
        />
        <View className="flex-1">
          <Text className="text-sm text-gray-600">
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </Text>
          <Text className="text-lg font-bold mt-1">
            ${order.total.toFixed(2)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="gray" />
      </View>
    </Link>
  );
};

export default function SellerOrdersScreen() {
  const {
    newOrders,
    processingOrders,
    shippedOrders,
    completedOrders,
    loading,
    error,
  } = useSellerOrders();

  const { effectiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const dataMap = {
    New: newOrders,
    Processing: processingOrders,
    Shipped: shippedOrders,
    Completed: completedOrders,
  };

  const currentData = dataMap[activeTab as keyof typeof dataMap];

  return (
    <SafeAreaView className="flex-1">
      {/* Custom Tab Switcher */}
      <View className=" py-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`py-2 px-4 rounded-full mr-2 border`}
              style={{
                backgroundColor:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.placeholder
                      : lightColors.placeholder
                    : effectiveTheme === "dark"
                    ? darkColors.placeholder + "50"
                    : lightColors.placeholder + "50",

                borderColor:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent
                    : "transparent",

                shadowColor:
                  effectiveTheme === "dark"
                    ? darkColors.accent
                    : lightColors.accent,
              }}
            >
              <Text
                className={` font-Fredoka_Medium text-medium overflow-x-visible `}
                style={{
                  color:
                    activeTab === tab
                      ? effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text
                      : effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : currentData.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-10">
          <Ionicons
            name="receipt-outline"
            size={50}
            color={effectiveTheme ? darkColors.text : lightColors.text}
          />
          <Text
            className="text-lg font-bold mt-4"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            No {activeTab} Orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={({ item }) => (
            <OrderCard order={item} effectiveTheme={effectiveTheme} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
