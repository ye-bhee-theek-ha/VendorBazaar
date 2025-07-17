import { Timestamp } from "firebase/firestore";
import { CartItem } from "./types.product";
import { Address } from "./types.user";

export type OrderStatus =
  | "Packing"
  | "In Transit"
  | "Delivered"
  | "Completed"
  | "Cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  sellerId: string;
  shopName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: Timestamp;
  paymentReference?: string;
}
