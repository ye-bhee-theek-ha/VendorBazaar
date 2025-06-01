// app/(tabs)/home/messaging/index.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const chats = [
  {
    id: "chat123",
    userName: "Seller One",
    lastMessage: "Okay, sounds good!",
    avatar: "https://placehold.co/100x100/A0A0A0/FFFFFF?text=S1",
  },
  {
    id: "chat456",
    userName: "Buyer Two",
    lastMessage: "Is this still available?",
    avatar: "https://placehold.co/100x100/B0B0B0/FFFFFF?text=B2",
  },
  {
    id: "chat789",
    userName: "Support Team",
    lastMessage: "We received your query.",
    avatar: "https://placehold.co/100x100/C0C0C0/FFFFFF?text=ST",
  },
];

export default function ChatListScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header is managed by (tabs)/_layout.tsx */}
      {/* <Stack.Screen options={{ title: "Messages" }} /> */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: `/(tabs)/home/messaging/[chatId]`,
              params: { chatId: item.id },
            }}
            asChild
          >
            <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-200">
              <Image
                source={{ uri: item.avatar }}
                className="w-12 h-12 rounded-full mr-4"
              />
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">
                  {item.userName}
                </Text>
                <Text className="text-gray-600" numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">10:30 AM</Text>
            </TouchableOpacity>
          </Link>
        )}
        ListHeaderComponent={
          <Text className="p-4 text-xl font-bold text-gray-700">
            Recent Chats
          </Text>
        }
      />
    </SafeAreaView>
  );
}
