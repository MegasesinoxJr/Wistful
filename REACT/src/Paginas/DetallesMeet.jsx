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

  // Solo un flag global de edición
  const [editando, setEditando] = useState(false);

  // Valores para todos los campos que editamos
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
        setMapCoords({ lat: res.data.latitud, lng: res.data.longitud });
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
      } catch {
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

  const toggleEdicion = () => {
    if (editando) {
      // cancelar: restaurar valores
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
    }
    setEditando(!editando);
  };

  const onSelectUbicacion = async (address) => {
    setValue(address, false);
    clearSuggestions();
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setMapCoords({ lat, lng });
    setValoresEditados((prev) => ({
      ...prev,
      ubicacion: address,
      latitud: lat,
      longitud: lng,
    }));
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
    } catch {
      alert("Error al guardar los cambios.");
    }
  };

  if (loading) return <p className="text-center text-xl">Cargando...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const isFull = meet.asistentes.length >= meet.max_participantes;
  const hasJoined = meet.asistentes.some((a) => {
    const aid = a.miembro?.id ?? a.id;
    return aid?.toString() === userId?.toString();
  });
  const isCreator = userId?.toString() === meet.creador.id?.toString();

  return (
    <div className="relative max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-12">
      {/* Eliminar */}
      {puedeEliminar && (
        <button
          onClick={async () => {
            if (!window.confirm("¿Eliminar meet?")) return;
            try {
              await axiosInstance.delete(`/meets/${id}/delete/`);
              navigate("/meets");
            } catch {
              alert("Error al eliminar.");
            }
          }}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar"
        >
          ✕
        </button>
      )}

      {/* Editar */}
      {puedeEditar && (
        <button
          onClick={toggleEdicion}
          className="absolute top-4 right-16 text-xl"
          title={editando ? "Cancelar edición" : "Editar todo"}
        >
          {editando ? "❌" : "✏️"}
        </button>
      )}

      {/* Título */}
      <h2 className="text-3xl font-bold text-center mb-4">
        {editando ? (
          <input
            type="text"
            value={valoresEditados.titulo}
            onChange={(e) =>
              setValoresEditados((p) => ({ ...p, titulo: e.target.value }))
            }
            className="w-full border px-2 py-1 rounded"
          />
        ) : (
          meet.titulo
        )}
      </h2>

      {/* Descripción */}
      <div className="mb-4">
        <strong>Descripción:</strong>
        {editando ? (
          <textarea
            value={valoresEditados.descripcion}
            onChange={(e) =>
              setValoresEditados((p) => ({ ...p, descripcion: e.target.value }))
            }
            className="w-full border px-2 py-1 rounded mt-1"
            rows={3}
          />
        ) : (
          <p className="mt-1">{meet.descripcion}</p>
        )}
      </div>

      {/* Ubicación */}
      <div className="mb-4">
        <strong>Ubicación:</strong>
        {editando ? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              placeholder="Buscar dirección"
              className="w-full border px-2 py-1 rounded mt-1"
            />
            <ul className="border rounded bg-white max-h-32 overflow-auto mt-1">
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
          <p className="mt-1">{meet.ubicacion}</p>
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <strong>Fecha:</strong>{" "}
          {editando ? (
            <input
              type="date"
              value={valoresEditados.fecha}
              onChange={(e) =>
                setValoresEditados((p) => ({ ...p, fecha: e.target.value }))
              }
              className="border px-2 py-1 rounded mt-1 w-full"
            />
          ) : (
            meet.fecha
          )}
        </div>
        <div className="flex-1">
          <strong>Hora:</strong>{" "}
          {editando ? (
            <input
              type="time"
              value={valoresEditados.hora}
              onChange={(e) =>
                setValoresEditados((p) => ({ ...p, hora: e.target.value }))
              }
              className="border px-2 py-1 rounded mt-1 w-full"
            />
          ) : (
            meet.hora
          )}
        </div>
      </div>

      {/* Mapa */}
      {isLoaded && mapCoords && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCoords}
          zoom={15}
        >
          <Marker position={mapCoords} />
        </GoogleMap>
      )}

      {/* Guardar / Cancelar */}
      {editando && (
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={guardarCambios}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
          <button
            onClick={toggleEdicion}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Creador */}
      <div className="text-gray-800 mb-4 mt-6">
        <strong>Creador:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </div>

      {/* Asistentes */}
      <h3 className="text-2xl font-semibold mb-4">
        Asistentes ({meet.asistentes.length}/{meet.max_participantes})
      </h3>
      <div className="flex flex-wrap gap-4 mb-6">
        {meet.asistentes.map((u, idx) => {
          const m = u.miembro || u;
          return (
            <div
              key={m.id || idx}
              className="w-20 text-center flex flex-col items-center"
            >
              <img
                src={m.imagen_perfil}
                alt={m.nombre}
                className="w-16 h-16 rounded-full mb-1"
              />
              <span className="text-sm truncate">{m.nombre}</span>
            </div>
          );
        })}
      </div>

      {/* Botones Unirse/Salir */}
      {!isCreator && !hasJoined && !isFull && (
        <button
          onClick={async () => {
            setJoining(true);
            try {
              await axiosInstance.post(`/meets/${id}/asistir/`);
              const res = await axiosInstance.get(`/meets/${id}/`);
              setMeet(res.data);
            } catch {
              alert("No pudiste apuntarte.");
            } finally {
              setJoining(false);
            }
          }}
          disabled={joining}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {joining ? "Apuntando..." : "Apuntarme"}
        </button>
      )}

      {hasJoined && !isCreator && (
        <button
          onClick={async () => {
            setLeaving(true);
            try {
              await axiosInstance.post(`/meets/${id}/desapuntarse/`);
              const res = await axiosInstance.get(`/meets/${id}/`);
              setMeet(res.data);
            } catch {
              alert("No pudiste desapuntarte.");
            } finally {
              setLeaving(false);
            }
          }}
          disabled={leaving}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-400 mt-4"
        >
          {leaving ? "Desapuntando..." : "Desapuntarme"}
        </button>
      )}

      {isFull && !hasJoined && (
        <p className="text-red-500 text-center mt-4">
          Esta meet está completa.
        </p>
      )}
      {hasJoined && !isCreator && (
        <p className="text-green-500 text-center mt-4">¡Ya estás apuntado!</p>
      )}
    </div>
  );
}
