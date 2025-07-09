// app/src/context/MessagingContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase"; // Your configured Supabase client
import { useAuth } from "./AuthContext"; // Your existing Auth context
import { db } from "../lib/firebase"; // Import your Firestore instance
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Conversation, ParticipantProfile } from "../constants/types.messages";

const CONVERSATIONS_PAGE_SIZE = 15;

interface MessagingContextType {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  hasMore: boolean;
  fetchMoreConversations: () => void;
  findOrCreateConversationByRecipient: (
    recipientId: string
  ) => Promise<Conversation | null>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  getConversationById: (conversationId: string) => Promise<Conversation | null>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchParticipantProfiles = useCallback(
    async (
      convos: Omit<Conversation, "otherParticipant">[]
    ): Promise<Conversation[]> => {
      if (!user || convos.length === 0) return convos as Conversation[];

      const otherParticipantIds = convos
        .map((c) => c.participant_ids.find((pId) => pId !== user.uid))
        .filter((id): id is string => !!id);

      if (otherParticipantIds.length === 0) return convos as Conversation[];

      const uniqueIds = [...new Set(otherParticipantIds)];
      const profilesMap = new Map<string, ParticipantProfile>();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "in", uniqueIds));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        profilesMap.set(data.uid, {
          uid: data.uid,
          fullName: data.fullName,
          photoURL: data.photoURL || "https://picsum.photos/200",
        });
      });

      return convos.map((c) => {
        const otherId = c.participant_ids.find((pId) => pId !== user.uid);
        return {
          ...c,
          otherParticipant: otherId ? profilesMap.get(otherId) : undefined,
        };
      });
    },
    [user]
  );

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`*, conversation_participants (last_read_at)`)
        .contains("participant_ids", [user.uid])
        .eq("conversation_participants.user_id", user.uid)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(0, CONVERSATIONS_PAGE_SIZE - 1);

      if (error) throw error;

      const formattedData = data.map((c: any) => ({
        ...c,
        last_read_at: c.conversation_participants[0]?.last_read_at,
      }));

      const conversationsWithProfiles = await fetchParticipantProfiles(
        formattedData
      );

      setConversations(conversationsWithProfiles);
      setPage(1);
      setHasMore(data.length === CONVERSATIONS_PAGE_SIZE);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user, fetchParticipantProfiles]);

  const fetchMoreConversations = async () => {
    if (loading || !hasMore || !user) return;
    setLoading(true);

    try {
      const from = page * CONVERSATIONS_PAGE_SIZE;
      const to = from + CONVERSATIONS_PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("conversations")
        .select(`*, conversation_participants (last_read_at)`)
        .contains("participant_ids", [user.uid])
        .eq("conversation_participants.user_id", user.uid)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) throw error;

      const formattedData = data.map((c: any) => ({
        ...c,
        last_read_at: c.conversation_participants[0]?.last_read_at,
      }));

      const newConversationsWithProfiles = await fetchParticipantProfiles(
        formattedData
      );

      setConversations((prev) => [...prev, ...newConversationsWithProfiles]);
      setPage((prev) => prev + 1);
      setHasMore(data.length === CONVERSATIONS_PAGE_SIZE);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // IMPROVEMENT: Real-time subscription now intelligently updates state
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("public:conversations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `participant_ids=cs.{${user.uid}}`,
        },
        async (payload) => {
          const updatedConvo = payload.new as Conversation;

          // Fetch profile for the updated conversation to keep data fresh
          const [convoWithProfile] = await fetchParticipantProfiles([
            updatedConvo,
          ]);

          setConversations((prevConvos) => {
            const existingConvoIndex = prevConvos.findIndex(
              (c) => c.id === convoWithProfile.id
            );
            let newConvos = [...prevConvos];
            if (existingConvoIndex !== -1) {
              // Update existing conversation
              newConvos[existingConvoIndex] = convoWithProfile;
            } else {
              // Add as a new conversation
              newConvos.unshift(convoWithProfile);
            }
            // Sort to ensure the most recent is always at the top
            return newConvos.sort(
              (a, b) =>
                new Date(b.last_message_at || 0).getTime() -
                new Date(a.last_message_at || 0).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchParticipantProfiles]);

  const findOrCreateConversationByRecipient = async (
    recipientId: string
  ): Promise<Conversation | null> => {
    if (!user) throw new Error("User not authenticated.");

    // 1. Check if a conversation with these exact two participants already exists.
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("*")
      .contains("participant_ids", [user.uid, recipientId])
      .limit(1);

    if (existingError) throw existingError;

    // Filter in client to ensure it's an exact match of 2 participants
    const exactMatch = existing?.find((c) => c.participant_ids.length === 2);

    if (exactMatch) {
      const [convoWithProfile] = await fetchParticipantProfiles([exactMatch]);
      return convoWithProfile;
    }

    // 2. If not, create a new one.
    try {
      const { data: newConversationData, error: createError } = await supabase
        .rpc("create_conversation_with_participants", {
          p_creator_id: user.uid,
          p_recipient_id: recipientId,
        })
        .single();

      if (createError) throw createError;

      const newConvo = (newConversationData as { j: Conversation }).j;
      const [convoWithProfile] = await fetchParticipantProfiles([newConvo]);

      // Add the new conversation to the top of the local state
      setConversations((prev) => [convoWithProfile, ...prev]);

      return convoWithProfile;
    } catch (e: any) {
      setError(e);
      console.error("Error creating conversation:", e);
      return null;
    }
  };

  const getConversationById = async (
    conversationId: string
  ): Promise<Conversation | null> => {
    const localConvo = conversations.find((c) => c.id === conversationId);
    if (localConvo) return localConvo;

    // If not found locally, fetch from DB
    const { data, error } = await supabase
      .from("conversations")
      .select(`*`)
      .eq("id", conversationId)
      .single();

    if (error || !data) {
      console.error("Error fetching conversation by ID", error);
      return null;
    }

    const [convoWithProfile] = await fetchParticipantProfiles([data]);
    return convoWithProfile;
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!user) throw new Error("User not authenticated.");

    // Optimistic update for instant UI feedback
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              last_message_text: text,
              last_message_at: new Date().toISOString(),
              last_message_sender_id: user.uid,
            }
          : c
      )
    );

    const { error } = await supabase.rpc(
      "send_message_and_update_conversation",
      {
        p_conversation_id: conversationId,
        p_sender_id: user.uid,
        p_content: text,
      }
    );

    if (error) {
      console.error("Error sending message:", error);
      setError(error);
      // NOTE: In a real app, you might want to revert the optimistic update here
      throw error;
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, last_read_at: new Date().toISOString() }
            : c
        )
      );
      await supabase.rpc("mark_conversation_as_read", {
        p_conversation_id: conversationId,
        p_user_id: user.uid,
      });
    } catch (e: any) {
      console.error("Error marking as read:", e);
      setError(e);
    }
  };

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return conversations.filter((c) => {
      return (
        c.last_message_at &&
        c.last_message_sender_id !== user.uid &&
        (!c.last_read_at ||
          new Date(c.last_message_at) > new Date(c.last_read_at))
      );
    }).length;
  }, [conversations, user]);

  const value = useMemo(
    () => ({
      conversations,
      loading,
      error,
      unreadCount,
      findOrCreateConversationByRecipient,
      sendMessage,
      markConversationAsRead,
      hasMore,
      fetchMoreConversations,
      getConversationById,
    }),
    [
      conversations,
      loading,
      error,
      unreadCount,
      hasMore,
      findOrCreateConversationByRecipient,
      sendMessage,
      markConversationAsRead,
      getConversationById,
      fetchMoreConversations,
    ]
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
};
