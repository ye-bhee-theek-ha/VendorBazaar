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
} from "firebase/auth";

import { auth, db } from "../lib/firebase";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { AppUser } from "../constants/types.user";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  initialAuthLoading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signUp: (
    email: string,
    pass: string,
    fullName: string
  ) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialAuthLoading, setInitialAuthLoading] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log("AuthContext: Initializing auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitialAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setAppUser({
              ...firebaseUser,
              fullName: userData.fullName,
              role: userData.role,
              OnboardingCompleted: userData.OnboardingCompleted || "false",
            } as AppUser);
          } else {
            console.warn(
              "User document not found in Firestore for UID [deleting account]:",
              firebaseUser.uid
            );
            deleteUser(firebaseUser);
            setAppUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setAppUser(firebaseUser as AppUser);
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      setInitialAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      if (!inAuthGroup && !inOnboardingGroup) {
        console.log("No user. Redirecting to login.");
        router.replace("/(auth)/login");
      }
      return;
    }

    if (appUser.OnboardingCompleted === "false" && !inOnboardingGroup) {
      console.log("User not onboarded. Redirecting to onboarding.");
      router.replace("/(onboarding)");
      return;
    }

    const isInPublicGroups = inAuthGroup || inOnboardingGroup;
    const shouldBeInHome =
      !(appUser.OnboardingCompleted === "false") && isInPublicGroups;

    if (shouldBeInHome || !isInPublicGroups) {
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
      });

      // Set appUser in context immediately with new details
      setAppUser({ ...newUser, fullName, role: "customer" } as AppUser);

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

  const ReFetchUser = async () => {};

  return (
    <AuthContext.Provider
      value={{
        user: appUser,
        loading,
        initialAuthLoading,
        signIn,
        signUp,
        signOut,
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
