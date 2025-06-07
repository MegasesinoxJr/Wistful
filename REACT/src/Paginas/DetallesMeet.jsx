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

  const [editando, setEditando] = useState({
    titulo: false,
    descripcion: false,
    ubicacion: false,
  });
  const [valoresEditados, setValoresEditados] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
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
      } catch (e) {
        setError("No se pudo cargar la meet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeet();
  }, [id]);

  const puedeEliminar =
    meet &&
    (userId === meet.creador.id ||
      ["admin", "root", "colaborador"].includes(userRole));

  const puedeEditar = puedeEliminar;

  const activarEdicion = (campo) => {
    setEditando((prev) => ({ ...prev, [campo]: true }));
    if (campo === "ubicacion") {
      setValue(meet.ubicacion);
    } else {
      setValoresEditados((prev) => ({ ...prev, [campo]: meet[campo] }));
    }
  };

  const cancelarEdicion = (campo) => {
    setEditando((prev) => ({ ...prev, [campo]: false }));
  };

  const guardarCambio = async (campo) => {
    try {
      const payload = {};
      if (campo === "ubicacion") {
        payload.ubicacion = value;
        payload.latitud = mapCoords.lat;
        payload.longitud = mapCoords.lng;
      } else {
        payload[campo] = valoresEditados[campo];
      }

      await axiosInstance.put(`/meets/${id}/editar/`, payload);
      const res = await axiosInstance.get(`/meets/${id}/`);
      setMeet(res.data);
      setEditando((prev) => ({ ...prev, [campo]: false }));
    } catch (e) {
      alert("Error al guardar los cambios.");
    }
  };

  const onSelectUbicacion = async (address) => {
    setValue(address, false);
    clearSuggestions();
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setMapCoords({ lat, lng });
  };

  const renderEditableCampo = (campo, label, tipo = "text", classes = "") => (
    <div className={`mb-4 ${classes}`}>
      <strong>{label}:</strong>{" "}
      {editando[campo] ? (
        <span className="flex flex-col gap-2 mt-2">
          {campo === "ubicacion" ? (
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
              {isLoaded && mapCoords && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCoords}
                  zoom={15}
                >
                  <Marker position={mapCoords} />
                </GoogleMap>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => guardarCambio(campo)}
                  title="Guardar"
                >
                  ✅
                </button>
                <button
                  onClick={() => cancelarEdicion(campo)}
                  title="Cancelar"
                >
                  ❌
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type={tipo}
                value={valoresEditados[campo]}
                onChange={(e) =>
                  setValoresEditados((prev) => ({
                    ...prev,
                    [campo]: e.target.value,
                  }))
                }
                className="border px-2 py-1 rounded w-full"
              />
              <button onClick={() => guardarCambio(campo)} title="Guardar">
                ✅
              </button>
              <button onClick={() => cancelarEdicion(campo)} title="Cancelar">
                ❌
              </button>
            </div>
          )}
        </span>
      ) : (
        <span className="flex items-center justify-between mt-1">
          <span>{meet[campo]}</span>
          {puedeEditar && (
            <button
              onClick={() => activarEdicion(campo)}
              title={`Editar ${label}`}
              className="ml-2"
            >
              ✏️
            </button>
          )}
        </span>
      )}
    </div>
  );

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
      {puedeEliminar && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center"
          title="Eliminar meet"
        >
          ✕
        </button>
      )}

      <h2 className="text-3xl font-bold text-center mb-4">
        {renderEditableCampo("titulo", "Título")}
      </h2>

      {renderEditableCampo("descripcion", "Descripción", "textarea")}
      {renderEditableCampo("ubicacion", "Ubicación")}

      <div className="text-gray-800 mb-4">
        <strong>Fecha:</strong> {meet.fecha}
      </div>
      <div className="text-gray-800 mb-4">
        <strong>Hora:</strong> {meet.hora}
      </div>

      <div className="text-gray-800 mb-4">
        <strong>Creador de la meet:</strong> {meet.creador.nombre}
        <img
          src={meet.creador.imagen_perfil}
          alt="Creador"
          className="w-16 h-16 rounded-full inline-block ml-2"
        />
      </div>

      {isLoaded && mapCoords && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCoords}
          zoom={15}
        >
          <Marker position={mapCoords} />
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
        <p className="text-red-500 text-center mt-4">
          Esta meet está completa.
        </p>
      )}

      {hasJoined && (
        <p className="text-green-500 text-center mt-4">
          ¡Ya estás apuntado!
        </p>
      )}
    </div>
  );
}
