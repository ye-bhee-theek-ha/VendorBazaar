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

const ConversationListItem = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const router = useRouter();
  const { user } = useAuth();

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
      className="bg-white rounded-2xl mx-4 my-2 p-4 flex-row items-center shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center mr-4">
        {conversation.otherParticipant?.photoURL ? (
          <Image
            source={{ uri: conversation.otherParticipant.photoURL }}
            className="w-full h-full rounded-full"
          />
        ) : (
          <Ionicons name="person" size={30} color="gray" />
        )}
      </View>
      <View className="flex-1">
        <Text
          className={`text-lg ${
            isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"
          }`}
        >
          {conversation.otherParticipant?.fullName || "Unknown User"}
        </Text>
        <Text
          className={`mt-1 ${
            isUnread ? "text-black font-medium" : "text-gray-500"
          }`}
          numberOfLines={1}
        >
          {conversation.last_message_text || "No messages yet"}
        </Text>
      </View>
      {isUnread && (
        <View className="w-3 h-3 bg-blue-500 rounded-full ml-4 self-center" />
      )}
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View className="flex-1 justify-center items-center p-8 bg-gray-50">
    <View className="w-full mb-14">
      <Image
        source={require("@/assets/images/empty-conversations.png")}
        className="self-center h-[250px] w-[350px]"
      />
    </View>
    <Text className="text-xl font-bold text-gray-800 mt-6">
      No Messages Yet
    </Text>
    <Text className="text-gray-500 text-center mt-2 mb-8">
      It looks like your inbox is empty. Start a conversation with a seller to
      see it here.
    </Text>
    <Link href="/(customer)/home" asChild>
      <TouchableOpacity className="bg-primary py-3 px-8 rounded-full">
        <Text className="text-white font-bold text-base">Start Shopping</Text>
      </TouchableOpacity>
    </Link>
  </View>
);

const ConversationsScreen = () => {
  const { conversations, loading, hasMore, fetchMoreConversations, error } =
    useMessaging();

  if (loading && conversations.length === 0) {
    return <ActivityIndicator size="large" className="flex-1 bg-gray-50" />;
  }

  if (!loading && conversations.length === 0) {
    return <EmptyState />;
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
      renderItem={({ item }) => <ConversationListItem conversation={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={fetchMoreConversations}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() =>
        loading && conversations.length > 0 ? (
          <ActivityIndicator className="my-4" />
        ) : null
      }
      className="bg-gray-50 pt-2"
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default ConversationsScreen;
