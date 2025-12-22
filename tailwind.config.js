/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sprout: {
          bg: '#5EA866',      // 全体の背景色 (緑)
          card: '#FFFFFF',    // カードの白
          primary: '#5B5EF7', // ログインボタンなどの紫
          success: '#4CAF50', // 正解などの緑
          text: '#333333',    // 基本文字色
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
      
    },
  },
  plugins: [],
}