// app/(seller)/account/details.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  Image,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, storage } from "@/src/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Seller } from "@/src/constants/types.seller";

interface SellerFormData {
  shopName: string;
  bio: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
}

export default function EditSellerDetailsScreen() {
  const router = useRouter();
  const { user, ReFetchUser } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  // State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<SellerFormData>({
    shopName: "",
    bio: "",
    street: "",
    city: "",
    postalCode: "",
    province: "",
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Fetch seller data on mount
  useEffect(() => {
    fetchSellerData();
  }, [user]);

  // Animate on load
  useEffect(() => {
    if (!initialLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [initialLoading]);

  const fetchSellerData = async () => {
    if (!user) return;

    try {
      const sellerDocRef = doc(db, "sellers", user.uid);
      const docSnap = await getDoc(sellerDocRef);

      if (docSnap.exists()) {
        const sellerData = docSnap.data() as Seller;
        setFormData({
          shopName: sellerData.shopName || "",
          bio: sellerData.bio || "",
          street: sellerData.address?.street || "",
          city: sellerData.address?.city || "",
          postalCode: sellerData.address?.postalCode || "",
          province: sellerData.address?.province || "",
        });
        setBannerUri(sellerData.shopBannerUrl || null);
      }
    } catch (error) {
      console.error("Failed to fetch seller data:", error);
      Alert.alert("Error", "Could not load your shop details.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setBannerUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    let newBannerUrl = bannerUri;

    try {
      // Upload banner if it's a local file
      if (bannerUri && bannerUri.startsWith("file://")) {
        setUploadingImage(true);
        const response = await fetch(bannerUri);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `shop_banners/${user.uid}_${Date.now()}`
        );
        await uploadBytes(storageRef, blob);
        newBannerUrl = await getDownloadURL(storageRef);
        setUploadingImage(false);
      }

      // Update Firestore
      const sellerDocRef = doc(db, "sellers", user.uid);
      await updateDoc(sellerDocRef, {
        shopName: formData.shopName,
        bio: formData.bio,
        shopBannerUrl: newBannerUrl,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province,
        },
      });

      await ReFetchUser();
      Alert.alert("Success", "Shop details updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating seller details:", error);
      Alert.alert("Error", "Failed to update shop details. Please try again.");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Shop Banner */}
            <View className="mb-6">
              <Text
                className="text-lg font-bold mb-3"
                style={{ color: colors.text }}
              >
                Shop Banner
              </Text>
              <TouchableOpacity
                onPress={handleImagePick}
                disabled={uploadingImage}
                className="rounded-xl overflow-hidden"
                style={{
                  width: Dimensions.get("window").width - 32,
                  aspectRatio: 16 / 9,
                  backgroundColor: colors.border,
                }}
              >
                {bannerUri ? (
                  <Image
                    source={{ uri: bannerUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons
                      name="image-outline"
                      size={50}
                      color={colors.secondaryText}
                    />
                    <Text
                      className="mt-2"
                      style={{ color: colors.secondaryText }}
                    >
                      Tap to add shop banner
                    </Text>
                  </View>
                )}
                {uploadingImage && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <ActivityIndicator color="#ffffff" />
                  </View>
                )}
                <View
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.text }}
                >
                  <Ionicons name="camera" size={20} color={colors.background} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Shop Name */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                Shop Name
              </Text>
              <TextInput
                value={formData.shopName}
                onChangeText={(text) =>
                  setFormData({ ...formData, shopName: text })
                }
                placeholder="Enter your shop name"
                placeholderTextColor={colors.placeholder}
                className="px-4 py-3 rounded-xl text-base"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>

            {/* Shop Bio */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                Shop Bio
              </Text>
              <TextInput
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell customers about your shop"
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                className="px-4 py-3 rounded-xl text-base"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Address Section */}
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              Shop Address
            </Text>

            {/* Street */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                Street Address
              </Text>
              <TextInput
                value={formData.street}
                onChangeText={(text) =>
                  setFormData({ ...formData, street: text })
                }
                placeholder="e.g., 123 Main St"
                placeholderTextColor={colors.placeholder}
                className="px-4 py-3 rounded-xl text-base"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>

            {/* City & Province Row */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.secondaryText }}
                >
                  City
                </Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(text) =>
                    setFormData({ ...formData, city: text })
                  }
                  placeholder="e.g., Johannesburg"
                  placeholderTextColor={colors.placeholder}
                  className="px-4 py-3 rounded-xl text-base"
                  style={{
                    backgroundColor:
                      effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              <View className="flex-1">
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.secondaryText }}
                >
                  Province
                </Text>
                <TextInput
                  value={formData.province}
                  onChangeText={(text) =>
                    setFormData({ ...formData, province: text })
                  }
                  placeholder="e.g., Gauteng"
                  placeholderTextColor={colors.placeholder}
                  className="px-4 py-3 rounded-xl text-base"
                  style={{
                    backgroundColor:
                      effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>

            {/* Postal Code */}
            <View className="mb-8">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.secondaryText }}
              >
                Postal Code
              </Text>
              <TextInput
                value={formData.postalCode}
                onChangeText={(text) =>
                  setFormData({ ...formData, postalCode: text })
                }
                placeholder="e.g., 2000"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                className="px-4 py-3 rounded-xl text-base"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || uploadingImage}
              className="py-4 rounded-2xl items-center mb-4"
              style={{
                backgroundColor: colors.accent,
                opacity: loading || uploadingImage ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Save Shop Details
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
