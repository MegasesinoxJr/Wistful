// src/Paginas/Success.jsx
import { useEffect, useState } from "react";
import { useUser } from "./UserContext";
import axiosInstance from "../axiosInstance";

const Success = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensajeFinal, setMensajeFinal] = useState(""); // Estado para el mensaje de éxito

  useEffect(() => {
    async function refreshProfile() {
      const token = localStorage.getItem("access_token");
      try {
        const res = await axiosInstance.get("profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Actualizamos contexto y localStorage
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setError("No se pudo cargar el perfil. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    refreshProfile();
  }, [setUser]);

  useEffect(() => {
    if (user?.role === "vip") {
      setMensajeFinal("🎉 ¡Ya eres VIP, disfruta de tus ventajas!");
      setTimeout(() => setMensajeFinal(""), 3000); // El mensaje se oculta después de 3 segundos
    }
  }, [user]);

  if (loading) return <p className="text-center">Cargando…</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="text-center mt-12">
      {/* Mensaje final que aparece cuando se es VIP */}
      {mensajeFinal && (
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white text-xl font-semibold py-4 px-8 rounded-lg shadow-lg z-50"
        >
          {mensajeFinal}
        </div>
      )}

      {user?.role === "vip" ? (
        <h1 className="text-2xl font-bold">🎉 ¡Ya eres VIP, disfruta de tus ventajas!</h1>
      ) : (
        <h1 className="text-2xl font-bold text-red-600">Ups… tu rol no se actualizó. Intenta recargar la página.</h1>
      )}
    </div>
  );
};

export default Success;
