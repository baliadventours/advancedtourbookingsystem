# DayTours - Production Deployment & Setup Guide

This guide provides a detailed, step-by-step walkthrough for deploying this travel platform to production using GitHub, Vercel, and Firebase.

---

## Step 1: Download & Prepare the Code

1. **Option A: Download ZIP**: Click the "Settings" menu in AI Studio and select **Export to ZIP**. Extract it locally.
2. **Option B: Clone Repository**: If this code was provided as a GitHub link, use `git clone <repo-url>`.
3. **Test Local**: (Optional) 
   - Open your terminal in the folder.
   - Run `npm install`.
   - Run `npm run dev`.
   - Ensure the app starts on `http://localhost:3000`.

---

## Step 2: Create a GitHub Repository

1. Log in to [GitHub](https://github.com).
2. Click **New Repository**.
3. Name it (e.g., `my-travel-platform`). Set it to **Private** (recommended).
4. Do NOT initialize with a README or .gitignore (the project already has them).
5. In your local terminal, initialize the git repo and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
   git push -u origin main
   ```

---

## Step 3: Production Firebase Setup

You must create a dedicated production Firebase project.

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Click **Add Project** and follow the prompts.
3. **Authentication Setup**:
   - Go to **Build > Authentication**.
   - Click **Get Started**.
   - Enable **Google** sign-in.
   - Enable **Email/Password** sign-in.
   - Set your support email and click Save.
4. **Firestore Setup**:
   - Go to **Build > Firestore Database**.
   - Click **Create Database** (Production Mode).
   - Choose a location closest to your target audience.
5. **Security Rules**:
   - Copy the contents of `firestore.rules` from this project.
   - Paste them into the **Rules** tab of your Firestore Database.
   - **Crucial**: Manually change the email `baliadventours@gmail.com` in the `isAdmin` function of the rules to YOUR own admin email.
6. **Get Config**:
   - Click the gear icon (Project Settings).
   - Click the `</>` icon (Web App) to register your app.
   - Copy the `firebaseConfig` object values.

---

## Step 4: Deploy to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New > Project** and import your GitHub repository.
3. **Environment Variables**: Add these in the Vercel project settings:

   | Key | Value Source |
   |-----|--------------|
   | `VITE_FIREBASE_API_KEY` | Firebase Config `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Config `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase Config `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Config `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Config `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | Firebase Config `appId` |
   | `VITE_ADMIN_EMAIL` | YOUR intended admin email (e.g. `yourname@gmail.com`) |
   | `PRIMARY_ADMIN_EMAIL` | Same as above (used by backend) |
   | `VITE_IMGBB_API_KEY` | From [ImgBB](https://api.imgbb.com/) |
   | `RESEND_API_KEY` | From [Resend](https://resend.com) (Recommended) |

4. **Deploy**: Click **Deploy**.

---

## Step 5: Post-Deployment Setup (Critical)

### 1. Authorize Redirect URI
- In **Firebase Console > Authentication > Settings**, add your Vercel URL (e.g., `myapp.vercel.app`) to **Authorized Domains**.

### 2. Seed Sample Data (Optional but Recommended)
If you want to quickly see how the site looks with real content (Tours, Blogs, Reviews, Categories), follow these steps right after your first login:
1. Navigate to the **Admin Dashboard**.
2. Go to the **Settings** tab.
3. Scroll down to the **Maintenance & Setup** section.
4. Click **Seed Sample Database**.
5. Wait for the success message and refresh your browser. This will populate all collections with high-quality sample data.

### 3. Boostrap the Admin
The system is designed to automatically promote the **very first user** who registers to `admin` role. 
1. Open your live site.
2. Click **Login > Sign Up**.
3. Create an account with your desired admin email.
4. If you are the first user in the database, you will automatically get Admin access.
5. Alternatively, once you log in, you can go to the Firebase Console, go to the `users` collection, find your user ID, and change `role` from `customer` to `admin`.

### 4. Configure Site Settings
1. Log in and go to the **Admin Dashboard** (accessible via the profile menu).
2. Go to the **Settings** tab.
3. Ensure **Resend** is selected as the provider.
4. Enter your Resend API Key (if not set in Env Vars).
5. Verify your **Sender Email** matches a domain you have verified in your Resend account.
6. Test the connection using the **Email Connection Tester**.

---

## Step 6: External Integrations Setup

To enable fully functional payments, email notifications, and image uploads, you need to configure the following services:

### 1. PayPal (Payments)
To accept credit cards and PayPal payments:
1. Go to the [PayPal Developer Portal](https://developer.paypal.com/).
2. Create an **App** in either Sandbox (testing) or Live mode.
3. Copy your **Client ID**.
4. In your application, navigate to **Admin > Settings > Payment**.
5. Paste your **PayPal Client ID** and ensure "Enable PayPal" is toggled on.
6. For testing, use a PayPal Sandbox Buyer account.

### 2. Resend (Email Service)
The platform uses Resend to send professional booking confirmations and admin notifications.
1. Create a free account at [resend.com](https://resend.com).
2. Generate an **API Key**.
3. Verify your domain in the Resend dashboard to send emails from your own domain (e.g., `info@yourdomain.com`).
4. In your project environment variables (or Vercel), set `RESEND_API_KEY`.
5. Alternatively, you can configure these directly in the **Admin > Settings > General/Communications** panel.

### 3. ImgBB (Image Uploads)
The Rich Text Editor and Tour Gallery management require a place to host images.
1. Sign up at [imgbb.com](https://imgbb.com/).
2. Go to the [API documentation page](https://api.imgbb.com/) to get your **API Key**.
3. In Vercel or your local `.env`, set: `VITE_IMGBB_API_KEY=your_key_here`.
4. This allows the Admin panel to handle drag-and-drop image uploads seamlessly.

---

## 4. Admin User Guide

### Dynamic Itineraries
- Use the **Manage Tours** tab to add your trips. You can define multiple packages and pricing tiers (e.g. 1-2 people vs 3-5 people).

### Guide Management
- Add your local guides in the **Guides** tab.
- When you confirm a booking, click **Assign Guide**. This generates a WhatsApp template with the guest's details for easy communication.

### Content & SEO
- Use the **Blog** section to write tour guides.
- Use the **Settings > Static Pages** to edit your Terms and Conditions.

---
*DayTours - Professional Travel Management Solution.*
