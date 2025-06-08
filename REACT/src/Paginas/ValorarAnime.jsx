import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

export default function ValorarAnime({ animeId }) {
    const [puntuacion, setPuntuacion] = useState(1);
    const [mensaje, setMensaje] = useState("");
    const [mostrarMensaje, setMostrarMensaje] = useState(false);

    const puntuaciones = [
        "🤢 Horrible", "😞 Muy malo", "😒 Malo", "😐 Mediocre", "🙂 Suficiente",
        "😊 Bien", "😌 Notable", "😃 Muy Bueno", "😍 Maravilloso", "🤩 Obra maestra"
    ];

    useEffect(() => {
        const fetchValoracion = async () => {
            try {
                const token = localStorage.getItem("access_token");
                axiosInstance.defaults.headers["Authorization"] = `Bearer ${token}`;
                const res = await axiosInstance.get(`animes/${animeId}/valoracion/`);
                if (res.data.puntuacion) {
                    setPuntuacion(res.data.puntuacion);
                }
            } catch (err) {
                // Si no hay valoración, no hacemos nada (404 es esperado)
                if (err.response?.status !== 404) {
                    console.error("Error al cargar valoración:", err);
                }
            }
        };

        fetchValoracion();
    }, [animeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            axiosInstance.defaults.headers["Authorization"] = `Bearer ${token}`;

            await axiosInstance.post(`animes/${animeId}/valorar/`, { puntuacion });

            setMensaje("¡Valoración enviada!");
            setMostrarMensaje(true);
            setTimeout(() => setMostrarMensaje(false), 3000);
        } catch (err) {
            console.error(err);
            setMensaje("Error al enviar valoración.");
            setMostrarMensaje(true);
            setTimeout(() => setMostrarMensaje(false), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
            <label className="block text-sm font-medium mb-2">Puntuar este anime:</label>

            <div className="relative">
                <select
                    value={puntuacion}
                    onChange={(e) => setPuntuacion(Number(e.target.value))}
                    required
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="opciones"
                >
                    {Array.from({ length: 10 }, (_, index) => (
                        <option key={index} value={index + 1}>
                            {index + 1}
                        </option>
                    ))}
                </select>

                <label htmlFor="opciones" className="absolute h-full top-0 right-0 flex items-center pr-5 text-sm text-gray-600">
                    <p className="flex items-center justify-center">
                        {puntuaciones[puntuacion - 1]}
                    </p>
                </label>
            </div>

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
