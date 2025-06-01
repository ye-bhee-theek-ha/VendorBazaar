// app/(auth)/signup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext"; // Adjust path
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      await signUp(email, password, "ali");
      // Navigation to '(tabs)/home' is handled by AuthContext/AuthLayout effect
    } catch (error: any) {
      console.error("Signup failed:", error);
      Alert.alert(
        "Signup Failed",
        error.message || "An unexpected error occurred."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-4xl font-bold text-blue-600 mb-10">
          Create Account
        </Text>

        <View className="w-full bg-white p-8 rounded-xl shadow-lg">
          <Text className="text-2xl font-semibold text-gray-700 mb-6 text-center">
            Join VendorBazaar
          </Text>

          <TextInput
            className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 text-base bg-gray-50 focus:border-blue-500"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4 text-base bg-gray-50 focus:border-blue-500"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-6 text-base bg-gray-50 focus:border-blue-500"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            className={`w-full py-3 rounded-lg ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } justify-center items-center shadow-md`}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign Up</Text>
            )}
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center items-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
