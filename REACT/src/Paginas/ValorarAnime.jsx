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
    const [mostrarOpciones, setMostrarOpciones] = useState(false);

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

            <div className="relative w-full">
    <button
        type="button"
        onClick={() => setMostrarOpciones((prev) => !prev)}
        className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
        {puntuacion}. {puntuaciones[puntuacion - 1]}
    </button>

    {mostrarOpciones && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {puntuaciones.map((texto, index) => (
                <li
                    key={index}
                    onClick={() => {
                        setPuntuacion(index + 1);
                        setMostrarOpciones(false);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                >
                    {index + 1}. {texto}
                </li>
            ))}
        </ul>
    )}
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
