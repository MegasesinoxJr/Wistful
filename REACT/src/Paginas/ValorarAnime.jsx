import { useState } from "react";
import axiosInstance from "../axiosInstance";  // Importa el axiosInstance

export default function ValorarAnime({ animeId }) {
    const [puntuacion, setPuntuacion] = useState(1);
    const [mensaje, setMensaje] = useState("");  // Estado para el mensaje
    const [mostrarMensaje, setMostrarMensaje] = useState(false);  // Estado para controlar la visibilidad del mensaje

    // Emojis correspondientes a las puntuaciones
    const puntuaciones = [
        "🤢 Horrible",
        "😞 Muy malo",
        "😒 Malo",
        "😐 Mediocre",
        "🙂 Suficiente",
        "😊 Bien",
        "😌 Notable",
        "😃 Muy Bueno",
        "😍 Maravilloso",
        "🤩 Obra maestra"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Obtener el access_token desde localStorage
            const token = localStorage.getItem("access_token");

            // Configurar el header Authorization con el token
            axiosInstance.defaults.headers["Authorization"] = `Bearer ${token}`;

            // Realizar la petición con axiosInstance
            await axiosInstance.post(`animes/${animeId}/valorar/`, {
                puntuacion,
            });

            // Mostrar mensaje de éxito
            setMensaje("¡Valoración enviada!");
            setMostrarMensaje(true);

            // Ocultar el mensaje después de 3 segundos
            setTimeout(() => {
                setMostrarMensaje(false);
            }, 3000);
        } catch (err) {
            console.error(err);
            setMensaje("Error al enviar valoración.");
            setMostrarMensaje(true);

            // Ocultar el mensaje después de 3 segundos
            setTimeout(() => {
                setMostrarMensaje(false);
            }, 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
            <label className="block text-sm font-medium mb-2">Puntuar este anime:</label>

            <div className="relative">
                <select
                    value={puntuacion}
                    onChange={(e) => setPuntuacion(e.target.value)}
                    required
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {Array.from({ length: 10 }, (_, index) => (
                        <option key={index} value={index + 1}>
                            {index + 1}
                        </option>
                    ))}
                </select>

                {/* Emoji con puntuación */}
                <div class="absolute h-full top-0 right-0 flex items-center pr-5 text-sm text-gray-600">
                    <p class="flex -translate-y-[1px] items-center justify-center">{puntuaciones[puntuacion - 1]}</p>
                </div>
            </div>

            {/* Puntuación */}
            <div className="text-center mt-2 text-xl font-semibold text-blue-600">
                <span className="bg-yellow-300 px-2 py-1 rounded-md text-lg font-bold">
                    {puntuacion}
                </span>
            </div>

            <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
            >
                Enviar valoración
            </button>

            {mensaje && mostrarMensaje && (
                <div className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center mt-4">
                    <p className="bg-white px-6 py-4 rounded-md text-lg text-center font-semibold shadow-lg border border-blue-500">
                        {mensaje}
                    </p>
                </div>
            )}
        </form>
    );
}
