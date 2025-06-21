import { Timestamp } from "firebase/firestore";

export interface Seller {
  sid: string;
  shopName: string;
  shopBannerUrl?: string;
  bio?: string;
  memberSince: Timestamp;
  avgRating: number;
  totalReviews: number;
  totalProducts: number;
  totalFollowers: number;
}
