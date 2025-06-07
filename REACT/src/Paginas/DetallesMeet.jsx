import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const mapContainerStyle = { width: "100%", height: "300px" };

export default function DetallesMeet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Ahora editando es boolean para editar todo junto
  const [editando, setEditando] = useState(false);

  // Valores editados con todos los campos que quieres editar
  const [valoresEditados, setValoresEditados] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
    fecha: "",
    hora: "",
    latitud: null,
    longitud: null,
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBR1j1rzVOBpHuNDfPuO65PoycVt02vuBU",
    libraries: ["places"],
  });

  const {
    ready,
    value,
    suggestions,
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete();

  const [mapCoords, setMapCoords] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    const fetchMeet = async () => {
      try {
        const res = await axiosInstance.get(`/meets/${id}/`);
        setMeet(res.data);
        setMapCoords({
          lat: res.data.latitud,
          lng: res.data.longitud,
        });
        setValoresEditados({
          titulo: res.data.titulo,
          descripcion: res.data.descripcion,
          ubicacion: res.data.ubicacion,
          fecha: res.data.fecha,
          hora: res.data.hora,
          latitud: res.data.latitud,
          longitud: res.data.longitud,
        });
        setValue(res.data.ubicacion);
      } catch (e) {
        setError("No se pudo cargar la meet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeet();
  }, [id, setValue]);

  const puedeEliminar =
    meet &&
    (userId === meet.creador.id ||
      ["admin", "root", "colaborador"].includes(userRole));

  const puedeEditar = puedeEliminar;

  const activarEdicion = () => {
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    // Restaurar valores a los originales de meet
    setValoresEditados({
      titulo: meet.titulo,
      descripcion: meet.descripcion,
      ubicacion: meet.ubicacion,
      fecha: meet.fecha,
      hora: meet.hora,
      latitud: meet.latitud,
      longitud: meet.longitud,
    });
    setValue(meet.ubicacion);
    setMapCoords({ lat: meet.latitud, lng: meet.longitud });
  };

  const onSelectUbicacion = async (address) => {
    setValue(address, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setMapCoords({ lat, lng });
      setValoresEditados((prev) => ({
        ...prev,
        ubicacion: address,
        latitud: lat,
        longitud: lng,
      }));
    } catch (error) {
      console.error("Error al obtener coordenadas", error);
    }
  };

  const guardarCambios = async () => {
    try {
      const payload = {
        titulo: valoresEditados.titulo,
        descripcion: valoresEditados.descripcion,
        ubicacion: valoresEditados.ubicacion,
        fecha: valoresEditados.fecha,
        hora: valoresEditados.hora,
        latitud: valoresEditados.latitud,
        longitud: valoresEditados.longitud,
      };

      await axiosInstance.put(`/meets/${id}/editar/`, payload);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
      setEditando(false);
    } catch (e) {
      alert("Error al guardar los cambios.");
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await axiosInstance.post(`/meets/${id}/asistir/`);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
    } catch (e) {
      alert("No pudiste apuntarte a la meet.");
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
      alert("No pudiste desapuntarte de la meet.");
    } finally {
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta meet?"))
      return;
    try {
      await axiosInstance.delete(`/meets/${id}/delete/`);
      alert("Meet eliminada correctamente.");
      navigate("/meets");
    } catch (e) {
      alert("Error al eliminar la meet.");
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
      {puedeEliminar && !editando && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar meet"
        >
          ✕
        </button>
      )}

      {puedeEditar && !editando && (
        <button
          onClick={activarEdicion}
          className="absolute top-4 right-16 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Editar meet"
        >
          ✏️
        </button>
      )}

      <h2 className="text-3xl font-bold text-center mb-4">
        {editando ? (
          <input
            value={valoresEditados.titulo}
            onChange={(e) =>
              setValoresEditados({ ...valoresEditados, titulo: e.target.value })
            }
            className="w-full border p-2 rounded"
          />
        ) : (
          meet.titulo
        )}
      </h2>

      <div className="mb-4">
        <strong>Descripción:</strong>
        {editando ? (
          <textarea
            value={valoresEditados.descripcion}
            onChange={(e) =>
              setValoresEditados({
                ...valoresEditados,
                descripcion: e.target.value,
              })
            }
            className="w-full border p-2 mt-1 rounded"
          />
        ) : (
          <p>{meet.descripcion}</p>
        )}
      </div>

      <div className="mb-4">
        <strong>Ubicación:</strong>
        {editando ? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              placeholder="Busca ubicación"
              className="border px-2 py-1 rounded w-full"
            />
            <ul className="border rounded bg-white max-h-32 overflow-y-auto">
              {suggestions.status === "OK" &&
                suggestions.data.map((s) => (
                  <li
                    key={s.place_id}
                    onClick={() => onSelectUbicacion(s.description)}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {s.description}
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p>{meet.ubicacion}</p>
        )}
      </div>

      <div className="mb-4">
        <strong>Fecha:</strong>
        {editando ? (
          <input
            type="date"
            value={valoresEditados.fecha}
            onChange={(e) =>
              setValoresEditados({ ...valoresEditados, fecha: e.target.value })
            }
            className="border p-1 rounded"
          />
        ) : (
          meet.fecha
        )}
      </div>

      <div className="mb-4">
        <strong>Hora:</strong>
        {editando ? (
          <input
            type="time"
            value={valoresEditados.hora}
            onChange={(e) =>
              setValoresEditados({ ...valoresEditados, hora: e.target.value })
            }
            className="border p-1 rounded"
          />
        ) : (
          meet.hora
        )}
      </div>

      <div className="mb-4">
        <strong>Mapa:</strong>
        {isLoaded && mapCoords && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCoords}
            zoom={15}
          >
            <Marker position={mapCoords} />
          </GoogleMap>
        )}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Creador:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </div>

      {editando && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={guardarCambios}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
          <button
            onClick={cancelarEdicion}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Botones apuntarse / desapuntarse */}

      {!editando && (
        <div className="mt-6 flex justify-center gap-4">
          {!hasJoined && !isFull && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {joining ? "Apuntando..." : "Apuntarse"}
            </button>
          )}

          {hasJoined && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              {leaving ? "Desapuntando..." : "Desapuntarse"}
            </button>
          )}
          {isFull && !hasJoined && (
            <p className="text-red-600 font-semibold">
              La meet está completa
            </p>
          )}
        </div>
      )}

      {/* Lista asistentes */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-2">Asistentes:</h3>
        <ul className="list-disc pl-6 max-h-48 overflow-y-auto">
          {meet.asistentes.map((a) => {
            const nombre = a.miembro?.nombre ?? a.nombre ?? "Desconocido";
            return <li key={a.id || a.miembro?.id}>{nombre}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
