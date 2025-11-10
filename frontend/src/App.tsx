import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import CookieConsent from "react-cookie-consent";
import { loadAdsense } from "./utils/loadAdsense";

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/Home';
import BarcodeSearch from './pages/products/BarcodeSearch';
import ProductList from './pages/products/ProductList';
import ProductDetails from './pages/products/ProductDetails';
import AddProduct from './pages/products/AddProduct';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ScanHistory from './pages/ScanHistory';
import ShoppingLists from './pages/shopping/ShoppingLists';
import ShoppingListDetail from './pages/shopping/ShoppingListDetail';
import PendingProducts from './pages/admin/PendingProducts';
import FlaggedPrices from './pages/admin/FlaggedPrices';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email/:uid/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BarcodeSearch />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EditProfile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan-history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ScanHistory />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping-lists"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ShoppingLists />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping-lists/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ShoppingListDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/add"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AddProduct />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/pending-products"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PendingProducts />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/flagged-prices"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FlaggedPrices />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
