import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';

export default function Top10Trofeos() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axiosInstance.get('/top10-trofeos/')
      .then(res => setList(res.data))
      .catch(err => console.error(err));
  }, []);

  const getBgClass = (index) => {
    switch (index) {
      case 0: return 'bg-yellow-200';   // Oro
      case 1: return 'bg-gray-200';     // Plata
      case 2: return 'bg-amber-200';    // Bronce
      default: return 'bg-blue-100';     // Resto
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">🏆 Top 10 Combatientes por Trofeos</h2>
      <div className="space-y-2">
        {list.map((c, i) => (
          <div
            key={c.id}
            className={`
              flex items-center justify-between p-3 rounded-lg
              ${ getBgClass(i) }
            `}
          >

            <img
              src={c.imagen}
              alt={c.nombre}
              className="w-12 h-12 rounded-full object-cover"
            />

            <span className="flex-1 text-center font-medium">
              {c.nombre}
            </span>

            <span className="font-semibold">
              🏆 {c.trofeos}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
