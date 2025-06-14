import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { HomePage } from "./Paginas/HomePage";
import LoginPage from "./Paginas/LoginPage";
import { AboutPage } from "./Paginas/AboutPage";
import   { Navbar }  from "./Navbar";
import { UserProvider } from "./context/UserContext";

import TopAnimes from "./Paginas/TopAnimes";
import Register from "./Paginas/Register";
import ProfilePage from "./Paginas/ProfilePage";
import CrearAnime from "./Paginas/CrearAnime";
import ValorarAnime from "./Paginas/ValorarAnime";
import AnimeDetalles from "./Paginas/AnimeDetalles";
import TopUsuario from "./Paginas/TopUsuario";
import CrearFormulario from "./Paginas/FormularioInsignias";
import ListarFormularios from "./Paginas/ListarFormularios";
import ResponderFormulario from "./Paginas/ResponderFormulario";
import HazteVip from "./Paginas/HazteVip";
import Success from "./Paginas/Success";
import CrearMeet from "./Paginas/CrearMeet";
import ListaMeets from "./Paginas/ListaMeets";
import DetallesMeet from "./Paginas/DetallesMeet";
import PvpEnfrentamientos from "./Paginas/PvpEnfrentamientos";
import CrearCombatiente from "./Paginas/CrearCombatiente";
import BuscarUsuarios from "./Paginas/BuscarUsuarios";
import DetallesPerfil from "./Paginas/DetallesPerfil";
import ResetearPassword from "./Paginas/ResetearPassword";
import PasswordOlvidada from "./Paginas/PasswordOlvidada";
import ProtectedRoute from "./Paginas/ProtectedRoute";
import RoleRoute from "./Paginas/RoleRoute";
import EditarFormulario from "./Paginas/EditarFormulario";
import Top10Trofeos from "./Paginas/Top10Trofeos";

export const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserProvider>


      <Navbar />

      <hr className="mb-16" />

      <Routes>
        {/* pública */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<TopAnimes />} />
        <Route path="/topAnimes" element={<TopAnimes />} />
        <Route path="/anime/:id" element={<AnimeDetalles />}/>
        <Route path="/PasswordOlvidada" element={<PasswordOlvidada />} />
        <Route path="/ResetearPassword/:uid/:token" element={<ResetearPassword />} />  
        {/* miembro+ */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/top-usuario/:userId"
          element={
            <ProtectedRoute>
              <TopUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/formularios"
          element={
            <ProtectedRoute>
              <ListarFormularios />
            </ProtectedRoute>
          }
        />
        <Route path="/insignias/editar/:formularioId" element={<EditarFormulario />} />

        <Route path="/insignias/formularios/:id" element={<ProtectedRoute><ResponderFormulario /></ProtectedRoute>}/>
        <Route
          path="/detalles-meet"
          element={
            <ProtectedRoute>
              <DetallesMeet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listar-meets"
          element={
            <ProtectedRoute>
              <ListaMeets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meets/:id"
          element={
            <ProtectedRoute>
              <DetallesMeet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pvp"
          element={
            <ProtectedRoute>
              <PvpEnfrentamientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/PvP-top10"
          element={
            <ProtectedRoute>
              <Top10Trofeos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crear-combatiente"
          element={
            <ProtectedRoute>
              <CrearCombatiente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buscarUsuarios"
          element={
            <ProtectedRoute>
              <BuscarUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buscarUsuarios/:userId"
          element={
            <ProtectedRoute>
              <DetallesPerfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hazte-vip"
          element={
            <ProtectedRoute>
              <HazteVip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          }
        />

        {/* VIP+ */}
        <Route
          path="/crear-meet"
          element={
            <RoleRoute allowedRoles={["vip", "colaborador", "admin", "root"]}>
              <CrearMeet />
            </RoleRoute>
          }
        />

        {/* colaborador+ */}
        <Route
          path="/crearAnime"
          element={
            <RoleRoute allowedRoles={["colaborador", "admin", "root"]}>
              <CrearAnime />
            </RoleRoute>
          }
        />
        <Route
          path="/formulario/crearFormulario"
          element={
            <RoleRoute allowedRoles={["colaborador", "admin", "root"]}>
              <CrearFormulario />
            </RoleRoute>
          }
        />

        {/* admin+ */}
        <Route
          path="/valorarAnime"
          element={
            <RoleRoute allowedRoles={["admin", "root"]}>
              <ValorarAnime />
            </RoleRoute>
          }
        />

        {/* redirección */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
};
