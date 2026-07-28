<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <script>
            (function () {
                const theme = localStorage.getItem('synkro-theme') || 'system';
                const resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                if (resolved === 'dark' || resolved === 'black') document.documentElement.classList.add('dark');
                if (resolved === 'black') document.documentElement.classList.add('theme-black');

                // Pick the matching favicon before first paint, same idea as
                // GitHub swapping its tab icon to the theme actually in use
                // (the app's own setting) instead of just the OS preference.
                const iconLink = document.querySelector('link[rel="icon"][data-theme-favicon]');
                if (iconLink) {
                    iconLink.setAttribute('href', resolved === 'light' ? '/favicon-light.svg' : '/favicon-dark.svg');
                }
            })();
        </script>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon: swapped between light/dark variants to match the app's resolved theme -->
        <link rel="icon" type="image/svg+xml" href="/favicon-light.svg" data-theme-favicon>
        <link rel="alternate icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&family=jetbrains-mono:500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
