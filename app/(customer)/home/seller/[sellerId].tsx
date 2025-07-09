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

const ProductCard = ({ product }: { product: Product }) => {
  const { likedProductIds, toggleLikeProduct } = useAuth();
  const isLiked = likedProductIds.includes(product.pid);
  return (
    <View className="flex-1 m-1.5 shadow-lg shadow-grey-200 rounded-lg bg-white">
      <Link href={`/(customer)/home/${product.pid}`} asChild>
        <TouchableOpacity activeOpacity={0.8}>
          <View className="relative">
            <Image
              source={{
                uri: product.imagesUrl[0],
              }}
              className="w-full aspect-square rounded-lg bg-gray-200"
            />
            <TouchableOpacity
              onPress={() => toggleLikeProduct(product.pid)}
              className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full z-10 shadow"
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
      <View className="p-2 bg-white rounded-b-lg">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-base font-bold text-black mt-1">
          ${product.price?.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const ReviewCard = ({ review }: { review: Review }) => (
  <View className="p-4 border-b-2 border-grey/50 mx-6">
    <View className="flex-row items-center mb-1">
      <View className="flex-row">
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name="star"
            size={16}
            color={i < review.rating ? "#FFC107" : "#E0E0E0"}
          />
        ))}
      </View>
      <Text className="ml-auto text-xs text-gray-500">
        {review.createdAt?.toDate().toLocaleDateString()}
      </Text>
    </View>
    <Text className="text-gray-800 leading-6 mt-1">{review.text}</Text>
    <Text className="text-sm font-semibold text-gray-600 mt-2 self-end">
      - {review.userName}
    </Text>
  </View>
);

const AboutTab = ({ bio }: { bio?: string }) => (
  <View className="p-4 mx-2">
    <Text className="text-lg font-bold mb-2">About the Shop</Text>
    <Text className="text-base leading-7 text-gray-700">
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
    <View className="bg-white">
      <View className="w-full items-center">
        <Image
          source={{ uri: seller?.shopBannerUrl }}
          className="w-[95%] h-40 rounded-lg"
        />
      </View>

      <View className="p-4 items-center my-2">
        <Text className="text-2xl font-bold mt-2">{seller?.shopName}</Text>
        <View className="flex-row items-stretch space-x-6 mt-2">
          <View className="items-center">
            <Text className="font-bold">{seller?.totalFollowers || 0}</Text>
            <Text className="text-gray-500 text-sm">Followers</Text>
          </View>
          <View className="items-center mx-6">
            <Text className="font-bold">
              {seller?.avgRating?.toFixed(1) || "0.0"}
            </Text>
            <Text className="text-gray-500 text-sm">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="font-bold">{seller?.totalReviews || 0}</Text>
            <Text className="text-gray-500 text-sm">Reviews</Text>
          </View>
        </View>
        <View className="flex-row space-x-3 gap-x-6 mt-4 w-full px-4">
          <TouchableOpacity
            className="flex-1 bg-black p-3 rounded-lg"
            onPress={() => toggleFollowSeller(sellerId.trim())}
          >
            <Text className="text-white text-center font-bold">
              {user?.FollowingSellersIds.includes(sellerId)
                ? "Unfollow"
                : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border border-gray-300 p-3 rounded-lg"
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
            <Text className="text-black text-center font-bold">Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View className="bg-white">
      <View className="flex-row">
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(tab, index)}
            className="flex-1 items-center p-3"
          >
            <Text
              className={`font-bold text-base ${
                activeTab === tab ? "text-black" : "text-gray-400"
              }`}
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
    <View className="flex-1 items-center justify-center p-10 bg-gray-50 pt-20">
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
          renderItem={({ item }) => {
            if ("isPlaceholder" in item)
              return <View className="flex-1 m-1.5" />;

            switch (item.type) {
              case "product":
                return <ProductCard product={item as Product} />;
              case "review":
                return <ReviewCard review={item as Review} />;
              case "about":
                return <AboutTab bio={(item as any).bio} />;
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
    // switch (activeTab) {
    //   case "Products":
    //     return products.length > 0 ? (
    //       <FlatList
    //         data={productsdataForList}
    //         renderItem={({ item }) => {
    //           if ("isPlaceholder" in item) {
    //             return <View className="flex-1 m-1.5" />;
    //           }
    //           return <ProductCard product={item} />;
    //         }}
    //         keyExtractor={(item) => (item as Product).pid}
    //         numColumns={2}
    //         onEndReached={() => fetchProductsCallback(true)}
    //         onEndReachedThreshold={0.5}
    //         ListFooterComponent={
    //           loadingMore ? <ActivityIndicator className="my-4" /> : null
    //         }
    //         contentContainerStyle={{ paddingHorizontal: 6 }}
    //       />
    //     ) : (
    //       <EmptyState />
    //     );
    //   case "Reviews":
    //     return reviews.length > 0 ? (
    //       <FlatList
    //         data={reviews}
    //         renderItem={({ item }) => <ReviewCard review={item as Review} />}
    //         keyExtractor={(item) => item.id}
    //         onEndReached={() => fetchReviewsCallback(true)}
    //         onEndReachedThreshold={0.5}
    //         ListFooterComponent={
    //           loadingMore ? <ActivityIndicator className="my-4" /> : null
    //         }
    //       />
    //     ) : (
    //       <EmptyState />
    //     );
    //   case "About":
    //     return <AboutTab bio={seller?.bio} />;
    //   default:
    //     return null;
    // }
  };

  // const EmptyState = () => (
  //   <View className="flex-1 items-center justify-center p-10 bg-gray-50 pt-20">
  //     <Ionicons
  //       name={
  //         activeTab === "Products"
  //           ? "cube-outline"
  //           : "chatbubble-ellipses-outline"
  //       }
  //       size={40}
  //       color="gray"
  //     />
  //     <Text className="text-center mt-4 text-gray-500">
  //       No {activeTab.toLowerCase()} to display yet.
  //     </Text>
  //   </View>
  // );

  if (loadingProfile) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
