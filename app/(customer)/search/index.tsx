// app/(customer)/search.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearch } from "@/src/context/SearchContext";
import { Product } from "@/src/constants/types.product";
import { Link, useRouter } from "expo-router";
import { useDebounce } from "use-debounce";

const SearchResultItem = ({ item }: { item: Product }) => (
  <Link href={`/(customer)/home/${item.pid}`} asChild>
    <TouchableOpacity className="flex-row items-center p-3 border-b border-gray-100">
      <Image
        source={{
          uri: item.imagesUrl[0],
        }}
        className="w-14 h-14 rounded-lg mr-4"
      />
      <View className="flex-1">
        <Text className="text-base font-medium" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-gray-600">${item.price.toFixed(2)}</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color="gray" />
    </TouchableOpacity>
  </Link>
);

const RecentSearchItem = ({
  term,
  onSearch,
  onRemove,
}: {
  term: string;
  onSearch: (t: string) => void;
  onRemove: (t: string) => void;
}) => (
  <View className="flex-row justify-between items-center p-3 border-b border-gray-100">
    <TouchableOpacity
      onPress={() => onSearch(term)}
      className="flex-1 flex-row items-center"
    >
      <Ionicons name="time-outline" size={22} color="gray" className="mr-4" />
      <Text className="text-base">{term}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onRemove(term)} className="p-2">
      <Ionicons name="close" size={22} color="gray" />
    </TouchableOpacity>
  </View>
);

export default function SearchScreen() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    recentSearches,
    loading,
    error,
    clearRecentSearches,
    addSearchTerm,
    removeSearchTerm,
    runSearch,
    clearSearchResults,
  } = useSearch();
  const router = useRouter();

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 0) {
      runSearch(debouncedSearchQuery);
    } else {
      clearSearchResults();
    }
  }, [debouncedSearchQuery]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addSearchTerm(searchQuery);
      runSearch(searchQuery);
    }
  };

  const handleRecentSearchSelect = (term: string) => {
    setSearchQuery(term);
    runSearch(term);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Input */}
      <View className="flex-row items-center p-4 pt-2 gap-x-3">
        <View className="flex-1 flex-row items-center border border-grey-light rounded-lg px-3">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Search for products..."
            className="flex-1 h-14 ml-2 text-base"
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={true}
          />
          <TouchableOpacity onPress={() => setSearchQuery("")} className="p-2">
            {searchQuery.length > 0 && (
              <Ionicons name="close-circle" size={20} color="gray" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : searchQuery.length > 0 && searchResults.length > 0 ? (
        // Display Search Results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.pid}
          renderItem={({ item }) => <SearchResultItem item={item} />}
        />
      ) : searchQuery.length > 0 && searchResults.length === 0 ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-gray-600">
            No results found for "{searchQuery}"
          </Text>
        </View>
      ) : (
        // Display Recent Searches
        <View>
          <View className="flex-row justify-between items-center px-4 py-2">
            <Text className="text-lg font-bold">Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text className="text-blue-500">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <RecentSearchItem
                  term={item}
                  onSearch={handleRecentSearchSelect}
                  onRemove={removeSearchTerm}
                />
              )}
            />
          ) : (
            <View className="p-10 items-center">
              <Text className="text-gray-500">No recent searches</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
