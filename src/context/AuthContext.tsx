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
} from "firebase/auth";

import { auth, db } from "../lib/firebase";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
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

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
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
  const [user, setUser] = useState<User | null>(null);
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialAuthLoading, setInitialAuthLoading] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "902077437711-hhavq0qplha646a9s318pbsnka0tdn21.apps.googleusercontent.com",
    iosClientId:
      "902077437711-dseprq31p115t8v6g7o168oopafjc0ca.apps.googleusercontent.com",
    webClientId:
      "902077437711-ev02r5d3t37i3t7e4espaj1cdbl7iptv.apps.googleusercontent.com",
  });

  // google signin useEffect
  useEffect(() => {
    if (response?.type === "success") {
      setLoading(true);
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .catch((error) => {
          console.error(
            "Firebase sign-in with Google credential failed:",
            error
          );
          Alert.alert(
            "Sign-In Error",
            "Could not sign in with Google. Please try again."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (response?.type === "error") {
      Alert.alert("Sign-In Canceled", "Google Sign-In was canceled or failed.");
      setLoading(false);
    }
  }, [response]);

  // useEffect(() => {
  //   console.log("AuthContext: Initializing auth state listener...");
  //   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     setInitialAuthLoading(true);
  //     if (firebaseUser) {
  //       setUser(firebaseUser);
  //       try {
  //         const userDocRef = doc(db, "users", firebaseUser.uid);
  //         const userDocSnap = await getDoc(userDocRef);
  //         if (userDocSnap.exists()) {
  //           const userData = userDocSnap.data();
  //           setAppUser({
  //             ...firebaseUser,
  //             fullName: userData.fullName,
  //             role: userData.role,
  //             OnboardingCompleted: userData.OnboardingCompleted || "false",
  //           } as AppUser);
  //         } else {
  //           console.warn(
  //             "User document not found in Firestore for UID [deleting account]:",
  //             firebaseUser.uid
  //           );
  //           deleteUser(firebaseUser);
  //           setAppUser(null);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching user data from Firestore:", error);
  //         setAppUser(firebaseUser as AppUser);
  //       }
  //     } else {
  //       setUser(null);
  //       setAppUser(null);
  //     }
  //     setInitialAuthLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    // This listener handles all authentication state changes for the app
    console.log("AuthContext: Initializing auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitialAuthLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
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
          // they won't have a document. We must create one here.
          console.log(
            "Creating new user profile in Firestore for:",
            firebaseUser.email
          );
          const newUserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || "New User",
            role: "customer",
            OnboardingCompleted: "false",
            createdAt: serverTimestamp(),

            // onboarding feilds
            address: [],
            dob: null,
            gender: null,

            likedProductIds: [],
            FollowingSellersIds: [],
          };
          await setDoc(userDocRef, newUserProfile);
          setAppUser({
            ...firebaseUser,
            fullName: firebaseUser.displayName || "New User",
            role: "customer",
            OnboardingCompleted: "false",
          } as AppUser);
          setLikedProductIds([]);
        }
      } else {
        // User is signed out
        setAppUser(null);
        setLikedProductIds([]);
      }
      setInitialAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // useeffect to handle navigation
  useEffect(() => {
    if (initialAuthLoading) {
      console.log("AuthContext: Router not ready or initial auth loading.");
      return;
    }

    if (!Array.isArray(segments)) {
      console.log(
        "AuthContext: Segments not yet available. Deferring navigation logic."
      );
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!appUser) {
      if (!inAuthGroup) {
        console.log("No user. Redirecting to login.");
        router.replace("/(auth)/login");
      }
      return;
    }

    if (appUser.OnboardingCompleted === "false") {
      if (!inOnboardingGroup) {
        console.log("User not onboarded. Redirecting to onboarding.");
        router.replace("/(onboarding)");
      }
      // already in onboarding group, no need to redirect
      return;
    }

    const isInPublicGroups = inAuthGroup || inOnboardingGroup;
    const shouldBeInHome = !(appUser.OnboardingCompleted === "false");

    if (shouldBeInHome) {
      if (isInPublicGroups) {
        if (appUser.role === "seller") {
          console.log("Redirecting seller to home.");
          router.replace("/(seller)/home");
        } else if (appUser.role === "customer") {
          console.log("Redirecting customer to home.");
          router.replace("/(customer)/home");
        } else {
          console.log("Unknown role. Signing out.");
          signOut();
          router.replace("/(auth)/login");
        }
      }
      // If they are already in their correct section
      return;
    }

    console.log("AuthContext Navigation Check:");
    console.log("Current user:", user ? user.uid : "No user");
    console.log("App user Onboarding:", appUser.OnboardingCompleted);
    console.log("Initial loading:", initialAuthLoading);
    console.log("Loading state:", loading);
    console.log("inAuthGroup:", inAuthGroup);
    console.log("inOnboardingGroup:", inOnboardingGroup);
    console.log("Current segments:", segments);
    console.log("----------------------------------------");
  }, [appUser, segments, initialAuthLoading, loading, router]);

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
      } else {
        await updateDoc(userDocRef, {
          FollowingSellersIds: arrayUnion(sellerId),
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

      console.log("AuthContext: User signed out.");
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
      GoogleSignin.configure({
        webClientId:
          "902077437711-ev02r5d3t37i3t7e4espaj1cdbl7iptv.apps.googleusercontent.com",
      });

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
