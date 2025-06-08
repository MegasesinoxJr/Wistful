import { useEffect, useState } from "react";
import axiosInstancePublic, { SERVER_BASE_URL } from "../axiosInstancePublic";
import { useNavigate } from "react-router-dom";
export default function TopAnimes() {
  const [animes, setAnimes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  const navigate = useNavigate();

  // Debounce búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Obtener géneros
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axiosInstancePublic.get("generos/");
        setGenres(res.data);
      } catch (err) {
        console.error("Error al obtener géneros:", err);
      }
    };
    fetchGenres();
  }, []);

  // Fetch datos desde animes con filtros
  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const qs = [];
        qs.push(`page=${currentPage}`);
        if (debouncedSearch) {
          qs.push(`titulo=${encodeURIComponent(debouncedSearch)}`);
        }
        selectedGenres.forEach((id) => qs.push(`generos=${id}`));
        const url = `animes/?${qs.join("&")}`;

        const res = await axiosInstancePublic.get(url);
        setAnimes(res.data.results);
        setNextPage(res.data.next);
        setPrevPage(res.data.previous);
      } catch (err) {
        console.error("Error al obtener animes:", err);
      }
    };
    fetchAnimes();
  }, [currentPage, debouncedSearch, selectedGenres]);

  const handleClick = (animeId) => navigate(`/anime/${animeId}`);

  const toggleGenre = (id) => {
    setSelectedGenres((prev) => {
      const updated = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
      return updated;
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-24 sm:pt-32">
      {/* Buscador + Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar anime..."
          className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="relative">
          <button
            onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm text-gray-700 hover:bg-blue-50"
          >
            Filtrar por Género
          </button>
          {showGenreDropdown && (
            <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2 w-60">
              {genres.map((genre) => (
                <label key={genre.id} className="flex items-center mb-1 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => toggleGenre(genre.id)}
                    className="mr-2"
                  />
                  {genre.nombre}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex space-x-4 justify-center sm:justify-start">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={!prevPage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!nextPage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-6">Top Animes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {animes.map((anime) => (
          <div
            key={anime.id}
            className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
            onClick={() => handleClick(anime.id)}
          >
            <div className="relative">
              <img
                src={`${SERVER_BASE_URL}${anime.imagen}`}
                alt={anime.titulo}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                {anime.posicion}º
              </div>
            </div>
            <h3 className="text-xl font-semibold text-blue-500 mb-4 hover:underline">
              {anime.titulo}
            </h3>
            <p className="text-sm text-gray-700 mb-2 [display:-webkit-box] [overflow:hidden] [text-overflow:ellipsis] [-webkit-box-orient:vertical] [-webkit-line-clamp:7]">
              <strong>Sinopsis:</strong> {anime.sinopsis}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Puntuación promedio:</strong> {anime.puntuacion_promedio}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
