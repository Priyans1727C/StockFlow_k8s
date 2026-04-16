export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand: string;
  price: number;
  costPrice: number;
  quantity: number;
  minStock: number;
  unit: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
  color: string;
}

export interface Brand {
  id: string;
  name: string;
  productCount: number;
}

export type StockStatus = 'in-stock' | 'low-stock' | 'critical' | 'out-of-stock';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: StockStatus;
  timestamp: Date;
}

export const getStockStatus = (quantity: number, minStock: number): StockStatus => {
  if (quantity === 0) return 'out-of-stock';
  if (quantity <= minStock * 0.25) return 'critical';
  if (quantity <= minStock) return 'low-stock';
  return 'in-stock';
};

export const getStockStatusLabel = (status: StockStatus): string => {
  switch (status) {
    case 'in-stock': return 'In Stock';
    case 'low-stock': return 'Low Stock';
    case 'critical': return 'Critical';
    case 'out-of-stock': return 'Out of Stock';
  }
};
