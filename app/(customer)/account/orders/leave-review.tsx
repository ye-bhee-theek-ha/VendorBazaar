// app/(customer)/account/orders/leave-review.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useOrders } from "@/src/context/OrderContext";

interface OrderDetails {
  id: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImage: string;
  sellerName: string;
  orderDate: string;
  totalAmount: number;
}

const StarRating = ({
  rating,
  setRating,
  colors,
}: {
  rating: number;
  setRating: (rating: number) => void;
  colors: any;
}) => (
  <View className="flex-row justify-center my-6">
    {Array.from({ length: 5 }).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        className="p-2 mx-1"
        style={{
          backgroundColor:
            index < rating ? `${colors.primary}20` : "transparent",
          borderRadius: 8,
        }}
      >
        <Ionicons
          name={index < rating ? "star" : "star-outline"}
          size={40}
          color={index < rating ? "#FFC107" : colors.secondaryText}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const RatingDescription = ({
  rating,
  colors,
}: {
  rating: number;
  colors: any;
}) => {
  const descriptions = [
    "",
    "Poor - Very dissatisfied",
    "Fair - Below expectations",
    "Good - Meets expectations",
    "Very Good - Above expectations",
    "Excellent - Exceeded expectations",
  ];

  const emojis = ["", "😞", "😐", "🙂", "😊", "🤩"];

  if (rating === 0) return null;

  return (
    <View className="items-center mb-4">
      <Text className="text-3xl mb-2">{emojis[rating]}</Text>
      <Text className="text-lg font-medium" style={{ color: colors.text }}>
        {descriptions[rating]}
      </Text>
    </View>
  );
};

export default function LeaveReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const { ongoingOrders, completedOrders, loading } = useOrders();
  const router = useRouter();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    findOrderInContext();
  }, [orderId, ongoingOrders, completedOrders]);

  const findOrderInContext = () => {
    if (!orderId) return;

    // Search in both ongoing and completed orders
    const allOrders = [...ongoingOrders, ...completedOrders];
    const foundOrder = allOrders.find((order) => order.id === orderId);

    if (foundOrder) {
      setOrderDetails({
        id: foundOrder.id,
        productId: foundOrder.items[0]?.pid || "",
        sellerId: foundOrder.sellerId,
        productName: foundOrder.items[0]?.name || "Product",
        productImage: foundOrder.items[0]?.imagesUrl?.[0] || "",
        sellerName: foundOrder.shopName || "Seller",
        orderDate: foundOrder.createdAt?.toDate?.()?.toLocaleDateString() || "",
        totalAmount: foundOrder.total || 0,
      });
    } else {
      Alert.alert("Error", "Order not found");
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please select a star rating for your review."
      );
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert(
        "Review Required",
        "Please write a comment about your experience."
      );
      return;
    }

    if (!orderDetails || !user) {
      Alert.alert("Error", "Missing required information to submit review.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Add review to Firestore
      await addDoc(collection(db, "reviews"), {
        orderId: orderId,
        productId: orderDetails.productId,
        sellerId: orderDetails.sellerId,
        userId: user.uid,
        userName: user.fullName || "Anonymous",
        userPhoto: user.photoURL || null,
        rating: rating,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
        helpful: 0,
        reported: false,
      });

      await updateDoc(doc(db, "orders", orderId), {
        reviewed: true,
      });

      // Get current seller data to calculate proper average
      const sellerRef = doc(db, "sellers", orderDetails.sellerId);
      const sellerDoc = await getDoc(sellerRef);
      const sellerData = sellerDoc.exists()
        ? sellerDoc.data()
        : { totalReviews: 0, totalRating: 0 };

      // Calculate new values
      const newTotalReviews = (sellerData.totalReviews || 0) + 1;
      const newTotalRating = (sellerData.totalRating || 0) + rating;
      const newAvgRating = newTotalRating / newTotalReviews;

      await updateDoc(sellerRef, {
        totalReviews: increment(1),
        totalRating: increment(rating),
        avgRating: newAvgRating,
      });

      Alert.alert(
        "Review Submitted!",
        "Thank you for your feedback. Your review helps other customers make informed decisions.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Could not submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text
          className="mt-4 text-base"
          style={{ color: colors.secondaryText }}
        >
          Loading order details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: "Leave Review",
          headerStyle: { backgroundColor: colors.headerBackground },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          {orderDetails && (
            <View
              className="mx-4 mt-4 p-4 rounded-2xl border"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-xl mr-4 items-center justify-center overflow-hidden"
                  style={{ backgroundColor: colors.background }}
                >
                  {orderDetails.productImage ? (
                    <Image
                      source={{ uri: orderDetails.productImage }}
                      className="w-full h-full"
                      style={{ resizeMode: "cover" }}
                    />
                  ) : (
                    <Ionicons
                      name="cube-outline"
                      size={24}
                      color={colors.secondaryText}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="font-semibold text-base mb-1"
                    style={{ color: colors.text }}
                    numberOfLines={2}
                  >
                    {orderDetails.productName}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: colors.secondaryText }}
                  >
                    Sold by {orderDetails.sellerName}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: colors.secondaryText }}
                  >
                    Ordered on {orderDetails.orderDate}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Review Section */}
          <View className="px-4 py-6">
            <Text
              className="text-center text-2xl font-semibold mb-2"
              style={{ color: colors.text }}
            >
              How was your experience?
            </Text>
            <Text
              className="text-center text-base mb-6"
              style={{ color: colors.secondaryText }}
            >
              Your honest feedback helps improve our service
            </Text>

            <StarRating rating={rating} setRating={setRating} colors={colors} />

            <RatingDescription rating={rating} colors={colors} />

            {/* Review Text Input */}
            <View
              className="border rounded-2xl p-4 mb-6"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text
                className="font-medium mb-3 text-base"
                style={{ color: colors.text }}
              >
                Share your thoughts
              </Text>
              <TextInput
                placeholder="Tell others about your experience with this product and seller..."
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={6}
                value={reviewText}
                onChangeText={setReviewText}
                className="text-base leading-6"
                style={{
                  color: colors.text,
                  textAlignVertical: "top",
                  minHeight: 120,
                }}
                maxLength={500}
              />
              <Text
                className="text-right text-xs mt-2"
                style={{ color: colors.secondaryText }}
              >
                {reviewText.length}/500
              </Text>
            </View>

            {/* Guidelines */}
            <View
              className="border rounded-xl p-4 mb-6"
              style={{
                borderColor: `${colors.accent}30`,
                backgroundColor: `${colors.accent}10`,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.accent}
                />
                <Text
                  className="font-medium ml-2"
                  style={{ color: colors.accent }}
                >
                  Review Guidelines
                </Text>
              </View>
              <Text
                className="text-sm leading-5"
                style={{ color: colors.text }}
              >
                • Be honest and constructive{"\n"}• Focus on the product and
                service quality{"\n"}• Avoid personal information{"\n"}• Keep it
                respectful and helpful
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View
          className="p-4 border-t"
          style={{
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="rounded-2xl py-4 flex-row items-center justify-center"
            style={{
              backgroundColor:
                isSubmitting || rating === 0
                  ? colors.secondaryText
                  : colors.accent,
            }}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2 text-base">
                  Submitting...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-semibold ml-2 text-base">
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>

          {rating === 0 && (
            <Text
              className="text-center text-sm mt-2"
              style={{ color: colors.secondaryText }}
            >
              Please select a rating to continue
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
