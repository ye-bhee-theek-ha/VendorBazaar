import React, { useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "@/src/context/OrderContext";
import { useTheme } from "@/src/context/ThemeContext";
import { ColorPalette, darkColors, lightColors } from "@/src/constants/Colors";
import { formatTimestamp } from "@/src/helpers/formatDate";
import { ErrorState } from "@/src/helpers/skeletons";
import { Order } from "@/src/constants/types.order";
import { CartItem } from "@/src/constants/types.product";

// Memoized component for individual items in the order list
const OrderItemCard = React.memo(
  ({ item, colors }: { item: CartItem; colors: ColorPalette }) => (
    <View
      className="flex-row items-center p-3 rounded-lg mb-3"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <Image
        source={{ uri: item.imagesUrl?.[0] }}
        className="w-16 h-16 rounded-md mr-4"
        style={{ backgroundColor: colors.border }}
      />
      <View className="flex-1">
        <Text
          className="text-base font-MuseoModerno_SemiBold"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          className="text-sm font-MuseoModerno_Regular"
          style={{ color: colors.secondaryText }}
        >
          Qty: {item.quantity}
        </Text>
        <Text
          className="text-base font-MuseoModerno_Bold mt-1"
          style={{ color: colors.text }}
        >
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  )
);

// Main Order Details Screen Component
export default function OrderDetailsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { ongoingOrders, completedOrders, loading } = useOrders();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const order = useMemo(() => {
    return [...ongoingOrders, ...completedOrders].find((o) => o.id === orderId);
  }, [orderId, ongoingOrders, completedOrders]);

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

  const formattedDate = formatTimestamp(order.createdAt);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: `Order #${order.id.slice(-6)}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: "MuseoModerno_Bold" },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header Section */}
        <View
          className="p-4 mx-4 mt-4 rounded-lg"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-lg font-MuseoModerno_Bold"
              style={{ color: colors.text }}
            >
              Order Details
            </Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${colors.accent}20` }}
            >
              <Text
                className="text-sm font-MuseoModerno_Bold capitalize"
                style={{ color: colors.accent }}
              >
                {order.status}
              </Text>
            </View>
          </View>
          <Text
            className="text-sm font-MuseoModerno_Regular"
            style={{ color: colors.secondaryText }}
          >
            Placed on {formattedDate}
          </Text>
          <Text
            className="text-sm font-MuseoModerno_Regular"
            style={{ color: colors.secondaryText }}
          >
            Sold by: {order.shopName}
          </Text>
        </View>

        {/* Items Section */}
        <View className="mx-4 mt-4">
          <Text
            className="text-lg font-MuseoModerno_Bold mb-2"
            style={{ color: colors.text }}
          >
            Items ({order.items.length})
          </Text>
          {order.items.map((item) => (
            <OrderItemCard key={item.pid} item={item} colors={colors} />
          ))}
        </View>

        {/* Shipping Address Section */}
        <View className="mx-4 mt-2">
          <Text
            className="text-lg font-MuseoModerno_Bold mb-2"
            style={{ color: colors.text }}
          >
            Shipping Address
          </Text>
          <View
            className="p-4 rounded-lg"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Text
              className="text-base font-MuseoModerno_SemiBold"
              style={{ color: colors.text }}
            >
              {order.shippingAddress.nickname}
            </Text>
            <Text
              className="text-sm font-MuseoModerno_Regular mt-1"
              style={{ color: colors.secondaryText }}
            >
              {order.shippingAddress.fullAddress}
            </Text>
            {/* <Text
              className="text-sm font-MuseoModerno_Regular"
              style={{ color: colors.secondaryText }}
            >
              {order.shippingAddress.state}, {order.shippingAddress.country}
            </Text> */}
          </View>
        </View>

        {/* Payment Summary Section */}
        <View className="mx-4 mt-4">
          <Text
            className="text-lg font-MuseoModerno_Bold mb-2"
            style={{ color: colors.text }}
          >
            Payment Summary
          </Text>
          <View
            className="p-4 rounded-lg"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <View className="flex-row justify-between mb-1">
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                Subtotal
              </Text>
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                ${order.total.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                Shipping
              </Text>
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                $0.00
              </Text>
            </View>
            <View
              className="border-t my-2"
              style={{ borderColor: colors.border }}
            />
            <View className="flex-row justify-between">
              <Text
                className="text-base font-MuseoModerno_Bold"
                style={{ color: colors.text }}
              >
                Total
              </Text>
              <Text
                className="text-base font-MuseoModerno_Bold"
                style={{ color: colors.text }}
              >
                ${order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Track Order Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/(customer)/account/orders/track`,
              params: { orderId: order.id },
            })
          }
          className="mx-4 mt-6 py-4 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.accent }}
        >
          <Text
            className="text-lg font-MuseoModerno_Bold"
            style={{ color: "white" }}
          >
            Track Order
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
