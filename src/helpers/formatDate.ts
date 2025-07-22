// src/utils/formatDate.ts

export const formatTimestamp = (timestamp: any): string => {
  // Return an empty string if the timestamp is invalid
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "";
  }

  const itemDate = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if the date is today
  const isToday =
    itemDate.getFullYear() === today.getFullYear() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getDate() === today.getDate();

  // Check if the date was yesterday
  const isYesterday =
    itemDate.getFullYear() === yesterday.getFullYear() &&
    itemDate.getMonth() === yesterday.getMonth() &&
    itemDate.getDate() === yesterday.getDate();

  if (isToday) {
    // If today, show the time
    return itemDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (isYesterday) {
    // If yesterday, show "Yesterday"
    return "Yesterday";
  } else {
    // Otherwise, show the full date
    return itemDate.toLocaleDateString();
  }
};

export const convertTimestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp;

  // If it's a Firestore Timestamp
  if (timestamp?.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  // If it's a seconds/nanoseconds object
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  return null;
};
