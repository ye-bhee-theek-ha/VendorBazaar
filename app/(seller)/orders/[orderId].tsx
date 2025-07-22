// app/(seller)/orders/[orderId].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useSellerOrders } from "@/src/context/seller/SellerOrderContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AppUser } from "@/src/constants/types.user";
import { Order, OrderStatus } from "@/src/constants/types.order";
import { CartItem } from "@/src/constants/types.product";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useAuth } from "@/src/context/AuthContext";
import { statusToAnalyticsKey } from "@/src/helpers/helper";

// Status color mapping
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "paid":
      return "#10b981";
    case "Processing":
      return "#3b82f6";
    case "In Transit":
      return "#f59e0b";
    case "Completed":
      return "#10b981";
    case "Cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

// Order Item Card Component
const OrderItemCard = ({
  item,
  effectiveTheme,
}: {
  item: CartItem;
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  return (
    <View
      className="flex-row p-3 rounded-xl mb-2 border"
      style={{
        backgroundColor: effectiveTheme === "dark" ? "#1a1a1a" : "#f9fafb",
        borderColor: colors.border,
      }}
    >
      <Image
        source={{ uri: item.imagesUrl?.[0] || "https://placehold.co/100x100" }}
        className="w-20 h-20 rounded-lg mr-3"
        style={{ backgroundColor: colors.border }}
      />
      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-1"
          numberOfLines={2}
          style={{ color: colors.text }}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center mb-1">
          <Text className="text-sm" style={{ color: colors.secondaryText }}>
            Quantity:
          </Text>
          <Text
            className="text-sm font-medium ml-1"
            style={{ color: colors.text }}
          >
            {item.quantity}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm" style={{ color: colors.secondaryText }}>
            Price:
          </Text>
          <Text
            className="text-sm font-medium ml-1"
            style={{ color: colors.text }}
          >
            R{item.price} each
          </Text>
        </View>
      </View>
      <View className="items-end justify-center">
        <Text className="text-lg font-bold" style={{ color: colors.accent }}>
          R{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

// Info Row Component
const InfoRow = ({
  label,
  value,
  icon,
  iconColor,
  effectiveTheme,
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  effectiveTheme: "light" | "dark";
  onPress?: () => void;
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const content = (
    <View className="flex-row items-start py-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: `${iconColor || colors.accent}20`,
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor || colors.accent} />
      </View>
      <View className="flex-1">
        <Text
          className="text-xs mb-0.5"
          style={{ color: colors.secondaryText }}
        >
          {label}
        </Text>
        <Text className="text-base font-medium" style={{ color: colors.text }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.secondaryText}
          className="my-auto"
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const { newOrders, shippedOrders, completedOrders, handleUpdateStatus } =
    useSellerOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Try to find order in context first
    const allOrders = [...newOrders, ...shippedOrders, ...completedOrders];
    const orderFromContext = allOrders.find((o) => o.id === orderId);

    if (orderFromContext) {
      setOrder(orderFromContext);
      fetchCustomerDetails(orderFromContext.userId);
    } else {
      // Fetch from Firebase if not in context
      fetchOrderFromFirebase();
    }
  }, [orderId, newOrders, shippedOrders, completedOrders]);

  const fetchOrderFromFirebase = async () => {
    try {
      const orderRef = doc(db, "orders", orderId as string);
      const docSnap = await getDoc(orderRef);
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
        fetchCustomerDetails(orderData.userId);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setCustomer(userSnap.data() as AppUser);
      }
    } catch (err) {
      console.error("Error fetching customer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (newStatus: OrderStatus) => {
    if (!order || !user) return;

    Alert.alert(
      "Update Order Status",
      `Are you sure you want to mark this order as "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            setUpdating(true);
            try {
              await handleUpdateStatus(order.id, order.status, newStatus);
              Alert.alert("Success", `Order marked as "${newStatus}"`);
            } catch (error) {
              console.error("Error updating order status:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setUpdating(false);
            }
            // try {
            //   const batch = writeBatch(db);
            //   const orderRef = doc(db, "orders", order.id);
            //   const sellerRef = doc(db, "sellers", user.uid);

            //   // Update order status
            //   batch.update(orderRef, {
            //     status: newStatus,
            //     updatedAt: new Date(),
            //   });

            //   // Update seller analytics if needed
            //   const currentStatusKey = statusToAnalyticsKey(order.status);
            //   const newStatusKey = statusToAnalyticsKey(newStatus);

            //   batch.update(sellerRef, {
            //     [`orderStatusCounts.${currentStatusKey}`]: increment(-1),
            //     [`orderStatusCounts.${newStatusKey}`]: increment(1),
            //   });

            //   await batch.commit();

            //   setOrder({ ...order, status: newStatus });
            //   Alert.alert("Success", "Order status updated successfully");
            // } catch (error) {
            //   console.error("Error updating status:", error);
            //   Alert.alert("Error", "Failed to update order status");
            // } finally {
            //   setUpdating(false);
            // }
          },
        },
      ]
    );
  };

  const handleContactCustomer = () => {
    if (!customer) return;

    router.push({
      pathname: "/(messages)/chat",
      params: {
        recipientId: customer.uid,
        recipientName: customer.fullName,
      },
    });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case "paid":
        return "Processing";
      case "Processing":
        return "In Transit";
      case "In Transit":
        return "Completed";
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <MaterialIcons name="error-outline" size={48} color={colors.text} />
        <Text className="text-lg mt-3" style={{ color: colors.text }}>
          Order not found
        </Text>
      </SafeAreaView>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: `Order #${order.id.substring(0, 8)}`,
        }}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        <View className="px-4 py-4">
          {/* Order Status Banner */}
          <View
            className="rounded-2xl p-4 mb-4 border"
            style={{
              backgroundColor: `${statusColor}15`,
              borderColor: `${statusColor}30`,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className="text-xs"
                  style={{ color: colors.secondaryText }}
                >
                  Order Status
                </Text>
                <Text
                  className="text-xl font-bold mt-1"
                  style={{ color: statusColor }}
                >
                  {order.status}
                </Text>
              </View>
              <MaterialIcons
                name={
                  order.status === "Completed"
                    ? "check-circle"
                    : order.status === "Cancelled"
                    ? "cancel"
                    : "pending"
                }
                size={40}
                color={statusColor}
              />
            </View>
            <Text
              className="text-xs mt-2"
              style={{ color: colors.secondaryText }}
            >
              Placed on{" "}
              {order.createdAt.toDate().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* Customer Information */}
          <View
            className="rounded-2xl p-4 mb-4 border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff10" : "#00000010",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              className="text-btn_title font-MuseoModerno_Medium mb-3"
              style={{ color: colors.text }}
            >
              Customer Information
            </Text>

            <InfoRow
              icon="person-outline"
              label="Customer Name"
              value={order.userName || customer?.fullName || "N/A"}
              effectiveTheme={effectiveTheme}
            />

            <View className="h-px" style={{ backgroundColor: colors.border }} />

            <InfoRow
              icon="location-outline"
              label="Delivery Address"
              value={`${order.shippingAddress.fullAddress}`}
              effectiveTheme={effectiveTheme}
            />

            {customer && (
              <>
                <View
                  className="h-px"
                  style={{ backgroundColor: colors.border }}
                />
                <InfoRow
                  icon="call-outline"
                  label="Contact Customer"
                  value={customer.phoneNumber || "Send Message"}
                  effectiveTheme={effectiveTheme}
                  onPress={handleContactCustomer}
                />
              </>
            )}
          </View>

          {/* Order Items */}
          <View
            className="rounded-2xl p-4 mb-4 border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff10" : "#00000010",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              className="text-btn_title font-MuseoModerno_Medium mb-3"
              style={{ color: colors.text }}
            >
              Order Items ({order.items.length})
            </Text>
            {order.items.map((item, index) => (
              <OrderItemCard
                key={`${item.pid}-${index}`}
                item={item}
                effectiveTheme={effectiveTheme}
              />
            ))}
          </View>

          {/* Order Summary */}
          <View
            className="rounded-2xl p-4 mb-4 border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff10" : "#00000010",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              className="text-btn_title font-MuseoModerno_Medium mb-3"
              style={{ color: colors.text }}
            >
              Payment Summary
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text style={{ color: colors.secondaryText }}>Subtotal</Text>
                <Text className="font-medium" style={{ color: colors.text }}>
                  R{order.total.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text style={{ color: colors.secondaryText }}>
                  Delivery Fee
                </Text>
                <Text className="font-medium" style={{ color: colors.text }}>
                  Paid by customer
                </Text>
              </View>

              <View
                className="h-px my-2"
                style={{ backgroundColor: colors.border }}
              />

              <View className="flex-row justify-between">
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  Total Earnings
                </Text>
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.accent }}
                >
                  R{order.total.toFixed(2)}
                </Text>
              </View>
            </View>

            {order.paymentReference && (
              <View
                className="mt-3 pt-3 border-t"
                style={{ borderColor: colors.border }}
              >
                <Text
                  className="text-xs"
                  style={{ color: colors.secondaryText }}
                >
                  Payment Reference: {order.paymentReference}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {nextStatus &&
            order.status !== "Completed" &&
            order.status !== "Cancelled" && (
              <TouchableOpacity
                onPress={() => handleUpdate(nextStatus)}
                disabled={updating}
                className="rounded-2xl p-4 flex-row justify-center items-center mb-4"
                style={{
                  backgroundColor: colors.accent,
                  opacity: updating ? 0.7 : 1,
                }}
              >
                {updating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons
                      name={
                        nextStatus === "Processing"
                          ? "inventory"
                          : nextStatus === "In Transit"
                          ? "local-shipping"
                          : nextStatus === "Completed"
                          ? "check-circle"
                          : "arrow-forward"
                      }
                      size={20}
                      color="#ffffff"
                    />
                    <Text className="text-white font-bold text-base ml-2">
                      Mark as {nextStatus}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

          {/* Cancel Order Option */}
          {(order.status === "paid" || order.status === "Processing") && (
            <TouchableOpacity
              onPress={() => handleUpdate("Cancelled")}
              disabled={updating}
              className="rounded-2xl p-4 flex-row justify-center items-center border"
              style={{
                borderColor: "#ef4444",
                opacity: updating ? 0.7 : 1,
              }}
            >
              <MaterialIcons name="cancel" size={20} color="#ef4444" />
              <Text
                className="font-bold text-base ml-2"
                style={{ color: "#ef4444" }}
              >
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
