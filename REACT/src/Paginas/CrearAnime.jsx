import { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "../axiosInstance";

export default function CrearAnime() {
    const [titulo, setTitulo] = useState("");
    const [sinopsis, setSinopsis] = useState("");
    const [imagen, setImagen] = useState(null);
    const [generos, setGeneros] = useState([]);
    const [selectedGeneros, setSelectedGeneros] = useState([]);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        axiosInstance.get("generos/")
            .then(res => setGeneros(res.data))
            .catch(err => console.error("Error cargando géneros", err));
    }, []);

    const handleGeneroChange = (e) => {
        const value = parseInt(e.target.value);
        setSelectedGeneros(prev =>
            prev.includes(value)
                ? prev.filter(id => id !== value)
                : [...prev, value]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("titulo", titulo);
        formData.append("sinopsis", sinopsis);
        if (imagen) formData.append("imagen", imagen);
        console.log(selectedGeneros);


        formData.append("generos", JSON.stringify(selectedGeneros));
        // selectedGeneros.forEach(id => formData.append("generos[]", id));

        try {
            await axiosInstance.post("animes/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setSuccess("¡Anime creado exitosamente!");
            setTitulo("");
            setSinopsis("");
            setImagen(null);
            setSelectedGeneros([]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row justify-center items-start min-h-screen bg-gray-100 p-8 gap-8 mt-12">
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Crear nuevo Anime</h2>

                {success && (
                    <p className="bg-green-100 text-green-800 p-3 rounded mb-6 text-center font-semibold">
                        {success}
                    </p>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="titulo">Título</label>
                    <input
                        id="titulo"
                        type="text"
                        placeholder="Título"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="sinopsis">Sinopsis</label>
                    <textarea
                        id="sinopsis"
                        placeholder="Sinopsis"
                        value={sinopsis}
                        onChange={(e) => setSinopsis(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        rows="4"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="imagen">Imagen</label>
                    <input
                        id="imagen"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImagen(e.target.files[0])}
                        required
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    />
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-2">Selecciona géneros:</p>
                    <div className="flex flex-wrap gap-4">
                        {generos.map((g) => (
                            <label key={g.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={g.id}
                                    checked={selectedGeneros.includes(g.id)}
                                    onChange={handleGeneroChange}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span className="text-gray-700">{g.nombre}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                    Crear Anime
                </button>
            </form>

            {/* Previsualización del anime */}
            <div className="w-full max-w-2xl mx-auto mt-8">
                <h2 className="text-2xl font-bold text-center mb-4">Simulación de anime</h2>

                {/* Imagen grande de la previsualización */}
                <div
                    className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
                >
                    {/* Número de ranking */}
                    <div className="absolute bottom-4 right-8 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                        1º {/* Esto es fijo porque es solo la simulación */}
                    </div>
                    <h3 className="text-xl font-semibold text-blue-500 mb-4 hover:underline">
                        {titulo || "Título del Anime"}
                    </h3>
                    <img
                        src={imagen ? URL.createObjectURL(imagen) : "https://via.placeholder.com/800x500"}
                        alt="Imagen del anime"
                        className="w-full h-96 object-cover rounded-lg mb-4"
                    />
                    <p className="text-sm text-gray-700 mb-2">
                        <strong>Sinopsis:</strong> {sinopsis || "Sinopsis del anime aquí."}
                    </p>
                    <p className="text-sm text-gray-600">
                        <strong>Puntuación promedio:</strong> -- {/* Sin puntuación aquí */}
                    </p>
                </div>
            </div>
        </div>
    );
}
