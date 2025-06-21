import { Timestamp } from "firebase/firestore";

export interface Product {
  pid: string;
  price: number;
  sellerId: string;
  sellerName: string;
  sellerImgUrl: string;
  ratingAvg: number;
  totalReviews: number;
  name: string;
  category: string;
  condition: "new" | "used" | "refurbished";
  description?: string;
  imagesUrl: string[];
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  productId: string;
  sellerId: string;
  userId: string;
  rating: number;
  userName: string;
  text: string;
  createdAt: Timestamp;
  // ImageUrls: string[];
  id: string;
}
