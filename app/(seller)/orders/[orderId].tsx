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
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useSellerOrders } from "@/src/context/seller/SellerOrderContext";
import { Ionicons } from "@expo/vector-icons";
import { AppUser } from "@/src/constants/types.user";
import { Order, OrderStatus } from "@/src/constants/types.order";
import { CartItem } from "@/src/constants/types.product";

// --- Reusable Components ---

const OrderItemCard = ({ item }: { item: CartItem }) => (
  <View className="flex-row items-center bg-gray-50/50 p-3 rounded-lg border border-gray-200 mb-2">
    <Image
      source={{ uri: item.imagesUrl?.[0] || "https://placehold.co/100x100" }}
      className="w-16 h-16 rounded-md mr-4"
    />
    <View className="flex-1">
      <Text className="text-base font-semibold" numberOfLines={1}>
        {item.name}
      </Text>
      <Text className="text-sm text-gray-500">Qty: {item.quantity}</Text>
    </View>
    <Text className="text-base font-bold">
      ${(item.price * item.quantity).toFixed(2)}
    </Text>
  </View>
);

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) => (
  <View className="flex-row items-start mb-3">
    <Ionicons name={icon} size={20} color="gray" className="mr-3 mt-1" />
    <View className="flex-1">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-base font-medium text-black">{value}</Text>
    </View>
  </View>
);

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  // Get all order lists from the context
  const { newOrders, processingOrders, shippedOrders, completedOrders } =
    useSellerOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const allContextOrders = [
      ...newOrders,
      ...processingOrders,
      ...shippedOrders,
      ...completedOrders,
    ];
    const orderFromContext = allContextOrders.find((o) => o.id === orderId);

    if (orderFromContext) {
      setOrder(orderFromContext);
      setLoading(false);
    } else {
      const fetchOrder = async () => {
        try {
          const orderRef = doc(db, "orders", orderId);
          const docSnap = await getDoc(orderRef);
          if (docSnap.exists()) {
            setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
          }
        } catch (err) {
          console.error("Error fetching order details:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId, newOrders, processingOrders, shippedOrders, completedOrders]);

  useEffect(() => {
    if (order?.userId) {
      const fetchCustomerDetails = async () => {
        try {
          const userRef = doc(db, "users", order.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCustomer(userSnap.data() as AppUser);
          }
        } catch (err) {
          console.error("Error fetching customer details:", err);
        }
      };
      fetchCustomerDetails();
    }
  }, [order]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    const orderRef = doc(db, "orders", order.id);
    try {
      await updateDoc(orderRef, { status: newStatus });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      Alert.alert(
        "Success",
        `Order status has been updated to "${newStatus}".`
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Could not update order status.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Order not found.</Text>
      </View>
    );
  }

  const { shippingAddress } = order;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: `Order #${order.id.substring(0, 6)}`,
          headerTitleAlign: "center",
        }}
      />
      <ScrollView>
        <View className="p-4">
          <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <InfoRow
              icon="person-outline"
              label="Customer"
              value={customer?.fullName || "N/A"}
            />
            <InfoRow
              icon="call-outline"
              label="Phone Number"
              value={customer?.phoneNumber || "N/A"}
            />
            <InfoRow
              icon="location-outline"
              label="Shipping Address"
              value={`${shippingAddress?.fullAddress}`}
            />
          </View>

          <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold mb-3">Items</Text>
            {order.items.map((item) => (
              <OrderItemCard key={item.pid} item={item} />
            ))}
          </View>

          <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold mb-3">Summary</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Sub-total</Text>
              <Text className="text-gray-800 font-medium">
                ${order.total.toFixed(2)}
              </Text>
            </View>
            <View className="h-px bg-gray-100 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-bold text-lg">Total</Text>
              <Text className="text-indigo-600 font-bold text-lg">
                ${order.total.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="mt-2">
            {order.status === "Packing" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus("In Transit")}
                className="bg-indigo-600 p-4 rounded-lg flex-row justify-center items-center"
              >
                <Ionicons name="send-outline" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Mark as Shipped
                </Text>
              </TouchableOpacity>
            )}
            {order.status === "In Transit" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus("Delivered")}
                className="bg-green-600 p-4 rounded-lg flex-row justify-center items-center"
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="white"
                />
                <Text className="text-white font-bold text-base ml-2">
                  Mark as Delivered
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
