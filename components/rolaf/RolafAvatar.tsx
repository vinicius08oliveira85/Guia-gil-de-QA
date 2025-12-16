/**
 * Componente do avatar animado do Rolaf
 */

import React from 'react';
import { motion } from 'framer-motion';

export type RolafAvatarState = 'idle' | 'thinking' | 'talking' | 'excited';

interface RolafAvatarProps {
  state?: RolafAvatarState;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  imageSrc?: string; // Caminho para a imagem do Rolaf
}

/**
 * Componente SVG do Rolaf baseado na descrição fornecida
 * Fallback caso a imagem não esteja disponível
 */
const RolafSVG: React.FC<{ size: number }> = ({ size }) => {
  const scale = size / 200; // Tamanho base de referência
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {/* Cabeça - círculo branco texturizado */}
      <circle
        cx="100"
        cy="60"
        r="35"
        fill="#ffffff"
        stroke="#e0e0e0"
        strokeWidth="1"
        opacity="0.95"
      />
      
      {/* Rosto - olhos */}
      <circle cx="92" cy="55" r="3" fill="#000000" />
      <circle cx="108" cy="55" r="3" fill="#000000" />
      
      {/* Rosto - sobrancelhas */}
      <path
        d="M 88 50 Q 92 48 96 50"
        stroke="#0066cc"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 104 50 Q 108 48 112 50"
        stroke="#0066cc"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Rosto - sorriso */}
      <path
        d="M 88 62 Q 100 68 112 62"
        stroke="#0066cc"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Chapéu - base laranja/marrom */}
      <ellipse
        cx="100"
        cy="30"
        rx="25"
        ry="8"
        fill="#d2691e"
      />
      <rect
        x="85"
        y="25"
        width="30"
        height="10"
        rx="2"
        fill="#8b4513"
      />
      
      {/* Bloco de madeira no chapéu */}
      <rect
        x="90"
        y="20"
        width="20"
        height="8"
        rx="1"
        fill="#deb887"
      />
      
      {/* Caixa preta no topo */}
      <rect
        x="95"
        y="15"
        width="10"
        height="6"
        rx="1"
        fill="#000000"
      />
      
      {/* Texto no chapéu (simplificado) */}
      <text
        x="100"
        y="18"
        fontSize="6"
        fill="#ffffff"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        QA
      </text>
      
      {/* Torso - forma arredondada */}
      <ellipse
        cx="100"
        cy="110"
        rx="40"
        ry="50"
        fill="#ffffff"
        stroke="#e0e0e0"
        strokeWidth="1"
        opacity="0.95"
      />
      
      {/* Braços */}
      <line
        x1="65"
        y1="100"
        x2="45"
        y2="90"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="135"
        y1="100"
        x2="155"
        y2="90"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Mão esquerda com caneta */}
      <circle cx="45" cy="90" r="4" fill="#ffffff" />
      <line
        x1="42"
        y1="88"
        x2="38"
        y2="85"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="38" cy="85" r="2" fill="#ff0000" />
      
      {/* Mão direita com espátula */}
      <circle cx="155" cy="90" r="4" fill="#ffffff" />
      <rect
        x="152"
        y="88"
        width="6"
        height="4"
        rx="1"
        fill="#ffffff"
      />
      <rect
        x="154"
        y="90"
        width="2"
        height="2"
        fill="#000000"
      />
      
      {/* Shorts rosa */}
      <path
        d="M 75 130 Q 100 140 125 130 L 125 150 Q 100 160 75 150 Z"
        fill="#ff69b4"
        stroke="#ff1493"
        strokeWidth="1"
      />
      
      {/* Pernas */}
      <line
        x1="90"
        y1="150"
        x2="90"
        y2="175"
        stroke="#deb887"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="110"
        y1="150"
        x2="110"
        y2="175"
        stroke="#deb887"
        strokeWidth="5"
        strokeLinecap="round"
      />
      
      {/* Bandeja/base */}
      <rect
        x="50"
        y="175"
        width="100"
        height="8"
        rx="4"
        fill="#ffffff"
        stroke="#d0d0d0"
        strokeWidth="1"
      />
    </svg>
  );
};

export const RolafAvatar: React.FC<RolafAvatarProps> = ({
  state = 'idle',
  onClick,
  size = 'md',
  className = '',
  imageSrc = '/rolaf.png' // Caminho padrão para a imagem
}) => {
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160
  };

  const avatarSize = sizeMap[size];
  
  // Tenta carregar a imagem, se falhar usa o SVG
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  React.useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Animações baseadas no estado
  const animationVariants = {
    idle: {
      scale: 1,
      y: 0,
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut'
      }
    },
    thinking: {
      scale: [1, 1.05, 1],
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    talking: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    excited: {
      scale: [1, 1.2, 1],
      y: [0, -10, 0],
      rotate: [0, -10, 10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  // Usa imagem se disponível e carregada, senão usa SVG
  const useImage = imageSrc && !imageError && imageLoaded;

  return (
    <motion.div
      className={`inline-block cursor-pointer ${className}`}
      onClick={onClick}
      variants={animationVariants}
      animate={state}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      role="button"
      aria-label="Assistente virtual Rolaf"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {useImage ? (
        <img
          src={imageSrc}
          alt="Rolaf - Assistente Virtual de QA"
          width={avatarSize}
          height={avatarSize}
          className="object-contain"
          style={{ imageRendering: 'auto' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <RolafSVG size={avatarSize} />
      )}
    </motion.div>
  );
};

RolafAvatar.displayName = 'RolafAvatar';

