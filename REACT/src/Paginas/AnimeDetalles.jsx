import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstancePublic, { SERVER_BASE_URL } from "../axiosInstancePublic";
import axiosInstance from "../axiosInstance";
import ValorarAnime from "./ValorarAnime";
import { useUser } from "../Paginas/UserContext";

export default function AnimeDetalles() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [sinopsis, setSinopsis] = useState("");
  const [generosDisponibles, setGenerosDisponibles] = useState([]);
  const [generosSeleccionados, setGenerosSeleccionados] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { user } = useUser();
  const isLogged = Boolean(localStorage.getItem("access_token"));
  const isCol = user?.role === "colaborador";
  const isAdmin = user?.role === "admin";
  const isRoot = user?.role === "root";
  const canEdit = isCol || isAdmin || isRoot;

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const res = await axiosInstancePublic.get(`animes/${id}/`);
        setAnime(res.data);
        setTitulo(res.data.titulo);
        setSinopsis(res.data.sinopsis);
        setGenerosSeleccionados(res.data.generos_ids || []);
      } catch (err) {
        console.error("Error al cargar detalle de anime:", err);
      }
    };

    const fetchGeneros = async () => {
      try {
        const res = await axiosInstancePublic.get("generos/");
        setGenerosDisponibles(res.data);
      } catch (err) {
        console.error("Error al obtener géneros:", err);
      }
    };

    fetchAnime();
    fetchGeneros();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`animes/${id}/`);
      navigate("/topAnimes");
    } catch (err) {
      console.error("Error al eliminar el anime:", err);
    }
  };

  const handleEditToggle = () => setEditMode(!editMode);

  const handleGeneroChange = (id) => {
    setGenerosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("sinopsis", sinopsis);
      generosSeleccionados.forEach((g) => formData.append("generos", g));
      if (selectedFile) {
        formData.append("imagen", selectedFile);
      }

      await axiosInstance.patch(`animes/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Recargar datos actualizados
      const res = await axiosInstancePublic.get(`animes/${id}/`);
      setAnime(res.data);
      setSelectedFile(null);
      setEditMode(false);
    } catch (err) {
      console.error("Error al guardar cambios:", err);
    }
  };

  if (!anime) return <p className="text-center text-lg">Cargando...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 mt-14 relative">
      {canEdit && (
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar anime"
        >
          ✕
        </button>
      )}

      {canEdit && (
        <button
          onClick={handleEditToggle}
          className="absolute top-4 right-14 text-2xl"
          title="Editar anime"
        >
          ✏️
        </button>
      )}

      {editMode ? (
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="text-3xl font-semibold text-center mt-12 mb-4 w-full border-b border-gray-400"
        />
      ) : (
        <h2 className="text-3xl font-semibold text-center mt-12 mb-4">
          {anime.titulo}
        </h2>
      )}

      <img
        src={
          selectedFile
            ? URL.createObjectURL(selectedFile)
            : `${SERVER_BASE_URL}${anime.imagen}`
        }
        alt={anime.titulo}
        className="w-72 h-auto object-cover mx-auto mb-4 rounded-lg shadow-lg"
      />

      {editMode && (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) setSelectedFile(file);
          }}
          className="block mx-auto mb-6"
        />
      )}

      <div className="text-lg font-medium mb-2">
        <strong>Sinopsis:</strong>{" "}
        {editMode ? (
          <textarea
            value={sinopsis}
            onChange={(e) => setSinopsis(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        ) : (
          <span>{anime.sinopsis}</span>
        )}
      </div>

      {editMode ? (
        <div className="mb-4">
          <strong className="block mb-2">Géneros:</strong>
          <div className="flex flex-wrap gap-4">
            {generosDisponibles.map((genero) => (
              <label key={genero.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generosSeleccionados.includes(genero.id)}
                  onChange={() => handleGeneroChange(genero.id)}
                />
                {genero.nombre}
              </label>
            ))}
          </div>
        </div>
      ) : (
        anime.generos?.length > 0 && (
          <p className="text-lg font-medium mb-2">
            <strong>Géneros:</strong> {anime.generos.join(", ")}
          </p>
        )
      )}

      <p className="text-lg font-medium mb-4">
        <strong>Puntuación promedio:</strong>{" "}
        {anime.puntuacion_promedio ?? "—"}
      </p>

      {editMode && (
        <button
          onClick={handleSave}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      )}

      {isLogged && !editMode && (
        <div className="mt-6">
          <ValorarAnime animeId={anime.id} />
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="mb-4 text-lg font-semibold">
              ¿Estás seguro de que quieres eliminar este anime?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={async () => {
                  await handleDelete();
                  setShowConfirmDelete(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
