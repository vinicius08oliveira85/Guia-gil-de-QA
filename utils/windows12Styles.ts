/**
 * Utilitários de estilo para componentes Windows 12
 */

export const windows12Styles = {
  /**
   * Classe base para cards com efeito glassmorphism
   */
  card: 'mica rounded-xl border border-surface-border shadow-lg transition-all',
  
  /**
   * Classe para cards com hover effect
   */
  cardHover: 'hover:shadow-xl hover:border-accent/30 hover:scale-[1.01]',
  
  /**
   * Classe para botões primários Windows 12
   */
  buttonPrimary: `
    btn-pill btn-icon
    bg-gradient-to-r from-accent to-emerald-500 text-white
    border border-accent/40
    shadow-lg shadow-accent/30
    hover:shadow-xl hover:-translate-y-0.5
    active:translate-y-0
    disabled:opacity-60 disabled:cursor-not-allowed
  `,
  
  /**
   * Classe para botões secundários Windows 12
   */
  buttonSecondary: `
    btn-pill btn-icon
    bg-surface-hover text-text-primary
    border border-surface-border
    hover:bg-surface hover:shadow-lg hover:-translate-y-0.5
    transition-all duration-200
  `,
  
  /**
   * Classe para inputs Windows 12
   */
  input: `
    mica rounded-lg px-4 py-2
    bg-surface border border-surface-border
    text-text-primary
    focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
    transition-all duration-200
  `,
  
  /**
   * Classe para badges de status
   */
  badge: (color: 'success' | 'warning' | 'error' | 'info' | 'accent' = 'accent') => {
    const colors = {
      success: 'bg-green-400/20 text-green-400 border-green-400/30',
      warning: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
      error: 'bg-red-400/20 text-red-400 border-red-400/30',
      info: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
      accent: 'bg-accent/20 text-accent-light border-accent/30'
    };
    return `px-3 py-1 rounded-lg border text-xs font-semibold ${colors[color]}`;
  },
  
  /**
   * Classe para seções expansíveis
   */
  expandableSection: `
    mica rounded-xl border border-surface-border
    transition-all duration-300
  `,
  
  /**
   * Classe para animação de loading (pulse)
   */
  loadingPulse: 'animate-pulse',
  
  /**
   * Classe para animação de shimmer
   */
  shimmer: `
    relative overflow-hidden
    before:absolute before:inset-0
    before:-translate-x-full before:animate-shimmer
    before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
  `,
  
  /**
   * Classe para efeito glow
   */
  glow: (color: string = 'accent') => {
    const colors = {
      accent: 'shadow-lg shadow-accent/20',
      red: 'shadow-lg shadow-red-400/20',
      green: 'shadow-lg shadow-green-400/20',
      blue: 'shadow-lg shadow-blue-400/20',
      yellow: 'shadow-lg shadow-yellow-400/20'
    };
    return colors[color as keyof typeof colors] || colors.accent;
  },
  
  /**
   * Classe para grid responsivo
   */
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    compact: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    list: 'space-y-3'
  },
  
  /**
   * Espaçamentos padronizados
   */
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  },
  
  /**
   * Bordas arredondadas
   */
  rounded: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full'
  },
  
  /**
   * Transições suaves
   */
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    all: 'transition-all duration-200 ease-in-out'
  }
};

/**
 * Helper para combinar classes condicionalmente
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Helper para criar classes de risco
 */
export const getRiskStyle = (risk: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'): string => {
  const styles = {
    'Crítico': 'text-red-400 bg-red-400/20 border-red-400/30',
    'Alto': 'text-orange-400 bg-orange-400/20 border-orange-400/30',
    'Médio': 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30',
    'Baixo': 'text-green-400 bg-green-400/20 border-green-400/30'
  };
  return `px-3 py-1 rounded-lg border text-xs font-semibold ${styles[risk]}`;
};

/**
 * Helper para criar classes de status
 */
export const getStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    'Passed': 'text-green-400 bg-green-400/20 border-green-400/30',
    'Failed': 'text-red-400 bg-red-400/20 border-red-400/30',
    'Not Run': 'text-gray-400 bg-gray-400/20 border-gray-400/30',
    'Done': 'text-green-400 bg-green-400/20 border-green-400/30',
    'In Progress': 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30',
    'To Do': 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  };
  return `px-3 py-1 rounded-lg border text-xs font-semibold ${styles[status] || 'text-text-secondary bg-surface-hover border-surface-border'}`;
};

