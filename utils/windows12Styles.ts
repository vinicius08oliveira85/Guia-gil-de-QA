/**
 * Utilitários de estilo para componentes Windows 12
 * Paleta "bold" com azuis/cyans/roxos mais vivos
 */

/**
 * Paleta de cores Windows 12 Bold
 */
export const win12Colors = {
  // Cores primárias vibrantes
  primary: {
    cyan: '#22D3EE',      // cyan-400
    blue: '#3B82F6',      // blue-500
    indigo: '#6366F1',    // indigo-500
    violet: '#8B5CF6',    // violet-500
    purple: '#A855F7',    // purple-500
    fuchsia: '#D946EF',   // fuchsia-500
  },
  // Gradientes Windows 12
  gradients: {
    primary: 'from-cyan-400 via-blue-500 to-indigo-600',
    accent: 'from-violet-500 via-purple-500 to-fuchsia-500',
    success: 'from-emerald-400 via-green-500 to-teal-500',
    warning: 'from-amber-400 via-orange-500 to-red-500',
    info: 'from-sky-400 via-blue-500 to-indigo-500',
    surface: 'from-slate-800/80 via-slate-900/90 to-slate-950/95',
    glow: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  },
  // Cores de status
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  // Cores de texto
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    muted: '#64748B',
  },
  // Cores de superfície
  surface: {
    base: 'rgba(15, 23, 42, 0.95)',
    elevated: 'rgba(30, 41, 59, 0.9)',
    overlay: 'rgba(51, 65, 85, 0.8)',
    border: 'rgba(148, 163, 184, 0.2)',
    borderHover: 'rgba(34, 211, 238, 0.4)',
  },
} as const;

/**
 * Gradientes pré-definidos para uso em componentes
 */
export const win12Gradients = {
  // Cards e superfícies
  cardPrimary: 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95',
  cardAccent: 'bg-gradient-to-br from-cyan-950/40 via-slate-900/95 to-indigo-950/40',
  cardGlow: 'bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5',
  
  // Botões
  buttonPrimary: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500',
  buttonAccent: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
  buttonSuccess: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  buttonDanger: 'bg-gradient-to-r from-rose-500 to-red-500',
  
  // Badges e chips
  badgeCyan: 'bg-gradient-to-r from-cyan-500/20 to-cyan-400/10',
  badgeViolet: 'bg-gradient-to-r from-violet-500/20 to-purple-400/10',
  badgeEmerald: 'bg-gradient-to-r from-emerald-500/20 to-green-400/10',
  badgeAmber: 'bg-gradient-to-r from-amber-500/20 to-orange-400/10',
  badgeRose: 'bg-gradient-to-r from-rose-500/20 to-red-400/10',
  
  // Overlays e halos
  glowCyan: 'shadow-[0_0_60px_rgba(34,211,238,0.3)]',
  glowViolet: 'shadow-[0_0_60px_rgba(139,92,246,0.3)]',
  glowEmerald: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]',
} as const;

export const windows12Styles = {
  /**
   * Classe base para cards com efeito glassmorphism Windows 12
   */
  card: 'mica rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl transition-all w-full max-w-full min-w-0 mobile-no-overflow bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95',
  
  /**
   * Card com borda de destaque cyan/violet
   */
  cardAccent: 'mica rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-500/10 backdrop-blur-xl transition-all w-full max-w-full min-w-0 mobile-no-overflow bg-gradient-to-br from-cyan-950/30 via-slate-900/95 to-violet-950/30',
  
  /**
   * Classe para cards com hover effect
   */
  cardHover: 'hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-400/40 hover:scale-[1.01] hover:-translate-y-0.5',
  
  /**
   * Classe para botões primários Windows 12 (cyan/blue/indigo)
   */
  buttonPrimary: `
    btn-pill btn-icon
    bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white
    border border-cyan-400/40
    shadow-lg shadow-cyan-500/30
    hover:shadow-xl hover:shadow-cyan-400/40 hover:-translate-y-0.5
    active:translate-y-0 active:shadow-md
    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
    transition-all duration-200
  `,
  
  /**
   * Classe para botões accent Windows 12 (violet/purple/fuchsia)
   */
  buttonAccent: `
    btn-pill btn-icon
    bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white
    border border-violet-400/40
    shadow-lg shadow-violet-500/30
    hover:shadow-xl hover:shadow-violet-400/40 hover:-translate-y-0.5
    active:translate-y-0 active:shadow-md
    disabled:opacity-60 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  
  /**
   * Classe para botões secundários Windows 12
   */
  buttonSecondary: `
    btn-pill btn-icon
    bg-slate-800/80 text-slate-200
    border border-slate-600/50
    hover:bg-slate-700/80 hover:border-cyan-500/30 hover:text-white hover:shadow-lg hover:-translate-y-0.5
    transition-all duration-200
  `,
  
  /**
   * Classe para botões ghost Windows 12
   */
  buttonGhost: `
    btn-pill btn-icon
    bg-transparent text-slate-300
    border border-transparent
    hover:bg-white/5 hover:border-white/10 hover:text-white
    transition-all duration-200
  `,
  
  /**
   * Classe para inputs Windows 12
   */
  input: `
    rounded-xl px-4 py-3
    bg-slate-900/80 border border-slate-700/50
    text-slate-100 placeholder:text-slate-500
    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
    hover:border-slate-600/60
    transition-all duration-200
    backdrop-blur-sm
  `,
  
  /**
   * Classe para badges de status com cores vibrantes
   */
  badge: (color: 'success' | 'warning' | 'error' | 'info' | 'accent' | 'cyan' | 'violet' | 'fuchsia' = 'accent') => {
    const colors = {
      success: 'bg-gradient-to-r from-emerald-500/20 to-green-400/10 text-emerald-300 border-emerald-500/30 shadow-emerald-500/20',
      warning: 'bg-gradient-to-r from-amber-500/20 to-orange-400/10 text-amber-300 border-amber-500/30 shadow-amber-500/20',
      error: 'bg-gradient-to-r from-rose-500/20 to-red-400/10 text-rose-300 border-rose-500/30 shadow-rose-500/20',
      info: 'bg-gradient-to-r from-sky-500/20 to-blue-400/10 text-sky-300 border-sky-500/30 shadow-sky-500/20',
      accent: 'bg-gradient-to-r from-cyan-500/20 to-blue-400/10 text-cyan-300 border-cyan-500/30 shadow-cyan-500/20',
      cyan: 'bg-gradient-to-r from-cyan-500/20 to-teal-400/10 text-cyan-300 border-cyan-500/30 shadow-cyan-500/20',
      violet: 'bg-gradient-to-r from-violet-500/20 to-purple-400/10 text-violet-300 border-violet-500/30 shadow-violet-500/20',
      fuchsia: 'bg-gradient-to-r from-fuchsia-500/20 to-pink-400/10 text-fuchsia-300 border-fuchsia-500/30 shadow-fuchsia-500/20',
    };
    return `px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${colors[color]}`;
  },
  
  /**
   * Classe para chips/tags pequenos
   */
  chip: (color: 'default' | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' = 'default') => {
    const colors = {
      default: 'bg-slate-800/60 text-slate-300 border-slate-600/40',
      cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    };
    return `px-2.5 py-1 rounded-lg border text-[11px] font-medium ${colors[color]}`;
  },
  
  /**
   * Classe para seções expansíveis
   */
  expandableSection: `
    rounded-2xl border border-slate-700/50 bg-slate-900/80
    backdrop-blur-sm
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
   * Classe para efeito glow Windows 12
   */
  glow: (color: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue' = 'cyan') => {
    const colors = {
      cyan: 'shadow-lg shadow-cyan-500/25',
      violet: 'shadow-lg shadow-violet-500/25',
      emerald: 'shadow-lg shadow-emerald-500/25',
      amber: 'shadow-lg shadow-amber-500/25',
      rose: 'shadow-lg shadow-rose-500/25',
      blue: 'shadow-lg shadow-blue-500/25',
    };
    return colors[color];
  },
  
  /**
   * Classe para halo de destaque
   */
  halo: (color: 'cyan' | 'violet' | 'emerald' = 'cyan') => {
    const colors = {
      cyan: 'ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-slate-900',
      violet: 'ring-2 ring-violet-500/30 ring-offset-2 ring-offset-slate-900',
      emerald: 'ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-slate-900',
    };
    return colors[color];
  },
  
  /**
   * Classe para grid responsivo
   */
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    compact: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    list: 'space-y-4'
  },
  
  /**
   * Espaçamentos padronizados
   */
  spacing: {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-7',
    xl: 'p-10'
  },
  
  /**
   * Bordas arredondadas Windows 12
   */
  rounded: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full'
  },
  
  /**
   * Transições suaves
   */
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
    all: 'transition-all duration-200 ease-out'
  },
  
  /**
   * Superfícies glassmorphism
   */
  surface: {
    base: 'bg-slate-900/90 backdrop-blur-xl border border-slate-700/50',
    elevated: 'bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 shadow-xl',
    overlay: 'bg-slate-900/95 backdrop-blur-2xl border border-slate-700/30',
    frosted: 'bg-white/5 backdrop-blur-xl border border-white/10',
  },
  
  /**
   * Estilos de texto
   */
  text: {
    gradient: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent',
    gradientAccent: 'bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent',
    primary: 'text-slate-100',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
    muted: 'text-slate-500',
  },
  
  /**
   * Divisores
   */
  divider: {
    horizontal: 'h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent',
    vertical: 'w-px bg-gradient-to-b from-transparent via-slate-600/50 to-transparent',
    glow: 'h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent',
  },
  
  /**
   * Ícones com glow
   */
  iconGlow: (color: 'cyan' | 'violet' | 'emerald' | 'amber' = 'cyan') => {
    const colors = {
      cyan: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      violet: 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]',
      emerald: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
      amber: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    };
    return colors[color];
  },
};

/**
 * Helper para combinar classes condicionalmente
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Helper para criar classes de risco com cores vibrantes
 */
export const getRiskStyle = (risk: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'): string => {
  const styles = {
    'Crítico': 'text-rose-300 bg-gradient-to-r from-rose-500/20 to-red-500/10 border-rose-500/40 shadow-rose-500/20',
    'Alto': 'text-orange-300 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/40 shadow-orange-500/20',
    'Médio': 'text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/40 shadow-amber-500/20',
    'Baixo': 'text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/40 shadow-emerald-500/20'
  };
  return `px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${styles[risk]}`;
};

/**
 * Helper para criar classes de status com cores vibrantes
 */
export const getStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    'Passed': 'text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/40',
    'Failed': 'text-rose-300 bg-gradient-to-r from-rose-500/20 to-red-500/10 border-rose-500/40',
    'Not Run': 'text-slate-400 bg-slate-700/30 border-slate-600/40',
    'Done': 'text-emerald-300 bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/40',
    'In Progress': 'text-cyan-300 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/40',
    'To Do': 'text-slate-400 bg-slate-700/30 border-slate-600/40',
    'Blocked': 'text-rose-300 bg-gradient-to-r from-rose-500/20 to-red-500/10 border-rose-500/40',
  };
  return `px-3 py-1.5 rounded-full border text-xs font-semibold ${styles[status] || 'text-slate-400 bg-slate-700/30 border-slate-600/40'}`;
};

/**
 * Helper para obter cor de progresso baseada no valor
 */
export const getProgressColor = (value: number): string => {
  if (value >= 80) return 'from-emerald-400 to-green-500';
  if (value >= 60) return 'from-cyan-400 to-blue-500';
  if (value >= 40) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-red-500';
};

/**
 * Helper para obter estilo de health score
 */
export const getHealthStyle = (score: number): { color: string; bg: string; glow: string } => {
  if (score >= 80) return {
    color: 'text-emerald-300',
    bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/10',
    glow: 'shadow-emerald-500/30',
  };
  if (score >= 60) return {
    color: 'text-cyan-300',
    bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10',
    glow: 'shadow-cyan-500/30',
  };
  if (score >= 40) return {
    color: 'text-amber-300',
    bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10',
    glow: 'shadow-amber-500/30',
  };
  return {
    color: 'text-rose-300',
    bg: 'bg-gradient-to-r from-rose-500/20 to-red-500/10',
    glow: 'shadow-rose-500/30',
  };
};
