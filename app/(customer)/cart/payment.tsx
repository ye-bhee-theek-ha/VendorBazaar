import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ActivityIndicator, View, StyleSheet, Alert, Text } from "react-native";
import { Stack } from "expo-router";

const PAYSTACK_CALLBACK_URL = "https://safebuyafrica.com/paystack-callback";

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const { url } = params;

  if (!url) {
    // This should ideally not happen if navigation is done correctly
    Alert.alert("Error", "Payment URL was not provided.", [
      { text: "OK", onPress: () => router.back() },
    ]);
    return (
      <View style={styles.center}>
        <Text>Error: Missing Payment URL</Text>
      </View>
    );
  }

  const handleNavigationStateChange = (navState: any) => {
    const { url: navUrl } = navState;

    if (navUrl.includes(PAYSTACK_CALLBACK_URL)) {
      const urlObject = new URL(navUrl);
      const reference = urlObject.searchParams.get("reference");

      if (reference) {
        // For now, we assume success and navigate back.
        // In a real app, you should call another cloud function here to verify
        // the transaction status with this reference before confirming the order.
        Alert.alert(
          "Payment Complete",
          "Your payment process is complete. We will verify your transaction shortly."
        );
        // Use replace to prevent the user from navigating back to the WebView
        router.replace("/(customer)/cart");
      } else {
        // Handle cases where payment might have been cancelled or failed
        Alert.alert(
          "Payment Cancelled",
          "The payment process was not completed."
        );
        router.back();
      }
    }
  };

  return (
    <>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator color="#000" size="large" style={styles.loader} />
        )}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
