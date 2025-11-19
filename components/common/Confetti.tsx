import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  duration?: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ show, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isVisible) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * duration,
    duration: Math.random() * 2000 + 1000,
    color: ['#00A859', '#00C96F', '#0066CC', '#0080FF', '#F59E0B'][Math.floor(Math.random() * 5)] // Cores saúde (verde e azul)
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            top: '-10px'
          }}
        />
      ))}
    </div>
  );
};

