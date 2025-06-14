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
      case 2: return 'bg-[#cd7f32]';    // Bronce real
      default: return 'bg-blue-100';    // Resto
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        @keyframes borderMove {
          0% {
            border-image-slice: 1;
            border-image-source: linear-gradient(270deg, #ffd700, #b8860b);
            background-position: 0% 50%;
          }
          50% {
            border-image-source: linear-gradient(270deg, #b8860b, #ffd700);
            background-position: 100% 50%;
          }
          100% {
            border-image-source: linear-gradient(270deg, #ffd700, #b8860b);
            background-position: 0% 50%;
          }
        }
        .slide-up {
          animation: slideUp 0.5s ease forwards;
        }
        .shake {
          animation: shake 0.6s ease-in-out infinite;
        }
        .border-animated {
          border: 4px solid;
          border-image-slice: 1;
          border-image-source: linear-gradient(270deg, #ffd700, #b8860b);
          border-image-repeat: round;
          animation: borderMove 3s linear infinite;
          /* Para que el borde se anime y el fondo quede separado */
          background-clip: padding-box;
        }
      `}</style>

      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4 text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
          🏆 Top 10 Combatientes por Trofeos
        </h2>
        <div className="space-y-4">
          {list.map((c, i) => {
            const delay = 0.3 + i * 0.15; // para retrasar animación secuencial
            const baseClasses = `flex items-center justify-between p-3 rounded-lg ${getBgClass(i)} slide-up`;
            const style = { animationDelay: `${delay}s` };

            if (i < 3) {
              return (
                <div
                  key={c.id}
                  className={`${baseClasses} shake border-animated`}
                  style={style}
                >
                  <img
                    src={c.imagen}
                    alt={c.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="flex-1 text-center font-medium">{c.nombre}</span>
                  <span className="font-semibold">🏆 {c.trofeos}</span>
                </div>
              );
            }

            return (
              <div
                key={c.id}
                className={baseClasses}
                style={style}
              >
                <img
                  src={c.imagen}
                  alt={c.nombre}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="flex-1 text-center font-medium">{c.nombre}</span>
                <span className="font-semibold">🏆 {c.trofeos}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
