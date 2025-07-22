import { OrderStatus } from "../constants/types.order";
import { Product } from "../constants/types.product";

// Helper to map Supabase snake_case to our camelCase Product type
export const mapSupabaseToProduct = (data: any): Product => {
  return {
    pid: data.id,
    sellerId: data.seller_id,
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    condition: data.condition,
    stockQuantity: data.stock_quantity,
    imagesUrl: data.images_url,
    ratingAvg: data.avg_rating,
    totalReviews: data.total_reviews,
    sellerName: data.seller_name,
    sellerImgUrl: data.seller_img_url,
    createdAt: data.created_at,
    totalViews: data.total_views || 0,
    totalSales: data.total_sales || 0,
    totalRevenue: data.total_revenue || 0,
    options: data.options || [],
    disabled: data.disabled || false,
    disabledAdmin: data.disabled_admin || false,
  };
};

export const statusToAnalyticsKey = (status: OrderStatus) => {
  if (status === "In Transit") return "inTransit";
  return status.toLowerCase();
};
