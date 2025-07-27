// app/(seller)/send-notifications.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/src/lib/firebase";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { Seller } from "@/src/constants/types.seller";

interface NotificationTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "product" | "sale" | "update" | "custom";
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "new_product",
    title: "New Product Launch",
    description: "Announce a new product to your followers",
    icon: "gift-outline",
    category: "product",
  },
  {
    id: "sale_discount",
    title: "Sale & Discounts",
    description: "Notify about special offers and discounts",
    icon: "pricetag-outline",
    category: "sale",
  },
  {
    id: "shop_update",
    title: "Shop Update",
    description: "General updates about your shop",
    icon: "storefront-outline",
    category: "update",
  },
  {
    id: "custom",
    title: "Custom Message",
    description: "Send a personalized message",
    icon: "chatbubble-outline",
    category: "custom",
  },
];

export default function SendNotificationsPage() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  // States
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load seller data and follower count
  useEffect(() => {
    const loadSellerData = async () => {
      if (!user || user.role !== "seller") {
        Alert.alert("Error", "You must be a seller to send notifications");
        router.back();
        return;
      }

      try {
        // Get seller document
        const sellerDocRef = doc(db, "sellers", user.uid);
        const sellerDoc = await getDoc(sellerDocRef);

        if (!sellerDoc.exists()) {
          Alert.alert("Error", "Seller profile not found");
          router.back();
          return;
        }

        const sellerInfo = { ...sellerDoc.data(), sid: sellerDoc.id } as Seller;
        setSellerData(sellerInfo);
        setFollowerCount(sellerInfo.totalFollowers || 0);
      } catch (error) {
        console.error("Error loading seller data:", error);
        Alert.alert("Error", "Failed to load seller information");
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [user]);

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);

    // Set default titles based on template
    switch (template.id) {
      case "new_product":
        setTitle("🎉 New Product Available!");
        setMessage("Check out our latest addition to the store!");
        break;
      case "sale_discount":
        setTitle("🔥 Special Offer Just for You!");
        setMessage("Don't miss out on our limited-time discount!");
        break;
      case "shop_update":
        setTitle("📢 Shop Update");
        setMessage("We have some exciting updates to share!");
        break;
      case "custom":
        setTitle("");
        setMessage("");
        break;
    }
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!user || !firebaseUser) return;
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in both title and message");
      return;
    }

    if (!sellerData) {
      Alert.alert("Error", "Seller data not loaded");
      return;
    }

    if (followerCount === 0) {
      Alert.alert(
        "Info",
        "You don't have any followers to send notifications to"
      );
      return;
    }

    const token = await firebaseUser.getIdToken();
    if (!token) {
      throw new Error("User is not authenticated.");
    }

    const CLOUD_FUNCTION_URL =
      "https://us-central1-safebuyafrica-a4d6f.cloudfunctions.net/sendNotificationToFollowers";

    if (!CLOUD_FUNCTION_URL) {
      throw new Error(
        "Please configure your Cloud Function URL in CartContext.tsx"
      );
    }

    Alert.alert(
      "Confirm Send",
      `Send notification to ${followerCount} followers?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "default",
          onPress: async () => {
            setSending(true);
            try {
              // const response = await fetch(CLOUD_FUNCTION_URL, {
              //   method: "POST",
              //   headers: {
              //     "Content-Type": "application/json",
              //     Authorization: `Bearer ${token}`,
              //   },
              //   body: JSON.stringify({
              //     sellerId: user.uid,
              //     title: title.trim(),
              //     message: message.trim(),
              //     data: {
              //       type: selectedTemplate?.category || "custom",
              //       sellerId: user.uid,
              //       shopName: sellerData.shopName,
              //     },
              //   }),
              // });

              const sendNotificationToFollowers = httpsCallable(
                functions,
                "sendNotificationToFollowers"
              );

              const result = await sendNotificationToFollowers({
                sellerId: user.uid,
                title: title.trim(),
                message: message.trim(),
                data: {
                  type: selectedTemplate?.category || "custom",
                  sellerId: user.uid,
                  shopName: sellerData.shopName,
                },
              });

              Alert.alert(
                "Success!",
                `Notification sent to ${followerCount} followers`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error) {
              console.error("Error sending notification:", error);
              Alert.alert(
                "Error",
                "Failed to send notification. Please try again."
              );
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.text, marginTop: 10 }}>
            Loading seller information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 flex justify-start"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1 px-4">
        {/* Follower Count */}
        <View
          className="rounded-lg p-4 mt-4 border"
          style={{
            backgroundColor:
              effectiveTheme === "dark" ? colors.card : colors.card,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            Reach: {followerCount} followers
          </Text>
          <Text
            style={{
              color: colors.secondaryText,
              fontSize: 14,
              marginTop: 2,
            }}
          >
            Your notification will be sent to all your followers
          </Text>
        </View>

        {/* Templates */}
        <Text
          className="text-lg font-semibold mt-6 mb-3"
          style={{ color: colors.text }}
        >
          Choose Template
        </Text>

        <View className="space-y-3">
          {NOTIFICATION_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              className="border rounded-lg p-4"
              style={{
                borderColor:
                  selectedTemplate?.id === template.id
                    ? colors.border
                    : colors.border,
                backgroundColor:
                  selectedTemplate?.id === template.id
                    ? `${colors.border}10`
                    : colors.card,
              }}
              onPress={() => handleTemplateSelect(template)}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={template.icon as any}
                  size={24}
                  color={
                    selectedTemplate?.id === template.id
                      ? colors.accent
                      : colors.text
                  }
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="font-semibold"
                    style={{
                      color:
                        selectedTemplate?.id === template.id
                          ? colors.accent
                          : colors.text,
                    }}
                  >
                    {template.title}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: colors.secondaryText }}
                  >
                    {template.description}
                  </Text>
                </View>
                {selectedTemplate?.id === template.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.accent}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        {selectedTemplate && (
          <View className="mt-6">
            <Text
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Notification Details
            </Text>

            {/* Title Input */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter notification title"
                placeholderTextColor={colors.secondaryText}
                className="border rounded-lg px-3 py-3"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  color: colors.text,
                }}
                maxLength={50}
              />
              <Text
                className="text-xs mt-1 text-right"
                style={{ color: colors.secondaryText }}
              >
                {title.length}/50
              </Text>
            </View>

            {/* Message Input */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Enter your message"
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={4}
                className="border rounded-lg px-3 py-3"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  color: colors.text,
                  textAlignVertical: "top",
                }}
                maxLength={200}
              />
              <Text
                className="text-xs mt-1 text-right"
                style={{ color: colors.secondaryText }}
              >
                {message.length}/200
              </Text>
            </View>

            {/* Preview */}
            <View
              className="border rounded-lg p-4 mb-6"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                📱 Preview
              </Text>
              <View
                className="bg-gray-100 rounded-lg p-3"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#2D2D2D" : "#F5F5F5",
                }}
              >
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {title || "Notification Title"}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ color: colors.secondaryText }}
                >
                  {message || "Notification message will appear here"}
                </Text>
                <Text
                  className="text-xs mt-2"
                  style={{ color: colors.secondaryText }}
                >
                  from {sellerData?.shopName}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Send Button */}
      {selectedTemplate && (
        <View
          className="p-4 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <TouchableOpacity
            onPress={handleSendNotification}
            disabled={sending || !title.trim() || !message.trim()}
            className="rounded-lg py-4 flex-row items-center justify-center"
            style={{
              backgroundColor:
                sending || !title.trim() || !message.trim()
                  ? colors.secondaryText
                  : colors.accent,
            }}
          >
            {sending ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2">
                  Sending...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Send to {followerCount} Followers
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
