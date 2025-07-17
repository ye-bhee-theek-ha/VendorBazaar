import { useTheme } from "../context/ThemeContext";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ColorPalette, darkColors, lightColors } from "../constants/Colors";
import { router, SingularOptions } from "expo-router";
import MessagesIcon from "./MessagesIcon";

export default function HeaderRightIcons() {
  const { effectiveTheme } = useTheme();

  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        className="mr-4"
        onPress={() => router.push("/notifications")}
      >
        <Ionicons
          name="notifications-outline"
          size={28}
          color={effectiveTheme === "dark" ? darkColors.text : lightColors.text}
        />
      </TouchableOpacity>
      <MessagesIcon />
    </View>
  );
}
