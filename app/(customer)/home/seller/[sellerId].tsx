// app/(customer)/home/seller/[sellerId].tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
  Link,
  router,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Product, Review } from "@/src/constants/types.product";
import { Seller } from "@/src/constants/types.seller";
import { useAuth } from "@/src/context/AuthContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { supabase } from "@/src/lib/supabase";
import { mapSupabaseToProduct } from "@/src/helpers/helper.customer";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

type ListItem =
  | (Product & { type: "product" })
  | (Review & { type: "review" })
  | { id: "about"; type: "about"; bio?: string }
  | { pid: string; isPlaceholder: true };

// --- Constants ---
const TABS = ["Products", "Reviews", "About"];
const PRODUCTS_PER_PAGE = 8;
const REVIEWS_PER_PAGE = 10;
const screenWidth = Dimensions.get("window").width;

// --- Reusable Card Components ---

const ProductCard = ({
  product,
  effectiveTheme,
}: {
  product: Product;
  effectiveTheme: "light" | "dark";
}) => {
  const { likedProductIds, toggleLikeProduct } = useAuth();
  const isLiked = likedProductIds.includes(product.pid);
  return (
    <View
      className="flex-1 m-1.5 my-3 shadow-lg shadow-grey-200 rounded-lg"
      style={{
        backgroundColor:
          effectiveTheme === "dark" ? darkColors.card : lightColors.card,
        borderColor:
          effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      }}
    >
      <Link href={`/(customer)/home/${product.pid}`} asChild>
        <TouchableOpacity activeOpacity={0.8}>
          <View className="relative">
            <Image
              source={{
                uri: product.imagesUrl[0],
              }}
              className="w-full aspect-square rounded-lg "
            />
            <TouchableOpacity
              onPress={() => toggleLikeProduct(product.pid)}
              className="absolute top-2 right-2 p-1.5 rounded-full z-10 shadow"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.card
                    : lightColors.card,
              }}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#ef4444" : "black"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Link>
      <View
        className="p-2 rounded-b-lg"
        style={{
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.card : lightColors.card,
        }}
      >
        <Text
          className="text-medium font-MuseoModerno_Regular "
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text
          className="text-base font-MuseoModerno_SemiBold mt-1"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          ${product.price?.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const ReviewCard = ({
  review,
  effectiveTheme,
}: {
  review: Review;
  effectiveTheme: string;
}) => (
  <View
    className="bg-white p-4 rounded-2xl mb-4 shadow-sm border mx-5"
    style={{
      borderColor:
        effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      backgroundColor:
        effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      elevation: 3,
      shadowColor: effectiveTheme === "dark" ? "#ffffff30" : "#00000030",
    }}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Text
        className="text-base font-semibold"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {review.userName}
      </Text>
      <View className="flex-row items-center px-2.5 py-1 rounded-full">
        <Text
          className="text-base font-bold mr-2"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {review.rating}
        </Text>
        <Ionicons name="star" size={16} color="#FFC700" />
      </View>
    </View>
    <Text
      className="text-sm leading-6"
      style={{
        color:
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText,
      }}
    >
      {review.text}
    </Text>
    <Text className="text-xs text-gray-400 mt-3 text-right">
      {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
    </Text>
  </View>
);

const AboutTab = ({
  bio,
  effectiveTheme,
}: {
  bio?: string;
  effectiveTheme: "light" | "dark";
}) => (
  <View className="p-4 mx-2">
    <Text
      className="text-lg font-MuseoModerno_SemiBold mb-2"
      style={{
        color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
      }}
    >
      About the Shop
    </Text>
    <Text
      className="text-base leading-7 "
      style={{
        color:
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText,
      }}
    >
      {bio || "This seller has not provided any information yet."}
    </Text>
  </View>
);

// --- Main Screen ---
export default function SellerProfileScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const { user, toggleFollowSeller } = useAuth();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState("Products");

  const listData = useMemo(() => {
    if (activeTab === "About")
      return seller
        ? ([{ id: "about", type: "about", bio: seller.bio }] as ListItem[])
        : [];
    const items = activeTab === "Products" ? products : reviews;
    const typedItems = items.map(
      (item) =>
        ({
          ...item,
          type: activeTab === "Products" ? "product" : "review",
        } as ListItem)
    );

    if (activeTab === "Products" && typedItems.length % 2 !== 0) {
      typedItems.push({
        pid: "placeholder",
        isPlaceholder: true,
        type: "product",
      } as any);
    }
    return typedItems;
  }, [activeTab, products, reviews, seller]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const [lastVisibleReview, setLastVisibleReview] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  // New state to track if a tab's data has been fetched
  const [fetchedTabs, setFetchedTabs] = useState<string[]>(["Products"]);

  const tabIndicatorPos = useSharedValue(20);
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPos.value }],
  }));

  const { effectiveTheme } = useTheme();

  const handleTabPress = (tabName: string, index: number) => {
    if (activeTab === tabName) return;

    setActiveTab(tabName);
    const position = (screenWidth / TABS.length) * index;
    tabIndicatorPos.value = withTiming(position + 20, { duration: 250 });

    // If we haven't fetched data for this tab yet, do it now.
    if (!fetchedTabs.includes(tabName)) {
      if (tabName === "Products") {
        fetchProductsCallback();
      } else if (tabName === "Reviews") {
        fetchReviewsCallback();
      }
      setFetchedTabs((prev) => [...prev, tabName]);
    }
  };

  useEffect(() => {
    if (!sellerId) return;
    const fetchSeller = async () => {
      setLoadingProfile(true);
      try {
        const sellerRef = doc(db, "sellers", sellerId.trim());
        const docSnap = await getDoc(sellerRef);
        if (docSnap.exists()) {
          setSeller({ sid: docSnap.id, ...docSnap.data() } as Seller);
          // Fetch initial products after seller profile is loaded
          fetchProductsCallback();
        }
      } catch (error) {
        console.error("Error fetching seller:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchSeller();
  }, [sellerId]);

  const fetchProductsCallback = useCallback(
    async (loadMore = false) => {
      if (!sellerId || (loadMore && (loadingMore || !hasMoreProducts))) return;

      const pageToFetch = loadMore ? productsPage + 1 : 0;
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoadingContent(true);
        setHasMoreProducts(true); // Reset on initial fetch
      }

      try {
        const from = pageToFetch * PRODUCTS_PER_PAGE;
        const to = from + PRODUCTS_PER_PAGE - 1;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("seller_id", sellerId.trim()) // Adjust column name if needed
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const newProducts = data.map(mapSupabaseToProduct);

        if (newProducts.length < PRODUCTS_PER_PAGE) {
          setHasMoreProducts(false);
        }

        if (loadMore) {
          setProducts((prev) => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        setProductsPage(pageToFetch);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingContent(false);
        setLoadingMore(false);
      }
    },
    [sellerId, loadingMore, hasMoreProducts, productsPage]
  );

  const fetchReviewsCallback = useCallback(
    async (loadMore = false) => {
      if (!sellerId || (loadMore && (loadingMore || !hasMoreReviews))) return;

      if (loadMore) setLoadingMore(true);
      else {
        setLoadingContent(true);
        setHasMoreReviews(true);
      }

      try {
        const reviewsRef = collection(db, "reviews");
        const qConstraints = [
          where("sellerId", "==", sellerId.trim()),
          orderBy("createdAt", "desc"),
          limit(REVIEWS_PER_PAGE),
        ];

        const q =
          loadMore && lastVisibleReview
            ? query(reviewsRef, ...qConstraints, startAfter(lastVisibleReview))
            : query(reviewsRef, ...qConstraints);

        const docSnap = await getDocs(q);
        const newReviews = docSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Review[];

        if (docSnap.docs.length < REVIEWS_PER_PAGE) setHasMoreReviews(false);
        setLastVisibleReview(docSnap.docs[docSnap.docs.length - 1]);

        if (loadMore) setReviews((prev) => [...prev, ...newReviews]);
        else setReviews(newReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingContent(false);
        setLoadingMore(false);
      }
    },
    [sellerId, loadingMore, hasMoreReviews, lastVisibleReview]
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (activeTab === "Products") await fetchProductsCallback();
    else if (activeTab === "Reviews") await fetchReviewsCallback();
    setIsRefreshing(false);
  }, [activeTab]);

  const renderHeader = () => (
    <View className="">
      <View className="w-full items-center mt-4">
        <Image
          source={{ uri: seller?.shopBannerUrl }}
          className="w-[95%] h-40 rounded-lg"
        />
      </View>

      <View
        className="justify-between items-center m-4 rounded-2xl py-4"
        style={{
          borderColor:
            effectiveTheme === "dark" ? darkColors.border : lightColors.border,
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.card : lightColors.card,
          elevation: 5,
          shadowColor: effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
        }}
      >
        <Text
          className="text-2xl font-MuseoModerno_SemiBold mt-2"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {seller?.shopName}
        </Text>
        <View className="flex-row items-stretch space-x-6 mt-4">
          <View className="items-center">
            <Text
              className="font-MuseoModerno_SemiBold font-medium"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              {seller?.totalFollowers || 0}
            </Text>
            <Text
              className="text-gray-500 text-sm"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              Followers
            </Text>
          </View>
          <View className="items-center mx-6">
            <Text
              className="font-bold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              {seller?.avgRating?.toFixed(1) || "0.0"}
            </Text>
            <Text
              className="text-gray-500 text-sm"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              Rating
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="font-bold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              {seller?.totalReviews || 0}
            </Text>
            <Text
              className="text-gray-500 text-sm"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              Reviews
            </Text>
          </View>
        </View>
        <View className="flex-row space-x-3 gap-x-6 mt-4 w-full px-4">
          <TouchableOpacity
            className="flex-1 p-3 rounded-lg"
            style={{
              backgroundColor:
                effectiveTheme === "dark"
                  ? darkColors.text
                  : lightColors.accent,
            }}
            onPress={() => toggleFollowSeller(sellerId.trim())}
          >
            <Text
              className="text-white text-center font-bold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.background
                    : lightColors.background,
              }}
            >
              {user?.FollowingSellersIds.includes(sellerId)
                ? "Unfollow"
                : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border border-gray-300 p-3 rounded-lg"
            style={{
              backgroundColor:
                effectiveTheme === "dark"
                  ? darkColors.text + "20"
                  : lightColors.card,
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
            onPress={() => {
              router.push({
                pathname: "/(messages)/chat",
                params: {
                  recipientId: seller?.sid,
                  recipientName: seller?.shopName,
                },
              });
            }}
          >
            <Text
              className=" text-center font-bold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View className="bg-white/10">
      <View className="flex-row">
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(tab, index)}
            className="flex-1 items-center p-3"
          >
            <Text
              className={`font-bold text-base`}
              style={{
                color:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text
                    : effectiveTheme === "dark"
                    ? darkColors.tertiaryText
                    : lightColors.tertiaryText,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View
        style={[{ width: screenWidth / TABS.length - 40 }, tabIndicatorStyle]}
        className="h-1 rounded-full bg-grey/50"
      />
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-10  pt-20">
      <Ionicons
        name={
          activeTab === "Products"
            ? "cube-outline"
            : "chatbubble-ellipses-outline"
        }
        size={40}
        color="gray"
      />
      <Text className="text-center mt-4 text-gray-500">
        No {activeTab.toLowerCase()} to display yet.
      </Text>
    </View>
  );

  const renderContent = () => {
    const showLoading =
      loadingContent &&
      (activeTab === "Products" ? products.length === 0 : reviews.length === 0);

    if (showLoading) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <View className="flex-1 ">
        <FlatList
          data={listData}
          key={activeTab}
          numColumns={activeTab === "Products" ? 2 : 1}
          className="py-2"
          renderItem={({ item }) => {
            if ("isPlaceholder" in item)
              return <View className="flex-1 m-1.5" />;

            switch (item.type) {
              case "product":
                return (
                  <ProductCard
                    product={item as Product}
                    effectiveTheme={effectiveTheme}
                  />
                );
              case "review":
                return (
                  <ReviewCard
                    review={item as Review}
                    effectiveTheme={effectiveTheme}
                  />
                );
              case "about":
                return (
                  <AboutTab
                    bio={(item as any).bio}
                    effectiveTheme={effectiveTheme}
                  />
                );
              default:
                return null;
            }
          }}
          keyExtractor={(item, index) =>
            `${(item as any).id || (item as Product).pid}-${index}`
          }
          onEndReached={() => {
            if (activeTab === "Products") fetchProductsCallback(true);
            else if (activeTab === "Reviews") fetchReviewsCallback(true);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator className="my-4" /> : null
          }
          ListEmptyComponent={
            loadingContent ? (
              <ActivityIndicator className="my-10" />
            ) : (
              renderEmptyState()
            )
          }
          contentContainerStyle={
            activeTab === "Products" ? { paddingHorizontal: 6 } : {}
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    );
  };

  if (loadingProfile) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 ">
      <Stack.Screen
        options={{
          title: seller?.shopName || "Seller Profile",
          headerTitleAlign: "center",
        }}
      />
      {renderHeader()}
      {renderTabs()}
      <View className="flex-1">{renderContent()}</View>
    </SafeAreaView>
  );
}
