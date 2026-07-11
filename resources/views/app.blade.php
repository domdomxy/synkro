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
            })();
        </script>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

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
