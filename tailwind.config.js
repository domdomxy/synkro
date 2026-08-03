import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                gray: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                indigo: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
            },
            fontFamily: {
                sans: ['Figtree', 'sans-serif'],
            },
            keyframes: {
                'toast-drop-mobile': {
                    '0%': { transform: 'translateY(-150%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'toast-slide-desktop': {
                    '0%': { transform: 'translateX(110%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'toast-lift-mobile': {
                    '0%': { transform: 'translateY(0)', opacity: '1' },
                    '100%': { transform: 'translateY(-150%)', opacity: '0' },
                },
                'toast-slide-out-desktop': {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(110%)', opacity: '0' },
                },
            },
            animation: {
                'toast-drop-mobile': 'toast-drop-mobile 0.3s ease-out',
                'toast-slide-desktop': 'toast-slide-desktop 0.3s ease-out',
                'toast-lift-mobile': 'toast-lift-mobile 0.25s ease-in forwards',
                'toast-slide-out-desktop': 'toast-slide-out-desktop 0.25s ease-in forwards',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
