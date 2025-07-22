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
  Pressable,
  Alert,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Seller } from "@/src/constants/types.seller"; // Assuming you have this type defined

interface SellerFormData {
  shopName: string;
  bio: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// InputField component defined outside to prevent re-creation on re-renders
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  fieldKey,
  editable = true,
  icon,
  effectiveTheme,
  focusedField,
  onFocus,
  onBlur,
  animation,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  fieldKey: string;
  editable?: boolean;
  icon: string;
  effectiveTheme: "light" | "dark";
  focusedField: string | null;
  onFocus: () => void;
  onBlur: () => void;
  animation: Animated.Value;
  multiline?: boolean;
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  return (
    <Animated.View
      style={{
        transform: [{ scale: animation }],
        marginBottom: 20,
      }}
    >
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon as any} size={20} color={colors.text} />
        <Text
          className="text-sm font-medium ml-2"
          style={{ color: colors.secondaryText }}
        >
          {label}
        </Text>
      </View>
      <AnimatedTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={effectiveTheme === "dark" ? "#666" : "#999"}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
        multiline={multiline}
        className="text-base px-4 py-3 rounded-xl"
        style={{
          backgroundColor:
            effectiveTheme === "dark"
              ? focusedField === fieldKey
                ? "#2a2a2a"
                : "#1a1a1a"
              : focusedField === fieldKey
              ? "#ffffff"
              : "#f3f4f6",
          color: colors.text,
          borderWidth: focusedField === fieldKey ? 2 : 1,
          borderColor:
            focusedField === fieldKey ? colors.accent : colors.border,
          opacity: editable ? 1 : 0.6,
          minHeight: multiline ? 100 : 0,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </Animated.View>
  );
};

export default function EditSellerDetailsScreen() {
  const router = useRouter();
  const { user, ReFetchUser } = useAuth(); // Assuming useAuth provides the authenticated user
  const { effectiveTheme } = useTheme();
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fieldAnimations = {
    shopName: useRef(new Animated.Value(1)).current,
    bio: useRef(new Animated.Value(1)).current,
    address: useRef(new Animated.Value(1)).current,
  };

  useEffect(() => {
    if (!user) return;

    const fetchSellerData = async () => {
      setInitialLoading(true);
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

    fetchSellerData();
  }, [user]);

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
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [initialLoading]);

  const animateFieldFocus = (field: string, focused: boolean) => {
    Animated.spring(fieldAnimations[field as keyof typeof fieldAnimations], {
      toValue: focused ? 1.02 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
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
      // Upload new banner if it's a local URI
      if (bannerUri && bannerUri.startsWith("file://")) {
        setUploadingImage(true);
        const storage = getStorage();
        const response = await fetch(bannerUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `shop_banners/${user.uid}`);

        await uploadBytes(storageRef, blob);
        newBannerUrl = await getDownloadURL(storageRef);
        setUploadingImage(false);
      }

      // Update Firestore seller document
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

      await ReFetchUser(); // Re-fetches user data in AuthContext
      router.back();
    } catch (error) {
      console.error("Error updating seller details:", error);
      Alert.alert(
        "Error",
        "Failed to update your shop details. Please try again."
      );
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={
            effectiveTheme === "dark" ? darkColors.accent : lightColors.accent
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor:
          effectiveTheme === "dark"
            ? darkColors.background
            : lightColors.background,
      }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}
          >
            {/* Shop Banner Section */}
            <View className="items-center my-6">
              <View className="relative">
                <TouchableOpacity
                  onPress={handleImagePick}
                  disabled={uploadingImage}
                  className="w-full aspect-[16/9] rounded-xl items-center justify-center"
                  style={{
                    backgroundColor:
                      effectiveTheme === "dark"
                        ? darkColors.border
                        : lightColors.border,
                  }}
                >
                  {bannerUri ? (
                    <Image
                      source={{ uri: bannerUri }}
                      className="w-full h-full rounded-xl"
                      style={{ resizeMode: "cover" }}
                    />
                  ) : (
                    <View className="items-center">
                      <Ionicons
                        name="image-outline"
                        size={50}
                        color={
                          effectiveTheme === "dark"
                            ? darkColors.secondaryText
                            : lightColors.secondaryText
                        }
                      />
                      <Text
                        style={{
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.secondaryText
                              : lightColors.secondaryText,
                        }}
                      >
                        Add Shop Banner
                      </Text>
                    </View>
                  )}
                  {uploadingImage && (
                    <View className="absolute inset-0 bg-black/50 rounded-xl justify-center items-center">
                      <ActivityIndicator color="#ffffff" />
                    </View>
                  )}
                  <View
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : lightColors.text,
                    }}
                  >
                    <Ionicons
                      name="camera"
                      size={20}
                      color={
                        effectiveTheme === "dark"
                          ? darkColors.background
                          : lightColors.background
                      }
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View className="mb-6">
              <InputField
                label="Shop Name"
                value={formData.shopName}
                onChangeText={(text) =>
                  setFormData({ ...formData, shopName: text })
                }
                placeholder="Enter your shop name"
                fieldKey="shopName"
                icon="storefront-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("shopName");
                  animateFieldFocus("shopName", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("shopName", false);
                }}
                animation={fieldAnimations.shopName}
              />

              <InputField
                label="Shop Bio"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell customers about your shop"
                fieldKey="bio"
                icon="document-text-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("bio");
                  animateFieldFocus("bio", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("bio", false);
                }}
                animation={fieldAnimations.bio}
                multiline
              />

              <Text
                className="text-lg font-bold mb-3"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Shop Address
              </Text>

              <InputField
                label="Street Address"
                value={formData.street}
                onChangeText={(text) =>
                  setFormData({ ...formData, street: text })
                }
                placeholder="e.g., 123 Main St"
                fieldKey="address"
                icon="location-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("address");
                  animateFieldFocus("address", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("address", false);
                }}
                animation={fieldAnimations.address}
              />
              <InputField
                label="City"
                value={formData.city}
                onChangeText={(text) =>
                  setFormData({ ...formData, city: text })
                }
                placeholder="e.g., Johannesburg"
                fieldKey="address"
                icon="map-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("address");
                  animateFieldFocus("address", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("address", false);
                }}
                animation={fieldAnimations.address}
              />
              <InputField
                label="Province"
                value={formData.province}
                onChangeText={(text) =>
                  setFormData({ ...formData, province: text })
                }
                placeholder="e.g., Gauteng"
                fieldKey="address"
                icon="map-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("address");
                  animateFieldFocus("address", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("address", false);
                }}
                animation={fieldAnimations.address}
              />
              <InputField
                label="Postal Code"
                value={formData.postalCode}
                onChangeText={(text) =>
                  setFormData({ ...formData, postalCode: text })
                }
                placeholder="e.g., 2000"
                fieldKey="address"
                icon="mail-outline"
                effectiveTheme={effectiveTheme}
                focusedField={focusedField}
                onFocus={() => {
                  setFocusedField("address");
                  animateFieldFocus("address", true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateFieldFocus("address", false);
                }}
                animation={fieldAnimations.address}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || uploadingImage}
              className="mb-8"
            >
              <Animated.View
                className="py-4 rounded-2xl items-center"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent,
                  opacity: loading || uploadingImage ? 0.7 : 1,
                  transform: [{ scale: loading ? 0.98 : 1 }],
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Save Shop Details
                  </Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
