import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { darkColors, lightColors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export const ProductCardSkeleton = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View
      className="flex-1 m-1.5 p-3"
      style={{ backgroundColor: colors.card, borderRadius: 8 }}
    >
      <View
        style={{ backgroundColor: colors.border }}
        className="w-full aspect-square rounded-lg"
      />
      <View
        style={{ backgroundColor: colors.border }}
        className="h-5 w-3/4 mt-3 rounded-md"
      />
      <View
        style={{ backgroundColor: colors.border }}
        className="h-4 w-1/2 mt-2 rounded-md"
      />
    </View>
  );
};

export const ProductDetailsSkeleton = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        <View
          style={{ backgroundColor: colors.border }}
          className="w-full aspect-square"
        />
        <View className="p-4">
          <View
            style={{ backgroundColor: colors.border }}
            className="w-3/4 h-8 rounded-lg mb-2"
          />
          <View
            style={{ backgroundColor: colors.border }}
            className="w-1/2 h-6 rounded-lg"
          />
          <View
            style={{ backgroundColor: colors.border }}
            className="w-full h-20 mt-4 rounded-lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ErrorState = ({
  error,
  onRetry,
  effectiveTheme,
}: {
  error: string;
  onRetry: () => void;
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      className="justify-center items-center p-5"
    >
      <Ionicons
        name="cloud-offline-outline"
        size={50}
        color={colors.tertiaryText}
      />
      <Text
        style={{ color: colors.secondaryText }}
        className="text-center text-lg mt-4"
      >
        Something went wrong
      </Text>
      <Text
        style={{ color: colors.tertiaryText }}
        className="text-center mt-2 mb-6"
      >
        {error}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ backgroundColor: colors.accent }}
        className="py-3 px-8 rounded-full"
      >
        <Text className="text-white font-bold text-base">Try Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
