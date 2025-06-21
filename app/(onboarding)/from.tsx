import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

// A simple component for the gender selection buttons
const GenderButton = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 h-14 rounded-lg justify-center items-center border ${
      isSelected ? "bg-primary border-primary" : "bg-gray-50 border-gray-300"
    }`}
  >
    <Text
      className={`text-medium font-semibold ${
        isSelected ? "text-white" : "text-gray-600"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function OnboardingScreen() {
  const { user, updateInitialUserProfile, loading } = useAuth();

  // State for the form fields
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [address, setAddress] = useState("");

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Always hide the picker after a selection is made or dismissed
    setShowDatePicker(Platform.OS === "ios"); // On iOS, the picker is a modal that stays open
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Basic validation
    if (!dob || !address.trim()) {
      Alert.alert("Incomplete Form", "Please fill in all fields to continue.");
      return;
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      Alert.alert(
        "Invalid Date",
        "Please enter your date of birth in YYYY-MM-DD format."
      );
      return;
    }

    const formattedAddress = [
      {
        nickname: "Home",
        fullAddress: address,
        isDefault: true,
      },
    ];

    await updateInitialUserProfile(gender, formattedAddress, dobDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex"
      >
        <ScrollView
          // contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 h-screen px-6 py-5">
            <View className="my-12">
              <Text className="text-hero font-bold text-black mb-2 text-center font-display">
                Complete Your Profile
              </Text>
              <Text className="text-medium text-gray-500 mb-8 text-center font-sans">
                A few more details to get you started.
              </Text>
            </View>
            <View>
              {/* Date of Birth Picker Trigger */}
              <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                Date of Birth
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg px-4 mb-4 justify-center"
              >
                <Text
                  className={`text-medium ${
                    dob ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {dob ? dob.toLocaleDateString() : "Select your date of birth"}
                </Text>
              </TouchableOpacity>

              {/* Render the Date Picker when showDatePicker is true */}
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={dob || new Date()}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              {/* Gender Selection */}
              <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                Gender
              </Text>
              <View className="flex-row w-full space-x-3 mb-4">
                <GenderButton
                  label="Male"
                  isSelected={gender === "male"}
                  onPress={() => setGender("male")}
                />
                <GenderButton
                  label="Female"
                  isSelected={gender === "female"}
                  onPress={() => setGender("female")}
                />
              </View>

              {/* Address Input */}
              <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                Primary Address
              </Text>
              <TextInput
                className="w-full h-24 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 mb-6 text-medium text-gray-800 focus:border-primary"
                placeholder="Enter your full address"
                value={address}
                onChangeText={setAddress}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#A0AEC0"
              />

              {/* Submit Button */}
              <TouchableOpacity
                className={`w-full h-14 rounded-lg justify-center items-center flex-row ${
                  loading ? "bg-primary/80" : "bg-primary"
                }`}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-btn_title font-semibold font-sans">
                    Save and Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
