import { Product, Category, Brand } from '@/types/inventory';

export const sampleCategories: Category[] = [
  { id: '1', name: 'Grocery', icon: '🛒', productCount: 45, color: 'bg-green-100 text-green-700' },
  { id: '2', name: 'Clothing', icon: '👕', productCount: 32, color: 'bg-blue-100 text-blue-700' },
  { id: '3', name: 'Electronics', icon: '📱', productCount: 28, color: 'bg-purple-100 text-purple-700' },
  { id: '4', name: 'Footwear', icon: '👟', productCount: 18, color: 'bg-orange-100 text-orange-700' },
  { id: '5', name: 'Cosmetics', icon: '💄', productCount: 24, color: 'bg-pink-100 text-pink-700' },
  { id: '6', name: 'Stationery', icon: '📝', productCount: 15, color: 'bg-yellow-100 text-yellow-700' },
  { id: '7', name: 'Gifts', icon: '🎁', productCount: 12, color: 'bg-red-100 text-red-700' },
  { id: '8', name: 'Accessories', icon: '⌚', productCount: 20, color: 'bg-teal-100 text-teal-700' },
];

export const sampleBrands: Brand[] = [
  { id: '1', name: 'Parle', productCount: 12 },
  { id: '2', name: 'Britannia', productCount: 8 },
  { id: '3', name: 'Samsung', productCount: 15 },
  { id: '4', name: 'Bata', productCount: 10 },
  { id: '5', name: 'Lakme', productCount: 9 },
  { id: '6', name: 'Classmate', productCount: 7 },
  { id: '7', name: 'Levi\'s', productCount: 6 },
  { id: '8', name: 'Nike', productCount: 5 },
];

export const sampleProducts: Product[] = [
  { id: '1', name: 'Parle-G Biscuits', sku: 'GRC-001', barcode: '8901234567890', category: 'Grocery', brand: 'Parle', price: 10, costPrice: 8, quantity: 150, minStock: 50, unit: 'pkt', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Tata Salt 1kg', sku: 'GRC-002', barcode: '8901234567891', category: 'Grocery', brand: 'Tata', price: 28, costPrice: 24, quantity: 40, minStock: 30, unit: 'pkt', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Samsung Galaxy Buds', sku: 'ELC-001', barcode: '8901234567892', category: 'Electronics', brand: 'Samsung', price: 4999, costPrice: 3800, quantity: 5, minStock: 10, unit: 'pc', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Bata Formal Shoes', sku: 'FTW-001', barcode: '8901234567893', category: 'Footwear', brand: 'Bata', price: 1299, costPrice: 900, quantity: 12, minStock: 8, unit: 'pair', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Lakme Eyeliner', sku: 'COS-001', barcode: '8901234567894', category: 'Cosmetics', brand: 'Lakme', price: 250, costPrice: 180, quantity: 0, minStock: 15, unit: 'pc', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Classmate Notebook', sku: 'STN-001', barcode: '8901234567895', category: 'Stationery', brand: 'Classmate', price: 45, costPrice: 32, quantity: 80, minStock: 40, unit: 'pc', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Levi\'s Slim Jeans', sku: 'CLT-001', barcode: '8901234567896', category: 'Clothing', brand: 'Levi\'s', price: 2499, costPrice: 1800, quantity: 8, minStock: 10, unit: 'pc', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Britannia Good Day', sku: 'GRC-003', barcode: '8901234567897', category: 'Grocery', brand: 'Britannia', price: 30, costPrice: 24, quantity: 3, minStock: 25, unit: 'pkt', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'Nike Running Shoes', sku: 'FTW-002', barcode: '8901234567898', category: 'Footwear', brand: 'Nike', price: 5999, costPrice: 4500, quantity: 2, minStock: 5, unit: 'pair', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'USB-C Charger Cable', sku: 'ELC-002', barcode: '8901234567899', category: 'Electronics', brand: 'Samsung', price: 499, costPrice: 250, quantity: 25, minStock: 20, unit: 'pc', createdAt: new Date(), updatedAt: new Date() },
];
