import React, { useEffect, useState } from "react";
import axiosInstanceInsignias from "../axiosInstanceFormularios";
import { SERVER_BASE_URL } from "../axiosInstancePublic";

const ListarFormularios = () => {
  const [formularios, setFormularios] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFormularios = async () => {
      try {
        const res = await axiosInstanceInsignias.get("formularios/");
        setFormularios(res.data);
      } catch (err) {
        console.error("Error fetching formularios:", err);
        setError("No se pudieron cargar los formularios.");
      }
    };

    fetchFormularios();
  }, []);

  return (
    <div className="container mx-auto p-4 pt-24"> 
      <h2 className="text-2xl font-semibold mb-4 text-center">Evento Insignias</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {formularios.map((formulario) => (
          <div
            key={formulario.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <a
              href={`/insignias/formularios/${formulario.id}`}
              className="block text-blue-600 hover:text-blue-800 font-semibold text-lg mb-2 text-center"
            >
              {formulario.titulo}
            </a>

            
            <div className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-300">
              <img
                src={`${SERVER_BASE_URL}${formulario.imagen}`}
                alt={formulario.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListarFormularios;
