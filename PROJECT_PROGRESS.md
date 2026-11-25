# UniMart — Complete 3-Part Production Architecture Log

## Status: ALL 3 PARTS COMPLETED & VERIFIED (Production Ready)

---

### 1. Executive Summary
UniMart is a comprehensive, production-ready multi-university community marketplace engineered specifically for students, faculty, and campus administrators across Bangladesh (initially supporting **BAUST**, **University of Dhaka**, **Begum Rokeya University**, and **Rajshahi University**, with full extensibility for additional campuses).

The platform successfully implements all three phases of development:
1. **PART 01 — Foundation & User Management**: Project architecture, data persistence, authentication, 6-digit OTP verification, RBAC (Student, Teacher, Admin), multi-university/department engine, profile settings, and notification slideover.
2. **PART 02 — Marketplace & Product Management**: Search & filter sidebar, category icon bar, product cards with real views & saves, product details modal with multi-image gallery & seller cards, "+ Post New Listing" modal with campus presets, seller "My Listings" management dashboard (Active/Sold/Inactive tabs & performance KPI counters), and Saved Items (Wishlist).
3. **PART 03 — Transactions, Offers, Chat, Services & Moderation**: Peer-to-peer offer negotiation pipeline following the Sequence Diagram (Make Offer, Accept Offer, Reject Offer, Cancel Offer), auto-generation of confirmed transactions and mark-as-sold transitions, split-screen live messaging chat with negotiation cards, campus services directory, graduating senior farewell clearance bundles, Help & Support center with interactive FAQs, and content moderation with admin resolution controls.

---

### 2. Implementation Overview by Module

#### PART 01: Core Architecture & Identity
- **Full-Stack Runtime**: Express backend serving modular REST routes under `/api/*`, integrated with Vite middleware for React 19 SPA rendering on port 3000.
- **Data Persistence**: File-backed store (`store.ts`) with disk persistence, crypto salted scrypt password hashing, and token session issuance.
- **Authentication**: Email/password registration, login, logout, password recovery, and 6-digit OTP verification.
- **RBAC Engine**: Strict role validation (`student`, `teacher`, `admin`) with quick switchers for demonstration.
- **University Management**: Support for BAUST, DU, BRUR, RU with admin CRUD for universities and academic departments.

#### PART 02: Marketplace & Listing Engine
- **Marketplace Browse (`BrowseMarketplaceView.tsx`)**:
  - Filter sidebar: Keywords search, Campus selector, Condition (Brand New, Like New, Good, Fair), Price range slider/inputs (৳ BDT), Seller type (Student, Teacher).
  - Category bar: All, Laptops, Phones & Tabs, PC Hardware, Books, Electronics, Furniture, Campus Gear.
  - Sorting: Newest First, Price: Low to High, Price: High to Low, Most Popular.
- **Product Card (`ProductCard.tsx`)**:
  - Image thumbnail with zoom effect, Active/Sold/Inactive badge, condition badge, views & interest counters, price in ৳ BDT, and one-click wishlist heart.
- **Product Details Modal (`ProductDetailsModal.tsx`)**:
  - 5-image gallery with hero preview and thumbnail strip.
  - Asking price, original bought price, condition highlights, campus meetup spot, views and interest count.
  - Verified seller profile box with role badge, university, and contact details.
  - Direct triggers for "Make Offer", "Chat with Seller", "Save to Wishlist", and "Report Listing".
- **Post & Edit Listing (`CreateListingModal.tsx`)**:
  - Item title, category, condition, selling price, original price, campus meetup point, multi-image manager with quick campus presets, and features bullet points.
- **Seller Dashboard (`MyListingsView.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.52_PM_87b8c55a.jpeg`.
  - Status tabs: All, Active, Sold, Inactive.
  - Metric cards: Total Listings, Active Listings, Sold Items, Inactive Items, Total Views, and "Keep Going!" attention indicator.
  - Direct listing controls: Edit, Mark as Sold, Reactivate, and Delete.
- **Saved Items / Wishlist (`SavedItemsView.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.52_PM__1__706388ef.jpeg`.
  - Saved listings feed with real-time add/remove toggling and direct purchase/chat triggers.

#### PART 03: Negotiation, Chat, Services, Moderation & Support
- **Offer Negotiation Pipeline (`offersApi`, `offerController.ts`, `MakeOfferModal.tsx`)**:
  - Follows the official Sequence Diagram: Buyer submits offer with amount and note -> Seller receives notification -> Seller accepts offer -> Item marked sold -> Confirmed transaction logged -> Buyer notified.
  - Quick percentage discount presets (-5%, -10%, -15%, Match Asking).
- **Split-Screen Chat (`MessagesChatView.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.53_PM__2__d5298130.jpeg`.
  - Left conversation column with unread counters, last message timestamp, and product thumbnails.
  - Right chat window with product summary card, chat thread, offer message bubbles, and "Accept Offer" action.
- **Campus Services Directory (`ServicesView.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.53_PM_2480b66b.jpeg`.
  - Service categories: PC & Software, Academic Help, Design & Creative, Tutoring, Others.
  - Verified provider profiles, hourly or flat rates in ৳ BDT, reviews and rating stars (e.g. ★ 4.9).
  - Sidebar guides: "Need Help?", "How It Works" (1-2-3), and "Stay Safe" campus trade guidelines.
- **Graduating Senior Sales (`GraduatingSaleView.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.51_PM__2__03d70c50.jpeg`.
  - Senior clearance bundles featuring personal farewell quotes, semester batch, and multi-item showcases.
- **Help & Support Center (`HelpSupportView.tsx` & `ReportProblemModal.tsx`)**:
  - Replicating mockup `WhatsApp_Image_2026-11-02_at_9.27.54_PM_3f8fc712.jpeg`.
  - Searchable FAQ accordion covering account setup, posting listings, campus payments, and safety.
  - Email support link (`support@unimart.edu.bd`).
  - "Report a Problem" modal connected to `/api/reports`.
- **Content Moderation (`AdminDashboard.tsx`)**:
  - Dedicated Moderation tab for campus admins to review flagged listings, scams, or user complaints with one-click "Resolve" or "Dismiss" status actions.

---

### 3. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| **Authentication** | | | |
| POST | `/api/auth/register` | Register new student or teacher | No |
| POST | `/api/auth/login` | Login with university credentials | No |
| POST | `/api/auth/verify-email` | Verify 6-digit OTP code | Optional |
| POST | `/api/auth/resend-code` | Resend verification code | Optional |
| GET  | `/api/auth/me` | Fetch active session | Yes |
| POST | `/api/auth/logout` | Invalidate token | Yes |
| POST | `/api/auth/forgot-password` | Request password reset token | No |
| POST | `/api/auth/reset-password` | Set new password with token | No |
| **Universities & Departments** | | | |
| GET  | `/api/universities` | List all supported universities | No |
| GET  | `/api/universities/:id` | Get university with departments | No |
| POST | `/api/universities` | Add new university | Admin |
| PUT  | `/api/universities/:id` | Update university | Admin |
| DELETE | `/api/universities/:id` | Remove university | Admin |
| GET  | `/api/universities/meta/departments` | List all departments | No |
| POST | `/api/universities/departments/create` | Add new department | Admin |
| PUT  | `/api/universities/departments/:id` | Update department | Admin |
| DELETE | `/api/universities/departments/:id` | Delete department | Admin |
| **Marketplace & Products** | | | |
| GET  | `/api/products` | Browse listings with search/filter/sort | No |
| GET  | `/api/products/:id` | Get product details by ID | No |
| POST | `/api/products` | Create a new campus listing | Yes |
| PUT  | `/api/products/:id` | Update listing or change status | Yes |
| DELETE | `/api/products/:id` | Delete listing | Yes |
| POST | `/api/products/:id/wishlist` | Toggle wishlist save on listing | Yes |
| GET  | `/api/products/wishlist` | Get user saved items | Yes |
| GET  | `/api/products/my-listings` | Get seller listings and KPI stats | Yes |
| GET  | `/api/products/services` | Get campus skills and tutoring services | No |
| GET  | `/api/products/graduation-sales` | Get graduating senior clearance bundles | No |
| **Offers & Negotiations** | | | |
| GET  | `/api/offers` | Get user sent/received offers | Yes |
| POST | `/api/offers` | Submit offer for product | Yes |
| PUT  | `/api/offers/:id/accept` | Accept offer & mark product sold | Yes (Seller) |
| PUT  | `/api/offers/:id/reject` | Reject offer | Yes (Seller) |
| PUT  | `/api/offers/:id/cancel` | Cancel submitted offer | Yes (Buyer) |
| **Chat & Messaging** | | | |
| GET  | `/api/chat/conversations` | Get user conversation threads | Yes |
| POST | `/api/chat/start` | Start conversation for listing | Yes |
| GET  | `/api/chat/conversations/:id/messages` | Get messages & mark as read | Yes |
| POST | `/api/chat/conversations/:id/messages` | Send message in conversation | Yes |
| **Reviews & Ratings** | | | |
| GET  | `/api/reviews` | Get peer reviews | No |
| POST | `/api/reviews` | Submit peer review & rating | Yes |
| **Moderation & Support** | | | |
| POST | `/api/reports` | Submit problem or report listing | No |
| GET  | `/api/reports/admin` | List moderation reports | Admin |
| PUT  | `/api/reports/admin/:id` | Resolve or dismiss report | Admin |
| **Notifications & Admin** | | | |
| GET  | `/api/notifications` | Get user notifications | Yes |
| PUT  | `/api/notifications/:id/read` | Mark notification as read | Yes |
| POST | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| GET  | `/api/admin/users` | List all users with filters | Admin |
| PUT  | `/api/admin/users/:id/verify` | Toggle user verified status | Admin |
| PUT  | `/api/admin/users/:id/status` | Suspend or activate user | Admin |
| GET  | `/api/admin/stats` | System KPI analytics counters | Admin |

---

### 4. Automated Test Verification Summary

All 9/9 automated test suites executed successfully:
1. `email validation correctly accepts valid format` (Pass)
2. `university domain check identifies institutional emails` (Pass)
3. `password validation enforces minimum length` (Pass)
4. `registration payload validation checks student specific fields` (Pass)
5. `RBAC permissions allow admin privileges and restrict students` (Pass)
6. `Product store lifecycle: creation, retrieval, and status update` (Pass)
7. `Offer negotiation sequence: Make offer and accept offer (Sequence Diagram)` (Pass)
8. `Chat messaging and conversation thread` (Pass)
9. `Moderation reports and resolution` (Pass)

Compilation & Lint status: **0 errors, 100% build pass.**
Dev server running on: `http://localhost:3000`.
Persisted database stored at: `.data/unimart_db.json`.
