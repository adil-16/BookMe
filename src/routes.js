import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from './layouts/dashboard';
import SimpleLayout from './layouts/simple';
//
import BlogPage from './pages/BlogPage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import Page404 from './pages/Page404';
import ProductsPage from './pages/ProductsPage';
import DashboardAppPage from './pages/DashboardAppPage';
import AddUser from './pages/AddUser';
import AddCategory from './pages/AddCategory';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import AddCourse from './pages/AddCourse';
import Settings from './pages/Settings';
import CourseContent from './pages/CourseContent';
import AddAdmin from './pages/AddAdmin';
import ProviderPage from './pages/ProviderPage';
import Orders from './pages/Orders';
import PaymentRequests from './pages/PaymentRequests';
import LogoutRoute from './pages/LogoutRoute';
import ProtectedRoute from './Context/ProtectedRoute';
import Commission from './pages/Commission';
import PrivacyPolicy from './pages/PrivacyPolicy';

// ----------------------------------------------------------------------

export default function Router() {
  const routes = useRoutes([
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { element: <Navigate to="/dashboard/app" />, index: true },
        { path: 'app', element: <DashboardAppPage /> },
        { path: 'adduser', element: <AddUser /> },
        { path: 'addadmin', element: <AddAdmin /> },
        { path: 'category', element: <AddCategory /> },
        { path: 'services', element: <Services /> },
        { path: 'reviews', element: <Reviews /> },
        { path: 'addcourses/:DocId?', element: <AddCourse /> },
        { path: 'user', element: <UserPage /> },
        { path: 'provider', element: <ProviderPage /> },
        { path: 'orders', element: <Orders /> },
        { path: 'paymentRequests', element: <PaymentRequests /> },
        { path: 'settings', element: <Settings /> },
        { path: 'commission', element: <Commission /> },
        { path: 'logout', element: <LogoutRoute /> },
        { path: 'privacy', element: <PrivacyPolicy /> },
        { path: 'products', element: <ProductsPage /> },
        { path: 'couredetails', element: <CourseContent /> },
        // { path: 'blog', element: <BlogPage /> },
      ],
    },
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      element: <SimpleLayout />,
      children: [
        { element: <Navigate to="/dashboard/app" />, index: true },
        { path: '404', element: <Page404 /> },
        { path: '*', element: <Navigate to="/404" /> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
