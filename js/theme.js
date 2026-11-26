(function () {
            try {
                const savedTheme = localStorage.getItem('hadassa-theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    document.documentElement.dataset.theme = savedTheme;
                }
            } catch (error) {
                // Le thème sombre reste le thème par défaut.
            }
        })();
