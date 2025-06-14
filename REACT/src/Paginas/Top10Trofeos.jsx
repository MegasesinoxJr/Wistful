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
      case 0: return 'bg-yellow-200';
      case 1: return 'bg-gray-200';
      case 2: return 'bg-[#cd7f32]';
      default: return 'bg-blue-100';
    }
  };

  const getShakeClass = (index) => {
    return index < 3 ? 'shake' : '';
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-center relative">
      <h2 className="text-4xl font-extrabold mb-8 text-yellow-400 drop-shadow fade-in">
        🏆 Top 10 Combatientes por Trofeos
      </h2>

      <div className="space-y-4">
        {list.map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center justify-between p-4 rounded-xl shadow-md transition-all
            ${getBgClass(i)} ${getShakeClass(i)}`}
          >
            <img
              src={c.imagen}
              alt={c.nombre}
              className="w-12 h-12 rounded-full object-cover"
            />

            <span className="flex-1 text-center font-medium text-lg">
              {c.nombre}
            </span>

            <span className="font-semibold text-xl">
              🏆 {c.trofeos}
            </span>
          </div>
        ))}
      </div>

      {/* 🎨 Animaciones locales al componente */}
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
