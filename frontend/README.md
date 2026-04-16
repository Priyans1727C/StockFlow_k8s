<p align="center">
  <img src="https://img.shields.io/badge/StockFlow-Inventory%20Manager-6366f1?style=for-the-badge&logo=package&logoColor=white" alt="StockFlow" />
</p>

<h1 align="center">📦 StockFlow — Smart Inventory Manager</h1>

<p align="center">
  A modern, full-featured inventory management system built for shop owners, retailers, and small businesses. Track products, manage sales & purchases, monitor stock levels, and analyze business performance — all from one beautiful dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/Framer_Motion-Animations-FF0055?style=flat-square&logo=framer" />
</p>

---

## 🚀 Features at a Glance

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Real-time overview with stock alerts, daily revenue, category breakdown, and restock recommendations |
| 📦 **Product Management** | Full CRUD for products with SKU, barcode, category, brand, pricing, and stock levels |
| 🛒 **POS / Sales** | Point-of-sale interface — create invoices, apply discounts, and choose payment method (Cash/UPI/Card) |
| 📥 **Purchases** | Record incoming stock purchases with supplier info, reference numbers, and auto stock updates |
| 🏷️ **Categories & Brands** | Organize inventory with custom categories (with icons & colors) and brand management |
| 📈 **Stock Tracking** | Live stock monitoring with progress bars, color-coded status badges, and min-stock thresholds |
| 🔔 **Alerts** | Automatic alerts for low-stock, critical, and out-of-stock products |
| 📷 **Barcode Scanner** | Built-in barcode/QR scanner using device camera for quick product lookup |
| 📉 **Analytics** | Business analytics with sales trends, revenue charts, and inventory valuation |
| 🔐 **Authentication** | Secure email-based signup/login with protected routes |
| 📱 **Mobile-First** | Responsive design with bottom navigation bar, touch-optimized interactions |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript 5 |
| **Build Tool** | Vite 5 (SWC) |
| **Styling** | Tailwind CSS 3 + Custom Design Tokens |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion |
| **State Management** | React Context API |
| **Data Fetching** | TanStack React Query |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Scanner** | html5-qrcode |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── inventory/          # Product dialog, stat cards, stock badges
│   ├── layout/             # App layout, sidebar, top bar, mobile nav
│   └── ui/                 # shadcn/ui components (button, dialog, table, etc.)
├── context/
│   ├── AuthContext.tsx      # Authentication state & user profile
│   └── InventoryContext.tsx # Central inventory data management
├── hooks/                  # Custom hooks (use-mobile, use-toast)
├── integrations/
│   └── supabase/           # Auto-generated Supabase client & types
├── pages/
│   ├── Dashboard.tsx       # Main overview with stats & alerts
│   ├── Products.tsx        # Product listing & management
│   ├── Sales.tsx           # POS / sales recording
│   ├── Purchases.tsx       # Purchase order management
│   ├── Categories.tsx      # Category management
│   ├── Brands.tsx          # Brand management
│   ├── StockTracking.tsx   # Real-time stock monitoring
│   ├── Alerts.tsx          # Stock alert notifications
│   ├── Scanner.tsx         # Barcode/QR code scanner
│   ├── Analytics.tsx       # Business analytics & charts
│   ├── Auth.tsx            # Login & signup page
│   └── NotFound.tsx        # 404 page
├── types/
│   ├── inventory.ts        # Product, Category, Brand, StockAlert types
│   └── sales.ts            # Sale, Purchase types
├── App.tsx                 # Root component with routing
├── main.tsx                # Entry point
└── index.css               # Global styles & design tokens
```

---

## 🗄️ Database Schema

The app uses **8 tables** with Row-Level Security (RLS) enabled:

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  categories  │     │   products    │     │    brands    │
│──────────────│     │───────────────│     │──────────────│
│ id (PK)      │◄────│ category_id   │     │ id (PK)      │
│ name         │     │ brand_id      │────►│ name         │
│ icon         │     │ name          │     │ user_id      │
│ color        │     │ sku           │     └──────────────┘
│ user_id      │     │ barcode       │
└──────────────┘     │ selling_price │
                     │ cost_price    │
                     │ stock_quantity│
                     │ min_stock     │
                     │ unit          │
                     │ user_id       │
                     └───────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  sale_items   │ │purchase_items│ │   profiles   │
     │──────────────│ │──────────────│ │──────────────│
     │ sale_id (FK) │ │purchase_id   │ │ user_id      │
     │ product_id   │ │ product_id   │ │ shop_name    │
     │ quantity     │ │ quantity     │ │ owner_name   │
     │ price_at_sale│ │cost_price_at │ │ phone        │
     └──────┬───────┘ │  _purchase   │ └──────────────┘
            │         └──────┬───────┘
            ▼                ▼
     ┌──────────────┐ ┌──────────────┐
     │    sales     │ │  purchases   │
     │──────────────│ │──────────────│
     │ invoice_no   │ │ reference_no │
     │ subtotal     │ │ supplier     │
     │ discount     │ │ total        │
     │ total        │ │ user_id      │
     │ payment_meth │ └──────────────┘
     │ user_id      │
     └──────────────┘
```

### Security

- **RLS Policies**: All tables have Row-Level Security enabled
- **Read Access**: All authenticated users can view shared inventory data
- **Write Access**: Only the record creator can update or delete their own data
- **Authentication**: Email-based auth with protected routes

---

## 🎨 Design System

StockFlow uses a custom design token system built on Tailwind CSS:

- **Typography**: Plus Jakarta Sans (display + body)
- **Color Palette**: Warm commerce theme with indigo primary, semantic status colors
- **Glassmorphism**: Frosted glass cards with `backdrop-blur` effects
- **Animations**: Spring-based transitions via Framer Motion
- **Responsive**: Mobile-first with bottom nav (mobile) + sidebar (desktop)

### Stock Status Colors

| Status | Visual |
|---|---|
| 🟢 **In Stock** | Green badge — healthy levels |
| 🟡 **Low Stock** | Amber badge — approaching minimum |
| 🟠 **Critical** | Orange badge — below 25% of minimum |
| 🔴 **Out of Stock** | Red badge — zero quantity |

---

## 📱 Pages & Modules

### 1. Dashboard (`/`)
The central hub displaying:
- **Stat Cards**: Total products, inventory value (₹), low stock count, out-of-stock count
- **Daily Revenue**: Today's sales total with trend indicator
- **Stock Alerts**: Top 5 products needing attention with visual progress bars
- **Category Grid**: Quick-access category cards with product counts
- **Restock Table**: Sortable table of all products below minimum stock

### 2. Products (`/products`)
Complete product management:
- Search and filter products
- Add/edit product dialog with all fields (name, SKU, barcode, category, brand, prices, stock, unit)
- Delete products with confirmation
- Stock status badges on each product

### 3. POS / Sales (`/sales`)
Point-of-sale workflow:
- Search products to add to cart
- Set quantities and apply discounts
- Choose payment method (Cash / UPI / Card)
- Auto-generate invoice numbers
- Stock auto-decrements on sale completion

### 4. Purchases (`/purchases`)
Incoming stock management:
- Record purchase orders with supplier info
- Add multiple products per purchase
- Reference number tracking
- Stock auto-increments on purchase

### 5. Categories (`/categories`)
- Create categories with custom emoji icons and color themes
- View product count per category
- Delete categories

### 6. Brands (`/brands`)
- Add and manage product brands
- View product count per brand
- Delete brands

### 7. Stock Tracking (`/stock`)
- Real-time stock level monitoring
- Visual progress bars for each product
- Filter by stock status
- Min-stock threshold indicators

### 8. Alerts (`/alerts`)
- Automatic alert generation for products below thresholds
- Categorized by severity (low, critical, out-of-stock)
- Quick action links

### 9. Scanner (`/scanner`)
- Camera-based barcode/QR code scanning
- Instant product lookup by barcode
- Works on mobile devices

### 10. Analytics (`/analytics`)
- Sales trends over time
- Revenue breakdowns
- Inventory valuation charts
- Category-wise distribution

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- A Supabase project (or use Lovable Cloud)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd stockflow

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

For the Docker image, pass the same values at runtime instead of baking them into the build:

```bash
docker run --rm -p 8080:80 --env-file .env stockflow-frontend
```

The container writes `/env-config.js` on startup, so each user can supply their own Supabase URL and publishable key without rebuilding the image.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

