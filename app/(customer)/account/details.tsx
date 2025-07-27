// app/(customer)/account/details.tsx
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/src/lib/firebase";
import { updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

interface FormData {
  fullName: string;
  email: string;
  gender: "male" | "female" | null;
  dob: Date | null;
  photoURL: string | null;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function EditDetailsScreen() {
  const router = useRouter();
  const { user, firebaseUser, ReFetchUser } = useAuth();
  const { effectiveTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    gender: user?.gender || null,
    dob: user?.dob || null,
    photoURL: user?.photoURL || null,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const imageScaleAnim = useRef(new Animated.Value(1)).current;

  // Individual field animations
  const fieldAnimations = {
    fullName: useRef(new Animated.Value(1)).current,
    email: useRef(new Animated.Value(1)).current,
    gender: useRef(new Animated.Value(1)).current,
    dob: useRef(new Animated.Value(1)).current,
  };

  useEffect(() => {
    // Entry animations
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
  }, []);

  const animateFieldFocus = (field: string, focused: boolean) => {
    Animated.spring(fieldAnimations[field as keyof typeof fieldAnimations], {
      toValue: focused ? 1.02 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploadingImage(true);
    try {
      // Delete old image if exists
      if (
        user.photoURL &&
        user.photoURL.includes("firebasestorage.googleapis.com")
      ) {
        await deleteImage(user.photoURL);
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `users/${user.uid}/profile-${Date.now()}.jpg`
      );
      const uploadTask = uploadBytesResumable(storageRef, blob);

      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // You can add upload progress here if needed
          },
          (error) => reject(error),
          () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
        );
      });

      setFormData({ ...formData, photoURL: downloadURL });

      // Animate image change
      Animated.sequence([
        Animated.timing(imageScaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.startsWith("https://")) return;
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code !== "storage/object-not-found") {
        console.error("Error deleting old image:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!user || !firebaseUser) return;

    setLoading(true);
    try {
      // Update Firebase Auth profile
      const updates: any = {};
      if (formData.fullName !== user.fullName) {
        updates.displayName = formData.fullName;
      }
      if (formData.photoURL !== user.photoURL) {
        updates.photoURL = formData.photoURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(firebaseUser, updates);
      }

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      const firestoreUpdates: any = {
        fullName: formData.fullName,
        gender: formData.gender,
        photoURL: formData.photoURL,
      };

      // Convert Date to Firestore Timestamp
      if (formData.dob) {
        firestoreUpdates.dob = Timestamp.fromDate(formData.dob);
      } else {
        firestoreUpdates.dob = null;
      }

      await updateDoc(userDocRef, firestoreUpdates);

      await ReFetchUser();
      router.back();
    } catch (error) {
      console.error("Error updating user details:", error);
      Alert.alert("Error", "Failed to update your details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    fieldKey,
    editable = true,
    icon,
  }: {
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    placeholder: string;
    fieldKey: string;
    editable?: boolean;
    icon: string;
  }) => (
    <Animated.View
      style={{
        transform: [
          { scale: fieldAnimations[fieldKey as keyof typeof fieldAnimations] },
        ],
        marginBottom: 20,
      }}
    >
      <View className="flex-row items-center mb-2">
        <Ionicons
          name={icon as any}
          size={20}
          color={effectiveTheme === "dark" ? darkColors.text : lightColors.text}
        />
        <Text
          className="text-sm font-medium ml-2"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
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
        onFocus={() => {
          setFocusedField(fieldKey);
          animateFieldFocus(fieldKey, true);
        }}
        onBlur={() => {
          setFocusedField(null);
          animateFieldFocus(fieldKey, false);
        }}
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
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          borderWidth: focusedField === fieldKey ? 2 : 1,
          borderColor:
            focusedField === fieldKey
              ? effectiveTheme === "dark"
                ? darkColors.accent
                : lightColors.accent
              : effectiveTheme === "dark"
              ? darkColors.border
              : lightColors.border,
          opacity: editable ? 1 : 0.6,
        }}
      />
    </Animated.View>
  );

  const GenderSelector = () => (
    <Animated.View
      style={{
        transform: [{ scale: fieldAnimations.gender }],
        marginBottom: 20,
      }}
    >
      <View className="flex-row items-center mb-2">
        <Ionicons
          name="people-outline"
          size={20}
          color={effectiveTheme === "dark" ? darkColors.text : lightColors.text}
        />
        <Text
          className="text-sm font-medium ml-2"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          Gender
        </Text>
      </View>
      <View className="flex-row gap-3">
        {["male", "female"].map((gender) => (
          <TouchableOpacity
            key={gender}
            onPress={() =>
              setFormData({ ...formData, gender: gender as "male" | "female" })
            }
            className="flex-1"
          >
            <Animated.View
              className="flex-row items-center justify-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor:
                  formData.gender === gender
                    ? effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent
                    : effectiveTheme === "dark"
                    ? "#1a1a1a"
                    : "#f3f4f6",
                borderWidth: 1,
                borderColor:
                  formData.gender === gender
                    ? effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent
                    : effectiveTheme === "dark"
                    ? darkColors.border
                    : lightColors.border,
                transform: [
                  {
                    scale: formData.gender === gender ? 1 : 0.98,
                  },
                ],
              }}
            >
              <MaterialIcons
                name={gender === "male" ? "male" : "female"}
                size={20}
                color={
                  formData.gender === gender
                    ? "#ffffff"
                    : effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text
                }
              />
              <Text
                className="ml-2 capitalize font-medium"
                style={{
                  color:
                    formData.gender === gender
                      ? "#ffffff"
                      : effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                {gender}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={80}
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
            {/* Profile Picture Section */}
            <View className="items-center my-6">
              <View className="relative">
                <Animated.View
                  style={{
                    transform: [{ scale: imageScaleAnim }],
                  }}
                >
                  <View
                    className="w-28 h-28 rounded-full items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? darkColors.accent
                          : lightColors.accent,
                    }}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="large" color="#ffffff" />
                    ) : formData.photoURL ? (
                      <Image
                        source={{ uri: formData.photoURL }}
                        className="w-full h-full"
                        style={{ resizeMode: "cover" }}
                      />
                    ) : (
                      <Ionicons name="person" size={50} color="#ffffff" />
                    )}
                  </View>
                </Animated.View>
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center"
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
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View className="mb-6">
              <InputField
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Enter your full name"
                fieldKey="fullName"
                icon="person-outline"
              />

              <InputField
                label="Email"
                value={formData.email}
                placeholder="Your email address"
                fieldKey="email"
                editable={false}
                icon="mail-outline"
              />

              <GenderSelector />

              {/* Date of Birth */}
              <Animated.View
                style={{
                  transform: [{ scale: fieldAnimations.dob }],
                  marginBottom: 20,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text
                    }
                  />
                  <Text
                    className="text-sm font-medium ml-2"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    Date of Birth
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="px-4 py-3 rounded-xl flex-row justify-between items-center"
                  style={{
                    backgroundColor:
                      effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                    borderWidth: 1,
                    borderColor:
                      effectiveTheme === "dark"
                        ? darkColors.border
                        : lightColors.border,
                  }}
                >
                  <Text
                    style={{
                      color: formData.dob
                        ? effectiveTheme === "dark"
                          ? darkColors.text
                          : lightColors.text
                        : effectiveTheme === "dark"
                        ? "#666"
                        : "#999",
                    }}
                  >
                    {formData.dob
                      ? formData.dob.toLocaleDateString()
                      : "Select your date of birth"}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text
                    }
                  />
                </Pressable>
              </Animated.View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, dob: selectedDate });
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
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
                  transform: [
                    {
                      scale: loading || uploadingImage ? 0.98 : 1,
                    },
                  ],
                  opacity: loading || uploadingImage ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Save Changes
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
