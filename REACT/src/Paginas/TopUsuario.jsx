import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import axiosInstancePublic, { SERVER_BASE_URL } from "../axiosInstancePublic";

export default function TopUsuario() {
  const { userId } = useParams();
  const [animes, setAnimes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsuario = async () => {
      const token = localStorage.getItem("access_token");

      try {
        const res = await axiosInstance.get(`/top-usuario/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAnimes(res.data);

        const userRes = await axiosInstance.get(`/usuarios/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNombre(userRes.data.nombre);

        setLoading(false);
      } catch (error) {
        console.error("Error al obtener el top de usuario:", error);
        setLoading(false);
      }
    };

    fetchTopUsuario();
  }, [userId]);

  if (loading) {
    return <p className="text-center text-lg">Cargando...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mt-16">
      <h2 className="text-3xl font-semibold text-center mb-6">Top de {nombre || "usuario"}</h2>

      {animes.length === 0 && (
        <p className="text-center text-gray-600">No hay valoraciones aún.</p>
      )}

      {/* Cabecera */}
      <div className="flex flex-row justify-between md:justify-start md:grid grid-cols-12 font-semibold text-gray-600 px-2 mb-2">
        <div className="col-span-6 sm:col-span-7">Título</div>
        <div className="col-span-3 sm:col-span-2 text-center">Puntuación</div>
      </div>

      {/* Lista de animes */}
      <div className="space-y-4">
        {animes.map((anime, idx) => (
          <div
            key={anime.id}
            className="bg-white rounded-lg shadow-md p-3 flex flex-row justify-between md:grid grid-cols-12"
          >
            <div className="col-span-6 sm:col-span-7 flex flex-row gap-4">
              <div className="w-16 h-20 flex-shrink-0">
                <img
                  src={`${SERVER_BASE_URL}${anime.imagen}`}
                  alt={anime.titulo}
                  className="w-[64px] h-[80px] object-cover rounded-md"
                />
              </div>
              <div className="flex items-center max-w-full">
                <h3 className="text-lg font-medium text-gray-800 line-clamp-2 max-w-full">
                  #{idx + 1} {anime.titulo}
                </h3>
              </div>
            </div>
            <div className="text-lg font-semibold text-blue-600 min-w-[60px] col-span-3 sm:col-span-2 flex justify-center items-center">
              {anime.puntuacion_promedio}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
