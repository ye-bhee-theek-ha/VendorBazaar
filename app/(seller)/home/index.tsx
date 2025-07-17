// app/(seller)/home/index.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSellerDashboard } from "@/src/context/seller/SellerDashboardContext";
import { useAuth } from "@/src/context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { formatTimestamp } from "@/src/helpers/formatDate";

// Neumorphic Metric Card Component
const MetricCard = ({
  title,
  value,
  icon,
  effectiveTheme,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  effectiveTheme: "light" | "dark";
}) => (
  <View className="flex-1 rounded-2xl p-4">
    {/* Neumorphic shadow effect */}

    <View
      className="absolute inset-0 rounded-2xl shadow-lg border-primary border "
      style={{
        elevation: 5,
        shadowColor: effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
        backgroundColor:
          effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      }}
    />
    <View className="flex-row justify-between items-start py-4">
      <Text
        className="text-text font-Fredoka_Regular font-semibold"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {title}
      </Text>
      <View className="">
        <Ionicons
          name={icon}
          size={24}
          color={
            effectiveTheme === "dark"
              ? darkColors.secondaryText
              : lightColors.secondaryText
          }
        />
      </View>
    </View>
    <Text
      className="text-heading font-MuseoModerno_Medium "
      style={{
        color: effectiveTheme === "dark" ? darkColors.text : lightColors.accent,
      }}
    >
      {value}
    </Text>
  </View>
);

// Updated Activity Item Card
const ActivityItemCard = ({
  item,
  effectiveTheme,
}: {
  item: any;
  effectiveTheme: "light" | "dark";
}) => {
  const isOrder = item.type === "order";
  return (
    <View className="flex-row items-center p-3">
      <View className={`w-12 h-12 rounded-full items-center justify-center `}>
        <Ionicons
          name={isOrder ? "receipt-outline" : "star-outline"}
          size={24}
          color={isOrder ? "#2563eb" : "#ca8a04"}
        />
      </View>
      <View className="flex-1 ml-4">
        <Text
          className="text-medium font-MuseoModerno_Medium"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {item.title}
        </Text>
        <Text
          className="text-small"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          {item.subtitle}
        </Text>
      </View>
      <Text
        className="text-extra_small self-start mt-2"
        style={{
          color:
            effectiveTheme === "dark"
              ? darkColors.secondaryText
              : lightColors.secondaryText,
        }}
      >
        {formatTimestamp(item.createdAt)}
      </Text>
    </View>
  );
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const { metrics, activities, loading, error } = useSellerDashboard();
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-grey-light">
        <ActivityIndicator size="large" color="#0b6623" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-grey-light">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="h-full ">
      <View className="px-7 my-6">
        <Text
          className="text-heading font-MuseoModerno_Regular"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          Welcome, {user?.fullName || "Seller"}!
        </Text>
        <Text
          className="text-medium font-MuseoModerno_Regular "
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          Here's a look at your shop today.
        </Text>
      </View>

      {/* Key Metrics Section */}
      <View className="flex-row px-5 gap-x-4">
        <MetricCard
          title="Sales Today"
          value={`$${metrics.salesToday.toFixed(2)}`}
          icon="cash-outline"
          effectiveTheme={effectiveTheme}
        />
        <MetricCard
          title="New Orders"
          value={metrics.newOrders}
          icon="cube-outline"
          effectiveTheme={effectiveTheme}
        />
      </View>

      {/* To-Do List Section */}
      <View className="px-5 mt-8">
        <Text
          className="text-heading font-MuseoModerno_Regular pl-3"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          To-Do
        </Text>
        <View
          className=" rounded-2xl p-2 shadow-lg border border-primary"
          style={{
            elevation: 5,
            shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
            backgroundColor:
              effectiveTheme === "dark" ? darkColors.card : lightColors.card,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(seller)/orders")}
            className="flex-row items-center justify-between p-4"
          >
            <Text
              className="text-text font-MuseoModerno_Regular"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              Orders to Fulfill
            </Text>
            <Text className=" text-text text-primary font-MuseoModerno_Regular">
              {metrics.newOrders}
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-grey-light/80 mx-4" />

          <TouchableOpacity
            onPress={() => {}}
            className="flex-row items-center justify-between p-4"
          >
            <Text
              className="text-text font-MuseoModerno_Regular"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              Unread Messages
            </Text>
            <Text className="font-MuseoModerno_Regular text-text text-primary">
              {metrics.unreadMessages}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity Section */}
      <View className="px-5 mt-8">
        <Text
          className="text-heading font-MuseoModerno_Regular pl-3"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          Recent Activity
        </Text>
        <View
          className=" rounded-2xl shadow-lg border border-primary mb-6"
          style={{
            elevation: 5,
            shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
            backgroundColor:
              effectiveTheme === "dark" ? darkColors.card : lightColors.card,
          }}
        >
          <View className=" rounded-2xl ">
            {activities.length > 0 ? (
              <FlatList
                data={activities.slice(0, 5)}
                renderItem={({ item }) => (
                  <ActivityItemCard
                    item={item}
                    effectiveTheme={effectiveTheme}
                  />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-gray-200/60 mx-4" />
                )}
              />
            ) : (
              <Text className="p-8 text-center text-grey text-medium">
                No recent activity.
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
