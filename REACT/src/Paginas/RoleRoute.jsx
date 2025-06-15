// src/components/RoleRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../Paginas/UserContext";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;


  const role = user.role;
  const isMember = role === "miembro";
  const isVip = role === "vip";
  const isAdmin = role === "admin";
  const isRoot = role === "root";
  const isColaborador = role === "colaborador";


  const userRoles = [];
  if (isMember)       userRoles.push("miembro");
  if (isVip)          userRoles.push("vip");
  if (isColaborador)  userRoles.push("colaborador");
  if (isAdmin)        userRoles.push("admin");
  if (isRoot)         userRoles.push("root");


  const ok = userRoles.some(r => allowedRoles.includes(r));
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
