import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import axiosInstancePublic, { SERVER_BASE_URL, WS_SERVER_BASE_URL, DEBUG } from "../axiosInstancePublic";

export default function PvpEnfrentamientos() {
  const [combatiente, setCombatiente] = useState(null);
  const [oponente, setOponente] = useState(null);
  const [estado, setEstado] = useState("idle");
  const [vidaCombatiente, setVidaCombatiente] = useState(100);
  const [vidaOponente, setVidaOponente] = useState(100);
  const [turno, setTurno] = useState("combatiente");
  const [ws, setWs] = useState(null);
  const [skillMessage, setSkillMessage] = useState("");
  const [mensajeFinal, setMensajeFinal] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); // Mensaje de desconexión por timeout
  const [animateAttacker, setAnimateAttacker] = useState(null);
  const [animateVictim, setAnimateVictim] = useState(null);

  // Estados para edición
  const [editMode, setEditMode] = useState(false);
  const [imagenNueva, setImagenNueva] = useState(null);
  const [habilidadesEdit, setHabilidadesEdit] = useState({
    habilidad_1: "",
    habilidad_2: "",
    habilidad_3: "",
    habilidad_4: ""
  });

  // Efecto para manejar timeout de espera en cola
  useEffect(() => {
    let timer;
    if (estado === "waiting") {
      timer = setTimeout(() => {
        setInfoMessage("Se te desconectó de la cola porque no hay jugadores haciendo matchmaking");
        if (ws) {
          ws.close();
          setWs(null);
        }
        setEstado("idle");
      }, 30000); // 30 segundos
    }
    return () => clearTimeout(timer);
  }, [estado, ws]);

  const fetchCombatiente = () => {
    axiosInstance.get('/combatiente/')
      .then(r => {
        setCombatiente(r.data);
        setHabilidadesEdit({
          habilidad_1: r.data.habilidad_1 || "",
          habilidad_2: r.data.habilidad_2 || "",
          habilidad_3: r.data.habilidad_3 || "",
          habilidad_4: r.data.habilidad_4 || "",
        });
        setImagenNueva(null);
      })
      .catch(() => setCombatiente(null));
  };

  useEffect(() => {
    fetchCombatiente();
  }, []);

  const iniciarPVP = () => {
    setInfoMessage("");
    setEstado("waiting");
    const socket = new WebSocket(`ws${!DEBUG ? "s" : ""}://${WS_SERVER_BASE_URL}/ws/pvp/`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "matchmake", userCombatiente: combatiente }));
    };

    socket.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.event === "start") {
        setOponente(msg.opponent);
        setEstado("battle");
      } else if (msg.event === "turn") {
        setVidaCombatiente(msg.vidaCombatiente);
        setVidaOponente(msg.vidaOponente);
        setTurno(msg.turn);
        const attacker = msg.turn === "combatiente" ? "combatiente" : "oponente";
        const victim = attacker === "combatiente" ? "oponente" : "combatiente";
        setAnimateAttacker(attacker);
        setAnimateVictim(victim);
        setTimeout(() => {
          setAnimateAttacker(null);
          setAnimateVictim(null);
        }, 500);
      } else if (msg.event === "end") {
        setMensajeFinal(`¡Combate terminado! Ganaste ${msg.experiencia} de experiencia.`);
        setTimeout(() => setMensajeFinal(""), 3000);
        setEstado("idle");
        setTurno("combatiente");
        setVidaCombatiente(100);
        setVidaOponente(100);
        setOponente(null);
        setSkillMessage("");
        fetchCombatiente();
      } else if (msg.event === "message") {
        setSkillMessage(msg.text);
      }
    };

    socket.onclose = () => {
      setWs(null);
    };

    setWs(socket);
  };

  const usarHabilidad = (habilidad) => {
    if (turno === "combatiente" && ws) {
      ws.send(JSON.stringify({ action: "use_skill", skill: habilidad }));
      setTurno("oponente");
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) fetchCombatiente();
  };

  const handleHabilidadChange = (e) => {
    const { name, value } = e.target;
    setHabilidadesEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagenNueva(e.target.files[0]);
    }
  };

  const guardarCambios = async () => {
    const formData = new FormData();
    formData.append("habilidad_1", habilidadesEdit.habilidad_1);
    formData.append("habilidad_2", habilidadesEdit.habilidad_2);
    formData.append("habilidad_3", habilidadesEdit.habilidad_3);
    formData.append("habilidad_4", habilidadesEdit.habilidad_4);
    if (imagenNueva) formData.append("imagen", imagenNueva);

    try {
      await axiosInstance.patch("/combatiente/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchCombatiente();
      setEditMode(false);
    } catch (error) { }
  };

  if (combatiente === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-lg text-gray-700">
          No tienes combatiente. <a href="/crear-combatiente" className="text-blue-600 underline">Créalo aquí</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 pt-24 px-4 relative">
      {mensajeFinal && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-2xl font-bold py-4 px-8 rounded-lg shadow-lg animate-pulse z-50">
          {mensajeFinal}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        ⚔️PVP⚔️
        <button
          onClick={toggleEditMode}
          title={editMode ? "Cancelar edición" : "Editar habilidades e imagen"}
          className="text-xl"
        >
          {editMode ? "❌" : "✏️"}
        </button>
      </h1>

      <style>{`
        @keyframes hit-attack {
          0% { transform: translateX(0); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0); }
        }
        @keyframes hit-hit {
          0% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
          100% { transform: translateX(0); }
        }
        .hit-attack { animation: hit-attack 0.5s ease-out; }
        .hit-hit { animation: hit-hit 0.5s ease-out; }
      `}</style>

      <div className="flex items-center space-x-8 mb-6 -mt-8">
        <div className="flex flex-col items-center relative pt-8" >
          <img
            src={imagenNueva ? URL.createObjectURL(imagenNueva) : `${combatiente.imagen}`}
            alt="Combatiente"
            className={`w-28 h-28 rounded-full shadow-md ${turno === "oponente" ? "animate-pulse" : ""} ${animateAttacker === "combatiente" ? "hit-attack" : ""} ${animateVictim === "oponente" ? "animate-pulse" : ""}`}
          />
          <div className="text-center font-semibold mt-2">{combatiente.nombre}</div>
        </div>

        {estado === "battle" && oponente && (
          <div className="flex flex-col items-center relative pt-8">
            <img
              src={`${oponente.imagen}`}
              alt="Oponente"
              className={`w-28 h-28 rounded-full shadow-md ${turno === "combatiente" ? "animate-pulse" : ""} ${animateAttacker === "oponente" ? "hit-attack" : ""} ${animateVictim === "combatiente" ? "animate-pulse" : ""}`}
            />
            <div className="text-center font-semibold mt-2">{oponente.nombre}</div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-center">

        <h2 className="text-2xl font-semibold mb-4">
          {combatiente.nombre} vs {oponente ? oponente.nombre : "¿?"}
        </h2>

        {editMode ? (
          <>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Editar Imagen:</label>
              <input type="file" accept=".webp,.png" onChange={handleImagenChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {["habilidad_1", "habilidad_2", "habilidad_3", "habilidad_4"].map((key) => (
                <div key={key}>
                  <label className="block mb-1 font-semibold capitalize">{key.replace("_", " ")}:</label>
                  <input
                    type="text"
                    name={key}
                    value={habilidadesEdit[key]}
                    onChange={handleHabilidadChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={guardarCambios}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
              >
                Guardar
              </button>
              <button
                onClick={toggleEditMode}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            {estado === "battle" && (
              <>
                <div className="flex flex-col md:flex-row gap-4 mb-8 w-full px-4">
                  {/* Combatiente */}
                  <div className="flex flex-col items-center md:flex-1 w-full">
                    <div className="w-full max-w-xs bg-gray-300 h-4 rounded mt-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(vidaCombatiente / combatiente.salud) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm mt-1">Vida: {vidaCombatiente}</div>
                    <div className="mt-2 text-gray-600">⚔️ Daño: {combatiente.damage}</div>
                  </div>

                  {/* Oponente */}
                  <div className="flex flex-col items-center md:flex-1 w-full">
                    <div className="w-full max-w-xs bg-gray-300 h-4 rounded mt-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(vidaOponente / oponente.salud) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm mt-1">Vida: {vidaOponente}</div>
                    <div className="mt-2 text-gray-600">⚔️ Daño: {oponente ? oponente.damage : 0}</div>
                  </div>
                </div>

                {skillMessage && (
                  <p className="italic text-sm text-blue-600 mt-2 skill-text">{skillMessage}</p>
                )}

                <div className="mb-6">
                  {turno === "combatiente" ? (
                    <div className="flex flex-wrap justify-center gap-4">
                      {["habilidad_1", "habilidad_2", "habilidad_3", "habilidad_4"].map((key) => (
                        <button
                          key={key}
                          onClick={() => usarHabilidad(combatiente[key])}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
                        >
                          {combatiente[key]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Esperando al oponente...</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {infoMessage && (
          <div className="w-full max-w-md mx-auto bg-yellow-200 text-yellow-800 border border-yellow-400 rounded-lg p-4 mb-4 text-center">
            {infoMessage}
          </div>
        )}
        <button
          onClick={iniciarPVP}
          disabled={estado !== "idle" || editMode}
          className={`py-2 px-6 rounded-lg font-semibold transition ${estado === "idle" && !editMode
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
        >

          {estado === "idle"
            ? "Entrar a PVP"
            : estado === "waiting"
              ? "Buscando oponente..."
              : "En combate"}
        </button>
      </div>

      <div className={`mt-8 grid ${estado === "battle" ? "grid-cols-2" : "grid-cols-1"} gap-6 w-full max-w-5xl`}>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Tus Estadísticas</h3>
          <div className="flex flex-col gap-2 text-gray-600">
            <div>📈 Nivel: {combatiente.nivel}</div>
            <div>❤️ Salud: {combatiente.salud}</div>
            <div>⚔️ Daño: {combatiente.damage}</div>
            <div>🏆 Trofeos: {combatiente.trofeos}</div>

            <div className="mt-2">
              <div className="flex items-center justify-center">
                <span>⚔️ Experiencia:</span>
                <div className="w-48 bg-gray-300 h-2 rounded mx-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${combatiente.experiencia}%` }}
                  />
                </div>
                <span className="text-sm">{combatiente.experiencia}/100</span>
              </div>
            </div>
          </div>
        </div>

        {estado === "battle" && oponente && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Estadísticas del Rival</h3>
            <div className="flex flex-col gap-2 text-gray-600">
              <div>📈 Nivel: {oponente.nivel}</div>
              <div>❤️ Salud: {oponente.salud}</div>
              <div>⚔️ Daño: {oponente.damage}</div>
              <div>🏆 Trofeos: {oponente.trofeos}</div>
              <div className="mt-2">
                <div className="flex items-center justify-center">
                  <span>⚔️ Experiencia:</span>
                  <div className="w-48 bg-gray-300 h-4 rounded mx-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-4"
                      style={{ width: `${oponente.experiencia || 0}%` }}
                    />
                  </div>
                  <span className="text-sm">{oponente.experiencia}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}