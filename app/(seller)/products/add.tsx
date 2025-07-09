import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardTypeOptions,
  FlatList,
  LayoutChangeEvent,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useSellerProducts } from "@/src/context/seller/SellerProductContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "@/src/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useAuth } from "@/src/context/AuthContext";
import { useDebounce } from "use-debounce";
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Product, ProductOption } from "@/src/constants/types.product";

// --- Reusable UI Components ---

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const FormInput = ({ label, ...props }: FormInputProps) => (
  <View className="mb-4">
    <Text className="text-base font-medium text-gray-600 mb-2">{label}</Text>
    <TextInput
      {...props}
      className={`p-3 border border-gray-300 rounded-lg text-base bg-white ${
        props.multiline ? "h-28" : "h-12"
      }`}
      textAlignVertical={props.multiline ? "top" : "center"}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);

const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
    <Text className="text-lg font-bold text-gray-800 mb-4">{title}</Text>
    {children}
  </View>
);

const ConditionSelector = ({
  value,
  onSelect,
}: {
  value: Product["condition"];
  onSelect: (val: Product["condition"]) => void;
}) => {
  const options: Product["condition"][] = ["new", "used", "refurbished"];
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / options.length : 0;
  const selectedIndex = useSharedValue(options.indexOf(value));

  useEffect(() => {
    selectedIndex.value = withTiming(options.indexOf(value), { duration: 250 });
  }, [value, options, selectedIndex]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectedIndex.value * tabWidth }],
  }));

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View>
      <Text className="text-base font-medium text-gray-600 mb-2">
        Condition
      </Text>
      <View
        className="flex-row bg-gray-100 rounded-lg p-1"
        onLayout={onContainerLayout}
      >
        {containerWidth > 0 && (
          <Animated.View
            className="absolute h-full bg-white rounded-md shadow px-1"
            style={[
              { left: 5, alignSelf: "center", height: "100%" },
              { width: tabWidth - 10 },
              animatedPillStyle,
            ]}
          />
        )}
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className="flex-1 p-2 rounded-md"
          >
            <Text
              className={`text-center font-semibold ${
                value === option ? "text-primary-dark" : "text-gray-500"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const CategoryInput = ({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (val: string) => void;
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery] = useDebounce(inputValue, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, "categories"),
          orderBy("name_lowercase"),
          startAt(debouncedQuery.toLowerCase()),
          endAt(debouncedQuery.toLowerCase() + "\uf8ff"),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map(
          (doc) => doc.data().name
        );
        setSuggestions(fetchedCategories);
      } catch (error) {
        console.error("Error fetching category suggestions:", error);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View>
      <FormInput
        label="Category"
        value={inputValue}
        onChangeText={(text) => {
          setInputValue(text);
          onSelect(text);
          setShowSuggestions(true);
        }}
        placeholder="e.g., Clothing, Electronics"
      />
      {showSuggestions && debouncedQuery.length >= 3 && (
        <View className="bg-white border border-gray-200 rounded-lg -mt-4 mb-4 shadow-lg">
          {loading && <ActivityIndicator className="p-2" />}
          {!loading && suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(item)}
                  className="p-3 border-b border-gray-100"
                >
                  <Text className="text-base">{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

// --- Main Screen ---
export default function AddOrEditProductScreen() {
  const router = useRouter();
  const {
    addProduct,
    updateProduct,
    products: contextProducts,
  } = useSellerProducts();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ pid?: string }>();
  const isEditing = !!params.pid;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<Product["condition"]>("new");
  const [images, setImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditing && contextProducts.length > 0) {
      const productToEdit = contextProducts.find((p) => p.pid === params.pid);
      console.log("Editing product:", productToEdit?.options);
      if (productToEdit) {
        setName(productToEdit.name);
        setDescription(productToEdit.description || "");
        setPrice(productToEdit.price.toString());
        setStockQuantity(productToEdit.stockQuantity?.toString() || "1");
        setCategory(productToEdit.category);
        setCondition(productToEdit.condition);
        setImages(productToEdit.imagesUrl);
        setOriginalImages(productToEdit.imagesUrl);
        setOptions(productToEdit.options || []);
      }
    }
  }, [params.pid, contextProducts, isEditing]);

  const ProductOptionsManager = useCallback(
    ({
      options,
      onOptionsChange,
    }: {
      options: ProductOption[];
      onOptionsChange: (options: ProductOption[]) => void;
    }) => {
      const handleAddOption = () => {
        const newOption: ProductOption = { name: "", values: [{ name: "" }] };
        onOptionsChange([...options, newOption]);
      };

      const handleRemoveOption = (optionIndex: number) => {
        onOptionsChange(options.filter((_, index) => index !== optionIndex));
      };

      const handleOptionNameChange = (text: string, optionIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].name = text;
        onOptionsChange(newOptions);
      };

      const handleAddValue = (optionIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values.push({ name: "" });
        onOptionsChange(newOptions);
      };

      const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values = newOptions[optionIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        onOptionsChange(newOptions);
      };

      const handleValueChange = (
        text: string,
        optionIndex: number,
        valueIndex: number,
        field: "name" | "priceModifier"
      ) => {
        const newOptions = [...options];
        const value = newOptions[optionIndex].values[valueIndex];
        if (field === "name") {
          value.name = text;
        } else {
          const parsedModifier = parseFloat(text);
          value.priceModifier = isNaN(parsedModifier)
            ? undefined
            : parsedModifier;
        }
        onOptionsChange(newOptions);
      };

      return (
        <View>
          {options.map((option, optionIndex) => (
            <View
              key={optionIndex}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4"
            >
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-1">
                  <TextInput
                    placeholder="Option Name (e.g., Size)"
                    value={option.name}
                    onChangeText={(text) =>
                      handleOptionNameChange(text, optionIndex)
                    }
                    className="p-2 border border-gray-300 rounded-md text-base bg-white h-11"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveOption(optionIndex)}
                  className="ml-2 p-2"
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View className="pl-2 border-l-2 border-gray-200">
                {option.values.map((value, valueIndex) => (
                  <View key={valueIndex} className="flex-row items-center my-1">
                    <View className="flex-1">
                      <TextInput
                        placeholder="Value (e.g., Small)"
                        value={value.name}
                        onChangeText={(text) =>
                          handleValueChange(
                            text,
                            optionIndex,
                            valueIndex,
                            "name"
                          )
                        }
                        className="p-2 border border-gray-300 rounded-md text-base bg-white h-11"
                      />
                    </View>
                    <View className="w-28 mx-2">
                      <TextInput
                        placeholder="+/- Price"
                        value={value.priceModifier?.toString() || ""}
                        onChangeText={(text) =>
                          handleValueChange(
                            text,
                            optionIndex,
                            valueIndex,
                            "priceModifier"
                          )
                        }
                        className="p-2 border border-gray-300 rounded-md text-base bg-white h-11 text-center"
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveValue(optionIndex, valueIndex)}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => handleAddValue(optionIndex)}
                  className="flex-row items-center mt-2 p-2 bg-gray-200 rounded-md"
                >
                  <Ionicons name="add" size={20} color="#4B5563" />
                  <Text className="ml-2 text-gray-700 font-semibold">
                    Add Value
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={handleAddOption}
            className="flex-row items-center justify-center p-3 mt-2 border-2 border-dashed border-primary-light rounded-lg"
          >
            <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
            <Text className="text-primary-dark font-bold text-base ml-2">
              Add a Product Option
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [options]
  );

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload a maximum of 5 images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(
      storage,
      `products/${user?.uid}/${Date.now()}-${Math.random()}`
    );
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) =>
          setUploadProgress(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ),
        (error) => reject(error),
        () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
      );
    });
  };

  const deleteImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.startsWith("https://")) return;
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code !== "storage/object-not-found") {
        console.error("Error deleting old image:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !stockQuantity || !category || images.length === 0) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields and add at least one image."
      );
      return;
    }
    const invalidOption = options.some(
      (opt) => !opt.name || opt.values.some((val) => !val.name)
    );
    if (invalidOption) {
      Alert.alert(
        "Invalid Options",
        "Please fill in all option and value names, or remove the empty ones."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      if (isEditing) {
        const removedImages = originalImages.filter(
          (url) => !images.includes(url)
        );
        await Promise.all(removedImages.map((url) => deleteImage(url)));
      }

      const imageUrlsToSave: string[] = [];
      for (const img of images) {
        if (img.startsWith("file://")) {
          const url = await uploadImage(img);
          imageUrlsToSave.push(url);
        } else {
          imageUrlsToSave.push(img);
        }
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity, 10),
        category,
        imagesUrl: imageUrlsToSave,
        condition,
        options,
      };

      console.log(isEditing ? "Updating product..." : "Adding new product...");

      const success = isEditing
        ? await updateProduct(params.pid!, productData)
        : await addProduct(productData);

      if (success) {
        Alert.alert(
          "Success",
          `Product has been ${isEditing ? "updated" : "listed"}!`
        );
        router.back();
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      Alert.alert("Error", "There was a problem saving your product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{ title: isEditing ? "Edit Product" : "List New Product" }}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <FormSection title="Core Details">
          <FormInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Regular Fit T-Shirt"
          />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product's features, material, etc."
            multiline
          />
        </FormSection>

        <FormSection title="Pricing & Stock">
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <FormInput
                label="Price ($)"
                value={price}
                onChangeText={setPrice}
                placeholder="29.99"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <FormInput
                label="Stock Quantity"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                placeholder="10"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Categorization">
          <CategoryInput value={category} onSelect={setCategory} />
          <View className="mt-4">
            <ConditionSelector value={condition} onSelect={setCondition} />
          </View>
        </FormSection>

        {/* --- [NEW] Options Section --- */}
        <FormSection title="Product Variants / Options">
          <Text className="text-sm text-gray-500 mb-3">
            Add options like size or color. You can adjust the price for each
            variant.
          </Text>
          <ProductOptionsManager
            options={options}
            onOptionsChange={setOptions}
          />
        </FormSection>

        <FormSection title="Images">
          <Text className="text-sm text-gray-500 mb-3">
            Add up to 5 images. The first image will be the main one.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {images.map((uri, index) => (
              <View key={index} className="relative mr-2">
                <Image
                  source={{ uri }}
                  className="w-24 h-24 rounded-lg bg-gray-200"
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                >
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                className="w-24 h-24 rounded-lg bg-gray-200 justify-center items-center border-2 border-dashed border-gray-400"
              >
                <Ionicons name="add" size={32} color="gray" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </FormSection>

        {isSubmitting && (
          <View className="my-2">
            <Text className="text-center text-gray-600">
              {uploadProgress < 100
                ? `Uploading... ${Math.round(uploadProgress)}%`
                : "Saving product..."}
            </Text>
            <View className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <View
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`bg-primary p-4 rounded-lg flex-row justify-center items-center mt-4 ${
            isSubmitting ? "opacity-50" : ""
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {isEditing ? "Save Changes" : "List Product"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
