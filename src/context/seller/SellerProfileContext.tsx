// src/context/seller/SellerProfileContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db } from "@/src/lib/firebase";
import { useAuth } from "../AuthContext";
import { Seller } from "@/src/constants/types.seller";
import { Alert } from "react-native";

// The form data structure
export interface SellerFormData {
  shopName: string;
  bio: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
}

interface SellerProfileContextType {
  formData: SellerFormData;
  setFormData: React.Dispatch<React.SetStateAction<SellerFormData>>;
  bannerUri: string | null;
  loading: boolean;
  uploadingImage: boolean;
  initialLoading: boolean;
  handleSave: () => Promise<void>;
  handleImagePick: () => Promise<void>;
}

const SellerProfileContext = createContext<
  SellerProfileContextType | undefined
>(undefined);

export function SellerProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ReFetchUser } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [formData, setFormData] = useState<SellerFormData>({
    shopName: "",
    bio: "",
    street: "",
    city: "",
    postalCode: "",
    province: "",
  });

  // Fetches the initial seller data from Firestore
  const fetchSellerData = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    try {
      const sellerDocRef = doc(db, "sellers", user.uid);
      const docSnap = await getDoc(sellerDocRef);
      if (docSnap.exists()) {
        const sellerData = docSnap.data() as Seller;
        setFormData({
          shopName: sellerData.shopName || "",
          bio: sellerData.bio || "",
          street: sellerData.address?.street || "",
          city: sellerData.address?.city || "",
          postalCode: sellerData.address?.postalCode || "",
          province: sellerData.address?.province || "",
        });
        setBannerUri(sellerData.shopBannerUrl || null);
      }
    } catch (error) {
      console.error("Failed to fetch seller data:", error);
      Alert.alert("Error", "Could not load your shop details.");
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  // Handles picking an image from the device library
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setBannerUri(result.assets[0].uri);
    }
  };

  // Handles saving all data (including image upload) to Firestore
  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    let newBannerUrl = bannerUri;

    try {
      // Upload new banner if it's a local URI
      if (bannerUri && bannerUri.startsWith("file://")) {
        setUploadingImage(true);
        const storage = getStorage();
        const response = await fetch(bannerUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `shop_banners/${user.uid}`);

        await uploadBytes(storageRef, blob);
        newBannerUrl = await getDownloadURL(storageRef);
        setUploadingImage(false);
      }

      // Update Firestore seller document
      const sellerDocRef = doc(db, "sellers", user.uid);
      await updateDoc(sellerDocRef, {
        shopName: formData.shopName,
        bio: formData.bio,
        shopBannerUrl: newBannerUrl,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province,
        },
      });

      await ReFetchUser();
    } catch (error) {
      console.error("Error updating seller details:", error);
      Alert.alert(
        "Error",
        "Failed to update your shop details. Please try again."
      );
      throw error; // Re-throw error so component can handle it
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const value = {
    formData,
    setFormData,
    bannerUri,
    loading,
    uploadingImage,
    initialLoading,
    handleSave,
    handleImagePick,
  };

  return (
    <SellerProfileContext.Provider value={value}>
      {children}
    </SellerProfileContext.Provider>
  );
}

// Custom hook to easily access the context
export function useSellerProfile() {
  const context = useContext(SellerProfileContext);
  if (context === undefined) {
    throw new Error(
      "useSellerProfile must be used within a SellerProfileProvider"
    );
  }
  return context;
}
