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

  const isTop3 = (index) => index >= 0 && index <= 2;

  return (
    <>
      <style>{`
        /* Animación título */
        @keyframes titleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Animación slide in up */
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Animación shake terremoto */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }

        /* Animación borde animado para top3 */
        @keyframes borderMove {
          0% { border-color: rgba(255, 215, 0, 0.8); }
          50% { border-color: rgba(218, 165, 32, 1); }
          100% { border-color: rgba(255, 215, 0, 0.8); }
        }

        .title {
          animation: titleBounce 2s ease-in-out infinite;
          text-align: center;
          font-weight: 700;
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .slide-in-up {
          animation-name: slideInUp;
          animation-duration: 0.6s;
          animation-fill-mode: forwards;
          animation-timing-function: ease-out;
          opacity: 0;
        }

        .slide-shake {
          animation: slideInUp 0.6s ease-out forwards,
                     shake 0.6s ease-in-out 0.6s infinite;
          opacity: 0;
        }

        .animated-border {
          border: 3px solid;
          border-radius: 12px;
          animation: borderMove 2.5s ease-in-out infinite;
        }

        /* Diferentes colores de borde para top1, top2, top3 */
        .border-top1 {
          border-color: rgba(255, 215, 0, 0.9);
          animation-name: borderMove;
        }
        .border-top2 {
          border-color: rgba(192,192,192,0.9);
          animation-name: borderMove;
        }
        .border-top3 {
          border-color: rgba(205,127,50,0.9);
          animation-name: borderMove;
        }
      `}</style>

      <div className="max-w-3xl mx-auto p-4">
        <h2 className="title">🏆 Top 10 Combatientes por Trofeos</h2>
        <div className="space-y-3">
          {list.map((c, i) => {
            let borderClass = '';
            if (i === 0) borderClass = 'border-top1 animated-border';
            else if (i === 1) borderClass = 'border-top2 animated-border';
            else if (i === 2) borderClass = 'border-top3 animated-border';

            return (
              <div
                key={c.id}
                className={`
                  relative flex items-center justify-between p-4 rounded-xl shadow-lg
                  ${getBgClass(i)}
                  ${isTop3(i) ? 'slide-shake' : 'slide-in-up'}
                  ${isTop3(i) ? borderClass : ''}
                `}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <img
                  src={c.imagen}
                  alt={c.nombre}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
                <span className="flex-1 text-center font-medium text-lg select-none">
                  {c.nombre}
                </span>
                <span className="font-semibold text-lg select-none">
                  🏆 {c.trofeos}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
