import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { loaded } = useAuth();

  if (loaded) {
    if (!currentUser) {
      return <Navigate to="/login" />;
    } else {
      return children;
    }
  }
}
