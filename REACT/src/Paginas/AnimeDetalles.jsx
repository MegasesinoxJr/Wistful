import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstancePublic, { SERVER_BASE_URL } from "../axiosInstancePublic";
import ValorarAnime from "./ValorarAnime";
import { useUser } from "../Paginas/UserContext"; // ✅ Importa el contexto de usuario
import axiosInstance from "../axiosInstance";

export default function AnimeDetalles() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const { user } = useUser(); // ✅ Obtiene el usuario

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const res = await axiosInstancePublic.get(`animes/${id}/`);
        setAnime(res.data);
      } catch (err) {
        console.error("Error al cargar detalle de anime:", err);
      }
    };
    fetchAnime();
  }, [id]);

  if (!anime) return <p className="text-center text-lg">Cargando...</p>;

  const isLogged = Boolean(localStorage.getItem("access_token"));
  const isCol = user?.role === "colaborador";
  const isAdmin = user?.role === "admin";
  const isRoot = user?.role === "root";
  const canDelete = isCol || isAdmin || isRoot; // ✅ Solo estos roles pueden eliminar

  // ✅ Función de eliminar
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este anime?")) {
      try {
        await axiosInstance.delete(`animes/${id}/`);
        alert("Anime eliminado correctamente.");
        navigate("/topAnimes"); // Redirige tras eliminar
      } catch (err) {
        console.error("Error al eliminar el anime:", err);
        alert("Hubo un error al eliminar el anime.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mt-14 relative">
      {/* ✅ Botón X de eliminar */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar anime"
        >
          ✕
        </button>
      )}

      <h2 className="text-3xl font-semibold text-center mt-12 mb-4">{anime.titulo}</h2>

      <img
        src={`${SERVER_BASE_URL}${anime.imagen}`}
        alt={anime.titulo}
        className="w-72 h-auto object-cover mx-auto mb-6 rounded-lg shadow-lg"
      />

      <p className="text-lg font-medium mb-2">
        <strong>Sinopsis:</strong> {anime.sinopsis}
      </p>

      {anime.generos?.length > 0 && (
        <p className="text-lg font-medium mb-2">
          <strong>Géneros:</strong> {anime.generos.join(", ")}
        </p>
      )}

      <p className="text-lg font-medium mb-4">
        <strong>Puntuación promedio:</strong> {anime.puntuacion_promedio ?? "—"}
      </p>

      {isLogged && (
        <div className="mt-6">
          <ValorarAnime animeId={anime.id} />
        </div>
      )}
    </div>
  );
}
