/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tours from './pages/Tours';
import TourDetail from './pages/TourDetail';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import BookingSuccess from './pages/BookingSuccess';
import Contact from './pages/Contact';
import About from './pages/About';
import Destinations from './pages/Destinations';
import BlogArchive from './pages/BlogArchive';
import BlogPostDetail from './pages/BlogPostDetail';
import Auth from './pages/Auth';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import Overview from './pages/Dashboard/Overview';
import Bookings from './pages/Dashboard/Bookings';
import Wishlist from './pages/Dashboard/Wishlist';
import Profile from './pages/Dashboard/Profile';
import { SettingsProvider } from './lib/SettingsContext';
import GlobalPopup from './components/GlobalPopup';

export default function App() {
  return (
    <Router>
      <SettingsProvider>
        <ScrollToTop />
        <GlobalPopup />
        <div className="flex min-h-screen flex-col font-sans antialiased text-gray-900 bg-white">
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/customer" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Overview />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/" element={<><Header /><main className="flex-1 pt-[116px]"><Home /></main><Footer /></>} />
          <Route path="/tours" element={<><Header /><main className="flex-1 pt-[116px]"><Tours /></main><Footer /></>} />
          <Route path="/blog" element={<><Header /><main className="flex-1 pt-[116px]"><BlogArchive /></main><Footer /></>} />
          <Route path="/blog/:slug" element={<><Header /><main className="flex-1 pt-[116px]"><BlogPostDetail /></main><Footer /></>} />
          <Route path="/about" element={<><Header /><main className="flex-1 pt-[116px]"><About /></main><Footer /></>} />
          <Route path="/contact" element={<><Header /><main className="flex-1 pt-[116px]"><Contact /></main><Footer /></>} />
          <Route path="/destinations" element={<><Header /><main className="flex-1 pt-[116px]"><Destinations /></main><Footer /></>} />
          <Route path="/tour/:slug" element={<><Header /><main className="flex-1 pt-[116px]"><TourDetail /></main><Footer /></>} />
          <Route path="/checkout/:tourId" element={<><Header /><main className="flex-1 pt-[116px]"><Checkout /></main><Footer /></>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/booking-success/:id" element={<><Header /><main className="flex-1 pt-[116px]"><BookingSuccess /></main><Footer /></>} />
          <Route path="*" element={<><Header /><main className="flex-1 pt-[116px]"><Home /></main><Footer /></>} />
        </Routes>
      </div>
     </SettingsProvider>
    </Router>
  );
}
