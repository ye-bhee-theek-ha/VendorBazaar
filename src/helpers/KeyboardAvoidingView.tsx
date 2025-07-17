import clsx from "clsx";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  View,
  type KeyboardEventName,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function KeyboardAvoidingView({
  children,
  className,
  style,
  ...props
}: ViewProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscriptionEventName = Platform.select<KeyboardEventName>({
      android: "keyboardDidShow",
      ios: "keyboardWillShow",
    });

    const hideSubscriptionEventName = Platform.select<KeyboardEventName>({
      android: "keyboardDidHide",
      ios: "keyboardWillHide",
    });

    const showSubscription = Keyboard.addListener(
      showSubscriptionEventName!,
      (e) => {
        setKeyboardHeight(20);
      }
    );
    const hideSubscription = Keyboard.addListener(
      hideSubscriptionEventName!,
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View
      className={clsx("flex-1 ", className)}
      style={[
        {
          paddingBottom:
            // Add bottom inset only when the keyboard is visible to avoid duplicating the safe area
            keyboardHeight,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
