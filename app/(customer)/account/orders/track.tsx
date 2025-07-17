import React, { useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "@/src/context/OrderContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ColorPalette, darkColors, lightColors } from "@/src/constants/Colors";
import { formatTimestamp } from "@/src/helpers/formatDate";
import { ErrorState } from "@/src/helpers/skeletons";

const StatusNode = ({
  icon,
  title,
  subtitle,
  isCompleted,
  isLast,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  isCompleted: boolean;
  isLast: boolean;
  colors: ColorPalette;
}) => (
  <View className="flex-row items-start">
    {/* Vertical line */}
    {!isLast && (
      <View
        className="absolute left-4 top-8 h-full w-0.5"
        style={{ backgroundColor: isCompleted ? colors.accent : colors.border }}
      />
    )}
    {/* Icon circle */}
    <View
      className="w-8 h-8 rounded-full items-center justify-center z-10"
      style={{
        backgroundColor: isCompleted ? colors.accent : colors.card,
        borderColor: isCompleted ? colors.accent : colors.border,
        borderWidth: 2,
      }}
    >
      <Ionicons
        name={icon}
        size={16}
        color={isCompleted ? colors.card : colors.secondaryText}
      />
    </View>
    {/* Text content */}
    <View className="ml-4 pb-8 flex-1">
      <Text
        className="text-base font-MuseoModerno_Bold"
        style={{ color: isCompleted ? colors.text : colors.secondaryText }}
      >
        {title}
      </Text>
      <Text
        className="text-sm font-MuseoModerno_Regular mt-1"
        style={{ color: colors.secondaryText }}
      >
        {subtitle}
      </Text>
    </View>
  </View>
);

export default function TrackOrderScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { ongoingOrders, completedOrders, loading } = useOrders();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const order = useMemo(() => {
    return [...ongoingOrders, ...completedOrders].find((o) => o.id === orderId);
  }, [orderId, ongoingOrders, completedOrders]);

  const orderStatusSteps = useMemo(() => {
    const steps = [
      {
        status: "Paid",
        icon: "receipt-outline",
        title: "Order Confirmed",
        subtitle: "Your order has been received.",
      },
      {
        status: "Processing",
        icon: "cube-outline",
        title: "Processing",
        subtitle: "Your order is being prepared.",
      },
      {
        status: "Shipped",
        icon: "airplane-outline",
        title: "Shipped",
        subtitle: "Your order is on its way.",
      },
      {
        status: "Delivered",
        icon: "checkmark-done-outline",
        title: "Delivered",
        subtitle: "Your order has been delivered.",
      },
    ];
    const currentIndex = steps.findIndex(
      (step) => step.status.toLowerCase() === order?.status.toLowerCase()
    );
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
    }));
  }, [order]);

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!order) {
    return (
      <ErrorState
        effectiveTheme={effectiveTheme}
        error="Order not found."
        onRetry={() => router.back()}
      />
    );
  }

  const firstItem = order.items[0];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: "Track Order",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: "MuseoModerno_Bold" },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View
          className="p-4 mx-4 mt-4 rounded-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center">
            <Image
              source={{ uri: firstItem.imagesUrl?.[0] }}
              className="w-16 h-16 rounded-md mr-4"
              style={{ backgroundColor: colors.border }}
            />
            <View className="flex-1">
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                Order #{order.id.slice(-6)}
              </Text>
              <Text
                className="text-base font-MuseoModerno_Bold mt-1"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {firstItem.name}
                {order.items.length > 1
                  ? ` + ${order.items.length - 1} more`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4 mx-4 mt-4">
          {orderStatusSteps.map((step, index) => (
            <StatusNode
              key={step.status}
              icon={step.icon as React.ComponentProps<typeof Ionicons>["name"]}
              title={step.title}
              subtitle={step.subtitle}
              isCompleted={step.isCompleted}
              isLast={index === orderStatusSteps.length - 1}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
