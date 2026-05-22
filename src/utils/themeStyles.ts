/**
 * Professional theme utilities for smooth dark/light mode transitions
 * Use these utilities for consistent styling across the application
 */

export const themeClasses = {
  // Backgrounds
  bg: {
    primary: (isDark: boolean) => isDark ? 'bg-[#0F0F12]' : 'bg-white',
    secondary: (isDark: boolean) => isDark ? 'bg-[#1A1A24]' : 'bg-gray-50',
    tertiary: (isDark: boolean) => isDark ? 'bg-[#252532]' : 'bg-gray-100',
    hover: (isDark: boolean) => isDark ? 'hover:bg-[#2a2a35]' : 'hover:bg-gray-50',
  },

  // Text colors
  text: {
    primary: (isDark: boolean) => isDark ? 'text-white' : 'text-gray-900',
    secondary: (isDark: boolean) => isDark ? 'text-gray-400' : 'text-gray-600',
    tertiary: (isDark: boolean) => isDark ? 'text-gray-500' : 'text-gray-500',
    muted: (isDark: boolean) => isDark ? 'text-gray-600' : 'text-gray-400',
  },

  // Borders
  border: {
    primary: (isDark: boolean) => isDark ? 'border-gray-700' : 'border-gray-200',
    secondary: (isDark: boolean) => isDark ? 'border-gray-600' : 'border-gray-300',
    accent: (isDark: boolean) => isDark ? 'border-indigo-500/30' : 'border-indigo-300',
  },

  // Cards
  card: (isDark: boolean) => 
    `rounded-lg transition-all duration-300 ${
      isDark 
        ? 'bg-[#252532] border border-gray-700 hover:border-indigo-500/50 shadow-lg shadow-black/20' 
        : 'bg-white border border-gray-200 hover:border-indigo-400 shadow-md'
    }`,

  // Buttons
  button: {
    primary: (isDark: boolean) =>
      `px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/50'
          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-400/50'
      }`,
    
    secondary: (isDark: boolean) =>
      `px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isDark
          ? 'bg-[#374151] text-gray-300 hover:bg-[#4b5563]'
          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
      }`,
    
    ghost: (isDark: boolean) =>
      `px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isDark
          ? 'text-gray-400 hover:text-white hover:bg-white/5'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`,
  },

  // Inputs
  input: (isDark: boolean) =>
    `w-full px-4 py-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 ${
      isDark
        ? 'bg-[#252532] border border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500'
        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-400'
    }`,

  // Badges
  badge: {
    primary: (isDark: boolean) =>
      `inline-block px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
        isDark
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'bg-indigo-100 text-indigo-700'
      }`,
    
    success: (isDark: boolean) =>
      `inline-block px-3 py-1 rounded-full text-sm font-medium ${
        isDark
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-emerald-100 text-emerald-700'
      }`,
  },

  // Gradients
  gradient: {
    heading: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent',
    shimmer: (isDark: boolean) =>
      isDark
        ? 'bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent'
        : 'bg-gradient-to-r from-indigo-100/20 via-purple-100/10 to-transparent',
  },
};

// Animation keyframes
export const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulse-soft {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
    }
  }
`;

// Helper function to get theme-aware inline style animation
export const getAnimationStyle = (
  animationName: string,
  duration: string = '0.6s',
  delay: string = '0s',
  easing: string = 'ease-out'
) => ({
  animation: `${animationName} ${duration} ${easing} ${delay} both`,
});

// Theme transition utility
export const transitionClasses = 'transition-colors transition-all duration-300 ease-in-out';

// Smooth color transitions for theme switching
export const getSmoothThemeColor = (
  lightColor: string,
  darkColor: string,
  isDark: boolean
) => {
  return `${isDark ? darkColor : lightColor} ${transitionClasses}`;
};
