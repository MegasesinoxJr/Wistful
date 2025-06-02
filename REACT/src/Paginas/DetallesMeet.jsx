import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "300px" };

export default function DetallesMeet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBR1j1rzVOBpHuNDfPuO65PoycVt02vuBU",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  console.log("Usuario desde localStorage:", user);
  const userId = user?.id;
  const userRole = user?.role; // Cambiado a "role"

  useEffect(() => {
    const fetchMeet = async () => {
      try {
        const res = await axiosInstance.get(`/meets/${id}/`);
        console.log("Meet cargada:", res.data);
        setMeet(res.data);
      } catch (e) {
        setError("No se pudo cargar la meet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeet();
  }, [id]);

  // Actualizar lógica con userRole correcto
  const puedeEliminar =
    meet &&
    (userId === meet.creador.id ||
      ["admin", "root", "colaborador"].includes(userRole));

  console.log({ userId, creadorId: meet?.creador?.id, userRole, puedeEliminar });

  const handleJoin = async () => {
    setJoining(true);
    try {
      await axiosInstance.post(`/meets/${id}/asistir/`);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
    } catch (e) {
      alert("No pudiste apuntarte a la meet");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await axiosInstance.post(`/meets/${id}/desapuntarse/`);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
    } catch (e) {
      alert("No pudiste desapuntarte de la meet");
    } finally {
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta meet?")) return;
    try {
      await axiosInstance.delete(`/meets/${id}/delete/`);  // <-- cambio aquí
      alert("Meet eliminada correctamente");
      navigate("/meets"); // redirige después de eliminar
    } catch (e) {
      alert("Error al eliminar la meet");
    }
  };

  if (loading) return <p className="text-center text-xl">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const isFull = meet.asistentes.length >= meet.max_participantes;
  const hasJoined = meet.asistentes.some((a) => {
    const id = a.miembro?.id ?? a.id;
    return id?.toString() === userId?.toString();
  });

  const isCreator = userId?.toString() === meet.creador.id?.toString();

  return (
    <div className="relative max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-12">
      {puedeEliminar && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar meet"
        >
          ✕
        </button>
      )}

      <h2 className="text-3xl font-bold text-center mb-4">{meet.titulo}</h2>
      <p className="text-gray-700 text-lg mb-4">{meet.descripcion}</p>
      <p className="text-gray-800 mb-4">
        <strong>Creador de la meet:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </p>
      <p className="text-gray-800 mb-4">
        <strong>Lugar:</strong> {meet.ubicacion}
      </p>

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: meet.latitud, lng: meet.longitud }}
          zoom={15}
        >
          <Marker position={{ lat: meet.latitud, lng: meet.longitud }} />
        </GoogleMap>
      )}

      <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
        Asistentes ({meet.asistentes.length}/{meet.max_participantes})
      </h3>
      <div className="flex flex-wrap gap-4 mb-6">
        {meet.asistentes.map((u, index) => {
          const miembro = u.miembro || u;
          return (
            <div key={miembro.id || index} className="text-center">
              <img
                src={miembro.imagen_perfil}
                alt={miembro.nombre}
                className="w-16 h-16 rounded-full mb-2 mx-auto"
              />
              <div className="text-sm text-gray-800">{miembro.nombre}</div>
            </div>
          );
        })}
      </div>

      {!hasJoined && !isFull && !isCreator && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
        >
          {joining ? "Apuntando..." : "Apuntarme"}
        </button>
      )}

      {hasJoined && (
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 mt-4"
        >
          {leaving ? "Desapuntando..." : "Desapuntarme"}
        </button>
      )}

      {isFull && !hasJoined && (
        <p className="text-red-500 text-center mt-4">Esta meet está completa.</p>
      )}

      {hasJoined && (
        <p className="text-green-500 text-center mt-4">¡Ya estás apuntado!</p>
      )}
    </div>
  );
}
