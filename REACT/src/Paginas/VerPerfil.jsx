import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance"; // importá tu instancia
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

export default function VerPerfil() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [imagenPerfil, setImagenPerfil] = useState("");
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axiosInstance.get(`usuarios/${userId}/`);
        setNombre(userRes.data.nombre);
        setEmail(userRes.data.email);
        setImagenPerfil(userRes.data.imagen_perfil);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  return (
    <div>
      <h1>Mi perfil</h1>
      <p>Nombre: {nombre}</p>
      <p>Email: {email}</p>
      {imagenPerfil && (
        <img
          src={`${SERVER_BASE_URL}${imagenPerfil}`}
          alt="Perfil"
          style={{ width: 150, height: 150, borderRadius: "50%" }}
        />
      )}
    </div>
  );
}
