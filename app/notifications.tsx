// app/notifications.tsx
import React from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/src/context/NotificationContext";
import { Timestamp } from "firebase/firestore";
import { Notification } from "@/src/constants/types.user";

const NOTIFICATION_ICONS: {
  [key: string]: React.ComponentProps<typeof Ionicons>["name"];
} = {
  discount: "pricetag-outline",
  wallet: "wallet-outline",
  service: "location-outline",
  card: "card-outline",
  account: "person-circle-outline",
  default: "notifications-outline",
};

// --- Date Formatting Helper ---
const getRelativeDate = (timestamp: Timestamp): string => {
  if (!timestamp) return "Date unknown";

  const notificationDate = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  notificationDate.setHours(0, 0, 0, 0);

  if (today.getTime() === notificationDate.getTime()) {
    return "Today";
  }
  if (yesterday.getTime() === notificationDate.getTime()) {
    return "Yesterday";
  }

  return notificationDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// --- Components ---
const NotificationItem = ({ item }: { item: Notification }) => {
  const iconName = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default;
  const { markAsRead } = useNotifications();
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 ${
        !item.read ? "bg-blue-50" : "bg-white"
      }`}
      onPress={() => {
        markAsRead({ id: item.id });
      }}
    >
      <View className="p-3 bg-gray-100 rounded-full mr-4">
        <Ionicons name={iconName} size={24} color="#4B5563" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500">{item.message}</Text>
      </View>
      {!item.read && (
        <View className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-4" />
      )}
    </TouchableOpacity>
  );
};

// --- Main Screen ---
export default function NotificationsModal() {
  const { notifications, loading, error, loadMoreNotifications, hasMore } =
    useNotifications();

  const sections = React.useMemo(() => {
    if (!notifications) return [];

    const grouped = notifications.reduce((acc, notification) => {
      const dateKey = getRelativeDate(notification.createdAt);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(notification);
      return acc;
    }, {} as Record<string, Notification[]>);

    return Object.keys(grouped).map((date) => ({
      title: date,
      data: grouped[date],
    }));
  }, [notifications]);

  if (loading && notifications.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-gray-50">
        <Ionicons name="cloud-offline-outline" size={40} color="red" />
        <Text className="text-red-500 text-center mt-4">{error}</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-gray-50">
        <View className="p-5 bg-gray-200 rounded-full mb-4">
          <Ionicons name="notifications-off-outline" size={40} color="gray" />
        </View>
        <Text className="text-xl font-bold text-gray-700">
          You haven't gotten any notifications yet!
        </Text>
        <Text className="text-base text-gray-500 mt-2 text-center">
          We'll alert you when something cool happens.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationItem item={item} />}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100">
          {title}
        </Text>
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-gray-200 ml-20" />}
      className="bg-white"
      onEndReached={() => {
        if (hasMore && !loading) {
          loadMoreNotifications();
        }
      }}
      onEndReachedThreshold={0.7}
    />
  );
}
