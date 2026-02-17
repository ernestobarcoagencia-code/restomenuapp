# implementation_plan - Restaurant Menu App (Multi-tenant)

## Goal Description
Refactor the application to support multiple restaurants on different subdomains from a single codebase, including a comprehensive Super Admin to manage them.

## Proposed Changes

### 1. Database Schema
*Completed.* `restaurants`, `categories`, `products`, `orders`.

### 2. Frontend Routing
*Completed.* Subdomain-based routing.

### 3. Admin Authentication
*Completed.* Login Screen and Protected Routes.

### 4. Admin Management Features (New)
Refactor `AdminDashboard` into a layout with navigation (Sidebar/Tabs).

#### A. Global Restaurant Context
-   **Selector**: Dropdown to switch between managed restaurants.
-   **Context**: Provides `currentRestaurant` to all admin specific views.

#### B. Restaurant Management (Super Admin)
-   **Create Restaurant**: Form to add new clients (`name`, `slug`).
-   **Domain Config**: Edit `slug` and `custom_domain`.
-   **Design**: (Future) Edit colors, logo.

#### C. Menu Management
-   **Categories**: List, Reorder, Add, Edit, Delete.
-   **Products**: List, Add (with Image Upload), Edit, Delete, Toggle Availability.

#### D. Orders View
-   Existing Realtime Feed (Filtered by `currentRestaurant`).

## Verification Plan
1.  **Create Resto**: Create "Nueva Pizzería" -> Check Database.
2.  **Domains**: Set `custom_domain` -> Verify logic (requires manual DNS still).
3.  **Menu**: Add a pizza to "Nueva Pizzería" -> Verify it DOES NOT appear in "El Baqueano".
