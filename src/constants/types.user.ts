import { User } from "firebase/auth";

export interface AppUser extends User {
  fullName?: string;
  role?: "customer" | "seller";
  OnboardingCompleted: string;

  address: [
    {
      nickname: string;
      fullAddress: string;
      isDefault: boolean;
    }
  ];
  dob?: Date;
  gender?: "male" | "female";
}
