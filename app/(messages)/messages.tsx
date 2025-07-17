// app/(messages)/messages.tsx

import React from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useMessaging } from "@/src/context/MessagingContext";
import { useAuth } from "@/src/context/AuthContext";
import { Conversation } from "@/src/constants/types.messages";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useTheme } from "@/src/context/ThemeContext";

export const ConversationListItem = ({
  conversation,
  effectiveTheme,
}: {
  conversation: Conversation;
  effectiveTheme: "light" | "dark";
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const isUnread =
    conversation.last_message_at &&
    conversation.last_message_sender_id !== user?.uid &&
    (!conversation.last_read_at ||
      new Date(conversation.last_message_at) >
        new Date(conversation.last_read_at));

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: `/(messages)/chat`,
          params: {
            conversationId: conversation.id,
            recipientName: conversation.otherParticipant?.fullName || "User",
          },
        })
      }
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: effectiveTheme === "dark" ? 0.1 : 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
      className="rounded-2xl mx-4 my-2 p-4 flex-row items-center"
    >
      <View
        style={{ backgroundColor: colors.border }}
        className="w-14 h-14 rounded-full items-center justify-center mr-4"
      >
        {conversation.otherParticipant?.photoURL ? (
          <Image
            source={{ uri: conversation.otherParticipant.photoURL }}
            className="w-full h-full rounded-full"
          />
        ) : (
          <Ionicons name="person" size={30} color={colors.secondaryText} />
        )}
      </View>
      <View className="flex-1">
        <Text
          style={{ color: isUnread ? colors.text : colors.secondaryText }}
          className={`text-lg ${isUnread ? "font-bold" : "font-semibold"}`}
        >
          {conversation.otherParticipant?.fullName || "Unknown User"}
        </Text>
        <Text
          style={{ color: isUnread ? colors.text : colors.tertiaryText }}
          className={`mt-1 ${isUnread ? "font-medium" : ""}`}
          numberOfLines={1}
        >
          {conversation.last_message_text || "No messages yet"}
        </Text>
      </View>
      {isUnread && (
        <View
          style={{ backgroundColor: colors.accent }}
          className="w-3 h-3 rounded-full ml-4 self-center"
        />
      )}
    </TouchableOpacity>
  );
};

export const EmptyState = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View
      style={{ backgroundColor: colors.background }}
      className="flex-1 justify-center items-center p-8"
    >
      <View className="w-full mb-14">
        <Image
          source={require("@/assets/images/empty-conversations.png")}
          className="self-center h-[250px] w-[350px]"
          resizeMode="contain"
        />
      </View>
      <Text style={{ color: colors.text }} className="text-xl font-bold mt-6">
        No Messages Yet
      </Text>
      <Text
        style={{ color: colors.secondaryText }}
        className="text-center mt-2 mb-8"
      >
        It looks like your inbox is empty. Start a conversation to see it here.
      </Text>
      <Link href="/(customer)/home" asChild>
        <TouchableOpacity
          style={{ backgroundColor: colors.accent }}
          className="py-3 px-8 rounded-full"
        >
          <Text className="text-white font-bold text-base">Start Shopping</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const ConversationsScreen = () => {
  const { conversations, loading, hasMore, fetchMoreConversations, error } =
    useMessaging();

  const { effectiveTheme } = useTheme();

  if (loading && conversations.length === 0) {
    return <ActivityIndicator size="large" className="flex-1 bg-gray-50" />;
  }

  if (!loading && conversations.length === 0) {
    return <EmptyState effectiveTheme={effectiveTheme} />;
  }

  return (
    <FlatList
      data={conversations}
      ListHeaderComponent={
        error ? (
          <Text className="text-center mt-10 text-red-500">
            Error: {error.message}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <ConversationListItem
          effectiveTheme={effectiveTheme}
          conversation={item}
        />
      )}
      keyExtractor={(item) => item.id}
      onEndReached={fetchMoreConversations}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() =>
        loading && conversations.length > 0 ? (
          <ActivityIndicator className="my-4" />
        ) : null
      }
      className="pt-2"
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default ConversationsScreen;
