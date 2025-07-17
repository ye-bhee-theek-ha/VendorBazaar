// app/(customer)/cart/index.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useCart } from "@/src/context/CartContext";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  CartItem,
  ProductOption,
  ProductOptionValue,
} from "@/src/constants/types.product";
import { ErrorState, ProductCardSkeleton } from "@/src/helpers/skeletons";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

const CartListItem = ({
  item,
  effectiveTheme,
}: {
  item: CartItem;
  effectiveTheme: string;
}) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <View
      className="flex-row items-center p-3 rounded-lg border mb-3 mx-4 shadow-md"
      style={{
        backgroundColor:
          effectiveTheme === "dark" ? darkColors.input : lightColors.card,
        borderColor:
          effectiveTheme === "dark" ? darkColors.border : lightColors.border,
        shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
      }}
    >
      <Image
        source={{ uri: item.imagesUrl?.[0] || "https://placehold.co/100x100" }}
        className="w-20 h-20 rounded-md mr-4"
      />
      <View className="flex-1">
        <Text
          className="text-text font-MuseoModerno_SemiBold"
          numberOfLines={1}
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {item.name}
        </Text>
        {item.selectedOptions && (
          <Text
            className="text-small font-MuseoModerno_Regular mb-1"
            style={{
              color:
                effectiveTheme === "dark"
                  ? darkColors.tertiaryText
                  : lightColors.tertiaryText,
            }}
          >
            {Object.values(item.selectedOptions || {})
              .map((option) => option.name)
              .join(", ") || "No options selected"}
          </Text>
        )}
        <Text
          className="text-text font-MuseoModerno_SemiBold"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          ${item.price.toFixed(2)}
        </Text>
      </View>
      <View className="items-center">
        <TouchableOpacity
          onPress={() => removeFromCart(item.pid)}
          className="self-end mb-2"
        >
          <Ionicons name="trash-bin-outline" size={20} color="red" />
        </TouchableOpacity>
        <View className="flex-row items-center bg-gray-100 rounded-full">
          <TouchableOpacity
            onPress={() => updateQuantity(item.pid, item.quantity - 1)}
            className="p-2"
          >
            <Ionicons name="remove" size={18} />
          </TouchableOpacity>
          <Text className="px-3 text-base font-semibold">{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.pid, item.quantity + 1)}
            className="p-2"
          >
            <Ionicons name="add" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const { cartItems, loading, error, cartSubtotal, initiatePayment, isPaying } =
    useCart();
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  const SHIPPING_FEE = 80.0;
  const VAT_RATE = 0.0;
  const total = cartSubtotal * (1 + VAT_RATE) + SHIPPING_FEE;

  return (
    <SafeAreaView className="flex-1 ">
      {loading ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={Array(6).fill(0)} // Render 6 skeleton items
            numColumns={2}
            keyExtractor={(_, index) => `skeleton-${index}`}
            renderItem={() => (
              <ProductCardSkeleton effectiveTheme={effectiveTheme} />
            )}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        </View>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {}}
          effectiveTheme={effectiveTheme}
        />
      ) : cartItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="cart-outline" size={60} color="gray" />
          <Text
            className="text-heading font-MuseoModerno_SemiBold mt-4"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            Your Cart is Empty
          </Text>
          <Text className="text-gray-500 mt-2">
            Looks like you haven't added anything yet.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={cartItems}
            renderItem={({ item }) => (
              <CartListItem item={item} effectiveTheme={effectiveTheme} />
            )}
            keyExtractor={(item) => item.pid}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 250 }}
          />
          {/* Summary Section */}
          <View
            className="absolute bottom-0 left-0 right-0 border-t p-4 pt-5 rounded-t-2xl"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Sub-total
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${cartSubtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                VAT (%)
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${(cartSubtotal * VAT_RATE).toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Shipping fee
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${SHIPPING_FEE.toFixed(2)}
              </Text>
            </View>

            <View
              className="h-px my-2"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.text + "50"
                    : lightColors.text + "50",
              }}
            />

            <View className="flex-row justify-between mt-2 mb-5">
              <Text
                className=" text-large font-Fredoka_SemiBold"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Total
              </Text>
              <Text
                className="text-large font-Fredoka_SemiBold"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                ${total.toFixed(2)}
              </Text>
            </View>

            {/* --- Updated Checkout Button --- */}
            <TouchableOpacity
              className=" rounded-full p-4 flex-row justify-center items-center"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.accent,
                opacity: isPaying ? 0.7 : 1, // Dim button when loading
              }}
              onPress={() => router.push("/(customer)/cart/checkout")}
              disabled={isPaying} // Disable button when processing
            >
              {isPaying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text
                    className="text-lg font-semibold"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.background
                          : lightColors.background,
                    }}
                  >
                    Go To Checkout
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    style={{
                      marginLeft: 8,
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.background
                          : lightColors.background,
                    }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
