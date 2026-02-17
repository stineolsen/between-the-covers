import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';
import Meetings from './pages/Meetings';
import ReadingHistory from './pages/ReadingHistory';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col animate-fadeIn">
              <Navbar />
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/new"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AddBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/edit"
              element={
                <ProtectedRoute adminOnly={true}>
                  <EditBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id"
              element={
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings"
              element={
                <ProtectedRoute>
                  <Meetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <ReadingHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Only Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
