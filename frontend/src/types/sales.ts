export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
  maxStock: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  timestamp: Date;
  invoiceNo: string;
}

export interface Purchase {
  id: string;
  items: PurchaseItem[];
  supplier: string;
  total: number;
  timestamp: Date;
  referenceNo: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  costPrice: number;
  quantity: number;
  unit: string;
}

export const generateInvoiceNo = (): string => {
  const d = new Date();
  const prefix = 'INV';
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${rand}`;
};

export const generatePurchaseRef = (): string => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${date}-${rand}`;
};
