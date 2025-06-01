// app/(tabs)/home/messaging/[chatId].tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: Date;
}

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello! Welcome to chat ${chatId}.`,
      sender: "other",
      timestamp: new Date(Date.now() - 60000 * 5),
    },
    {
      id: "2",
      text: "Hi there! How can I help you today?",
      sender: "user",
      timestamp: new Date(Date.now() - 60000 * 3),
    },
    {
      id: "3",
      text: "I have a question about product XYZ.",
      sender: "other",
      timestamp: new Date(Date.now() - 60000 * 1),
    },
  ]);
  const [inputText, setInputText] = useState("");

  // In a real app, fetch chat details and messages for `chatId`
  const chatPartnerName = `User ${chatId?.substring(0, 5)}`;

  const handleSend = () => {
    if (inputText.trim().length > 0) {
      const newMessage: Message = {
        id: Math.random().toString(),
        text: inputText.trim(),
        sender: "user", // Assuming the current user is sending
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText("");
      // Here you would also send the message to your backend/Firebase
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <View
      className={`my-2 p-3 rounded-xl max-w-[75%] ${
        item.sender === "user"
          ? "bg-blue-500 self-end mr-3"
          : "bg-gray-200 self-start ml-3"
      }`}
    >
      <Text className={item.sender === "user" ? "text-white" : "text-gray-800"}>
        {item.text}
      </Text>
      <Text
        className={`text-xs mt-1 ${
          item.sender === "user"
            ? "text-blue-200 self-end"
            : "text-gray-500 self-start"
        }`}
      >
        {item.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header is managed by (tabs)/_layout.tsx. It should show "Chat" or partner name */}
      {/* Tab bar is hidden by (tabs)/_layout.tsx for this screen */}
      {/* <Stack.Screen options={{ title: chatPartnerName }} /> */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust as needed
      >
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          className="flex-1 p-2"
          inverted // To show latest messages at the bottom
          contentContainerStyle={{ flexDirection: "column-reverse" }} // For inverted FlatList
        />
        <View className="flex-row items-center p-3 border-t border-gray-200 bg-white">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            className="flex-1 h-10 border border-gray-300 rounded-full px-4 mr-2 bg-gray-100"
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            className="p-2 bg-blue-500 rounded-full"
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
