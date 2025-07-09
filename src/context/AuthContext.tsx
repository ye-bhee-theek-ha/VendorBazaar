// context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  onIdTokenChanged,
} from "firebase/auth";

import { auth, db } from "../lib/firebase";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AppUser } from "../constants/types.user";

import { Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  initialAuthLoading: boolean;
  likedProductIds: string[];

  toggleLikeProduct: (productId: string) => Promise<void>;
  toggleFollowSeller: (sellerId: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signUp: (
    email: string,
    pass: string,
    fullName: string
  ) => Promise<User | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateInitialUserProfile: (
    gender: string,
    address: { nickname: string; fullAddress: string; isDefault: boolean }[],
    dob: Date | null
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialAuthLoading, setInitialAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "817629834864-gpljnhiikhj0ap4f0586puhba4sh96n3.apps.googleusercontent.com",
    });
  }, []);

  // This listener handles all authentication state changes for the app
  useEffect(() => {
    console.log("AuthContext: Initializing auth state listener...");
    // setAppUser(null);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitialAuthLoading(true);

      try {
        if (firebaseUser) {
          // User is signed in
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          console.log("DEBUG: User document snapshot:", userDocSnap.exists());

          if (userDocSnap.exists()) {
            // User document exists, merge data
            const userData = userDocSnap.data();
            setAppUser({
              ...firebaseUser,
              fullName: userData.fullName,
              role: userData.role,
              OnboardingCompleted: userData.OnboardingCompleted || "false",
              likedProductIds: userData.likedProductIds || [],
              FollowingSellersIds: userData.FollowingSellersIds || [],
              address: userData.address || [],
            } as AppUser);
            setLikedProductIds(userData.likedProductIds || []);
          } else {
            // New user, create their document in Firestore
            console.log(
              "Creating new user profile in Firestore for:",
              firebaseUser.email
            );
            const newUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || "New User",
              photoURL: firebaseUser.photoURL || null,
              role: "customer",
              OnboardingCompleted: "false",
              createdAt: serverTimestamp(),
              address: [],
              dob: null,
              gender: null,
              likedProductIds: [],
              FollowingSellersIds: [],
            };
            await setDoc(userDocRef, newUserProfile);
            // Set the app user state with the newly created profile data
            setAppUser({
              ...firebaseUser,
              fullName: newUserProfile.fullName,
              role: newUserProfile.role,
              OnboardingCompleted: newUserProfile.OnboardingCompleted,
            } as AppUser);
            setLikedProductIds([]);
          }
        } else {
          // User is signed out
          console.log("DEBUG: User is signed out.");
          setAppUser(null);
          setLikedProductIds([]);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
        await firebaseSignOut(auth);
        await GoogleSignin.signOut();
        setAppUser(null);
        setLikedProductIds([]);
      } finally {
        console.log("DEBUG: Initial auth loading complete.");
        setInitialAuthLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const toggleLikeProduct = async (productId: string) => {
    if (!appUser) return;

    const userDocRef = doc(db, "users", appUser.uid);
    const isLiked = likedProductIds.includes(productId);

    const newLikedIds = isLiked
      ? likedProductIds.filter((id) => id !== productId)
      : [...likedProductIds, productId];
    setLikedProductIds(newLikedIds);

    try {
      if (isLiked) {
        await updateDoc(userDocRef, {
          likedProductIds: arrayRemove(productId),
        });
      } else {
        await updateDoc(userDocRef, {
          likedProductIds: arrayUnion(productId),
        });
      }
    } catch (error) {
      console.error("Error toggling Like status in Firestore:", error);
      setLikedProductIds(likedProductIds);
    }
  };

  const toggleFollowSeller = async (sellerId: string) => {
    if (!appUser) return;
    const userDocRef = doc(db, "users", appUser.uid);
    const sellerDocRef = doc(db, "sellers", sellerId);
    const isFollowing = appUser.FollowingSellersIds.includes(sellerId);

    isFollowing
      ? setAppUser({
          ...appUser,
          FollowingSellersIds: appUser.FollowingSellersIds.filter(
            (id) => id !== sellerId
          ),
        })
      : setAppUser({
          ...appUser,
          FollowingSellersIds: [...appUser.FollowingSellersIds, sellerId],
        });

    try {
      if (isFollowing) {
        await updateDoc(userDocRef, {
          FollowingSellersIds: arrayRemove(sellerId),
        });
        await updateDoc(sellerDocRef, { totalFollowers: increment(-1) });
        await updateDoc(sellerDocRef, {
          FollowersIds: arrayRemove(appUser.uid),
        });
      } else {
        await updateDoc(userDocRef, {
          FollowingSellersIds: arrayUnion(sellerId),
        });
        await updateDoc(sellerDocRef, {
          FollowersIds: arrayUnion(sellerId),
        });
        await updateDoc(sellerDocRef, { totalFollowers: increment(1) });
      }
    } catch (error) {
      console.error("Error toggling Follow status in Firestore:", error);
    }
  };

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        pass
      );
      // onAuthStateChanged will handle fetching Firestore data and setting appUser state.
      setLoading(false);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      console.error("Sign in error:", error);
      throw error; // Rethrow to be caught by UI
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string
  ): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );
      const newUser = userCredential.user;

      // Store additional user info in Firestore
      const userDocRef = doc(db, "users", newUser.uid);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: newUser.email,
        fullName: fullName,
        role: "customer",
        OnboardingCompleted: "false",

        // onboarding feilds
        address: [],
        dob: null,
        gender: null,

        createdAt: serverTimestamp(),
        likedProductIds: [],
        FollowingSellersIds: [],
      });

      // Set appUser in context immediately with new details
      setAppUser({ ...newUser, fullName, role: "customer" } as AppUser);
      setLikedProductIds([]);
      setLoading(false);
      return newUser;
    } catch (error) {
      setLoading(false);
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      if (GoogleSignin.getCurrentUser()) {
        await GoogleSignin.signOut();
      }
      console.log("DEBUG AuthContext: User signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (emailAddress: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailAddress);
    } catch (error) {
      console.error("Send password reset email error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        const googleCredential = GoogleAuthProvider.credential(
          userInfo.data.idToken
        );
        await signInWithCredential(auth, googleCredential);
      } else {
        throw new Error(
          "Google Sign-In succeeded but did not return an ID token."
        );
      }
    } catch (error: any) {
      if (error.code === "SIGN_IN_CANCELLED") {
        console.log("Google Sign-In was cancelled.");
      } else {
        console.error("Google Sign-In Error", error);
        Alert.alert(
          "Sign-In Error",
          "An error occurred during Google Sign-In."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateInitialUserProfile = async (
    gender: string,
    address: { nickname: string; fullAddress: string; isDefault: boolean }[],
    dob: Date | null
  ) => {
    if (!appUser) {
      console.warn("No user is currently signed in.");
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", appUser.uid);
      await setDoc(
        userDocRef,
        {
          gender: gender,
          address: address,
          dob: dob ? serverTimestamp() : null,
          OnboardingCompleted: "true",
          likedProductIds: [],
        },
        { merge: true }
      );

      // Update appUser state immediately
      setAppUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gender: gender,
          address: address,
          dob: dob ? new Date(dob) : null,
          OnboardingCompleted: "true",
        } as AppUser;
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const ReFetchUser = async () => {};

  return (
    <AuthContext.Provider
      value={{
        user: appUser,
        loading,
        initialAuthLoading,
        likedProductIds,
        toggleLikeProduct,
        toggleFollowSeller,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        updateInitialUserProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
