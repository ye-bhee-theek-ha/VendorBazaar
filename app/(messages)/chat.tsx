import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { useMessaging } from "@/src/context/MessagingContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "@/src/helpers/KeyboardAvoidingView";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const ChatScreen = () => {
  const {
    conversationId: initialConversationId,
    recipientId,
    recipientName,
  } = useLocalSearchParams<{
    conversationId?: string;
    recipientId?: string;
    recipientName?: string;
  }>();

  const { user } = useAuth();
  const {
    sendMessage,
    markConversationAsRead,
    findOrCreateConversationByRecipient,
    getConversationById,
  } = useMessaging();
  const navigation = useNavigation();

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const loadChat = async () => {
      if (!user || (!initialConversationId && !recipientId)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let convoIdToUse: string | undefined = initialConversationId;
        let convoRecipientName = recipientName;

        if (!convoIdToUse && recipientId) {
          const conversation = await findOrCreateConversationByRecipient(
            recipientId
          );
          if (conversation) {
            convoIdToUse = conversation.id;
            convoRecipientName =
              conversation.otherParticipant?.fullName || "User";
          }
        } else if (convoIdToUse && !convoRecipientName) {
          const conversation = await getConversationById(convoIdToUse);
          if (conversation) {
            convoRecipientName =
              conversation.otherParticipant?.fullName || "User";
          }
        }

        if (convoIdToUse) {
          setConversationId(convoIdToUse);
          navigation.setOptions({ title: convoRecipientName || "Chat" });

          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", convoIdToUse)
            .order("created_at", { ascending: true });

          if (error) throw error;
          if (data) setMessages(data as Message[]);

          markConversationAsRead(convoIdToUse);
        } else {
          throw new Error("Failed to initialize conversation.");
        }
      } catch (error) {
        console.error("A critical error occurred during chat load:", error);
        Alert.alert("Error", "Could not load the chat. Please try again.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [initialConversationId, recipientId, user]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((currentMessages) => [
            ...currentMessages,
            payload.new as Message,
          ]);
          markConversationAsRead(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const contentToSend = text.trim();
    if (contentToSend.length === 0 || !conversationId) return;

    setText("");
    try {
      await sendMessage(conversationId, contentToSend);
      //   setMessages((prevMessages) => [
      //     ...prevMessages,
      //     {
      //       id: "" + Date.now(), // Temporary ID, will be replaced by Supabase
      //       conversation_id: conversationId,
      //       sender_id: user?.uid || "",
      //       content: contentToSend,
      //       created_at: new Date().toISOString(),
      //     },
      //   ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Message could not be sent. Please try again.");
      setText(contentToSend);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.uid;
    return (
      <View
        className={`px-4 py-2 my-1 mx-4 rounded-2xl max-w-[80%] ${
          isMyMessage
            ? "bg-primary self-end rounded-br-none"
            : "bg-gray-200 self-start rounded-bl-none"
        }`}
      >
        <Text className={isMyMessage ? "text-white" : "text-black"}>
          {item.content}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" className="flex-1 justify-center" />;
  }

  return (
    <SafeAreaView className="bg-white flex-1 pb-[10px]">
      <KeyboardAvoidingView>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="pt-4 flex-grow"
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-gray-500 text-center">
                No messages yet. Start the conversation!
              </Text>
            </View>
          )}
        />
        <View className="flex-row items-center p-3 bg-white border-t border-gray-200">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            className="flex-1 bg-gray-100 rounded-3xl py-3 px-5 mr-3 text-base"
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            className="bg-primary rounded-full w-12 h-12 flex items-center justify-center"
          >
            <Ionicons name="arrow-up" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
