
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../Paginas/UserContext";

export default function ProtectedRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
