// app/(customer)/account/following-sellers.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import {
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";

interface Seller {
  id: string;
  storeName: string;
  ownerName: string;
  profileImage?: string;
  totalFollowers: number;
  totalProducts: number;
  rating?: number;
  description?: string;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function FollowingSellersScreen() {
  const router = useRouter();
  const { user, toggleFollowSeller } = useAuth();
  const { effectiveTheme } = useTheme();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sellerAnimations = useRef<{ [key: string]: Animated.Value }>(
    {}
  ).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    fetchFollowingSellers();
  }, [user?.FollowingSellersIds]);

  const fetchFollowingSellers = async (isRefreshing = false) => {
    if (
      !user ||
      !user.FollowingSellersIds ||
      user.FollowingSellersIds.length === 0
    ) {
      setSellers([]);
      setLoading(false);
      return;
    }

    if (!isRefreshing) setLoading(true);

    try {
      // Batch query to minimize reads - fetch all following sellers at once
      const sellersRef = collection(db, "sellers");
      const q = query(
        sellersRef,
        where(documentId(), "in", user.FollowingSellersIds)
      );

      const querySnapshot = await getDocs(q);
      const sellersData: Seller[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sellersData.push({
          id: doc.id,
          storeName: data.shopName || "Unknown Store",
          ownerName: data.bio || "Unknown Owner",
          profileImage: data.shopBannerUrl,
          totalFollowers: data.totalFollowers || 0,
          totalProducts: data.totalProducts || 0,
          rating: data.avgRating || 0,
        });
      });

      // Initialize animations for new sellers
      sellersData.forEach((seller) => {
        if (!sellerAnimations[seller.id]) {
          sellerAnimations[seller.id] = new Animated.Value(1);
        }
      });

      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching following sellers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnfollow = async (sellerId: string) => {
    setUnfollowingId(sellerId);

    // Animate seller card out
    Animated.timing(sellerAnimations[sellerId], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      try {
        await toggleFollowSeller(sellerId);
        // Remove from local state to avoid refetch
        setSellers((prev) => prev.filter((s) => s.id !== sellerId));
      } catch (error) {
        console.error("Error unfollowing seller:", error);
        // Reset animation on error
        Animated.timing(sellerAnimations[sellerId], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } finally {
        setUnfollowingId(null);
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowingSellers(true);
  };

  const SellerCard = ({ seller }: { seller: Seller }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <AnimatedTouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(customer)/home/seller/[sellerId]",
            params: { sellerId: seller.id },
          })
        }
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          transform: [
            { scale: sellerAnimations[seller.id] || 1 },
            { scale: scaleAnim },
          ],
          opacity: sellerAnimations[seller.id] || 1,
        }}
        className="mb-3"
      >
        <View
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor:
              effectiveTheme === "dark" ? darkColors.card : lightColors.card,
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          <View className="flex-row">
            {/* Seller Image */}
            <View
              className="w-20 h-20 rounded-xl mr-3 items-center justify-center overflow-hidden"
              style={{
                backgroundColor:
                  effectiveTheme === "dark" ? "#2a2a2a" : "#f0f0f0",
              }}
            >
              {seller.profileImage ? (
                <Image
                  source={{ uri: seller.profileImage }}
                  className="w-full h-full"
                  style={{ resizeMode: "cover" }}
                />
              ) : (
                <MaterialIcons
                  name="store"
                  size={30}
                  color={effectiveTheme === "dark" ? "#666" : "#999"}
                />
              )}
            </View>

            {/* Seller Info */}
            <View className="flex-1">
              <Text
                className="font-semibold text-lg"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
                numberOfLines={1}
              >
                {seller.storeName}
              </Text>
              <Text
                className="text-sm mb-2"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                {seller.ownerName}
              </Text>

              {/* Stats Row */}
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={effectiveTheme === "dark" ? "#666" : "#999"}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    {seller.totalFollowers} followers
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name="cube-outline"
                    size={14}
                    color={effectiveTheme === "dark" ? "#666" : "#999"}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    {seller.totalProducts} products
                  </Text>
                </View>
                {seller.rating && (
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text
                      className="text-xs ml-1"
                      style={{
                        color:
                          effectiveTheme === "dark"
                            ? darkColors.secondaryText
                            : lightColors.secondaryText,
                      }}
                    >
                      {seller.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(customer)/home/seller/[sellerId]",
                  params: { sellerId: seller.id },
                })
              }
              className="flex-1 py-2 rounded-lg"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.accent
                    : lightColors.accent,
              }}
            >
              <Text className="text-white text-center font-medium">
                View Store
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleUnfollow(seller.id)}
              disabled={unfollowingId === seller.id}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor:
                  effectiveTheme === "dark"
                    ? darkColors.border
                    : lightColors.border,
                opacity: unfollowingId === seller.id ? 0.6 : 1,
              }}
            >
              {unfollowingId === seller.id ? (
                <ActivityIndicator
                  size="small"
                  color={
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text
                  }
                />
              ) : (
                <Text
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  Unfollow
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator
          size="large"
          color={
            effectiveTheme === "dark" ? darkColors.accent : lightColors.accent
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[
              effectiveTheme === "dark"
                ? darkColors.accent
                : lightColors.accent,
            ]}
            tintColor={
              effectiveTheme === "dark" ? darkColors.accent : lightColors.accent
            }
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {sellers.length === 0 ? (
            <View className="items-center justify-center py-20">
              <MaterialIcons
                name="store"
                size={80}
                color={effectiveTheme === "dark" ? "#666" : "#999"}
              />
              <Text
                className="text-lg font-medium mt-4 mb-2"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                No sellers followed yet
              </Text>
              <Text
                className="text-sm text-center mb-6 px-8"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Follow your favorite sellers to see their latest products and
                updates
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(customer)/search")}
                className="px-6 py-3 rounded-xl"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent,
                }}
              >
                <Text className="text-white font-medium">Discover Sellers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="py-4">
              <Text
                className="text-sm mb-4"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Following {sellers.length} seller
                {sellers.length !== 1 ? "s" : ""}
              </Text>
              {sellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
