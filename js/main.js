(function() {
            'use strict';

            // ===== SPLASH SCREEN HADASSA =====
            const hadassaSplash = document.getElementById('hadassaSplash');
            if (hadassaSplash) {
                document.body.classList.add('splash-active');
                const splashStartedAt = performance.now();
                const closeSplash = () => {
                    const minimumDisplay = 1250;
                    const elapsed = performance.now() - splashStartedAt;
                    window.setTimeout(() => {
                        hadassaSplash.classList.add('is-leaving');
                        document.body.classList.remove('splash-active');
                        window.setTimeout(() => hadassaSplash.remove(), 800);
                    }, Math.max(0, minimumDisplay - elapsed));
                };
                if (document.readyState === 'complete') {
                    closeSplash();
                } else {
                    window.addEventListener('load', closeSplash, { once: true });
                }
                // Évite de bloquer l'accès au site si une ressource externe tarde à charger.
                window.setTimeout(() => {
                    if (hadassaSplash.isConnected && !hadassaSplash.classList.contains('is-leaving')) {
                        hadassaSplash.classList.add('is-leaving');
                        document.body.classList.remove('splash-active');
                        window.setTimeout(() => hadassaSplash.remove(), 800);
                    }
                }, 6500);
            }

            // ===== CURSEUR PERSONNALISÉ =====
            const cursorDot = document.getElementById('cursorDot');
            const cursorCircle = document.getElementById('cursorCircle');
            let mouseX = 0,
                mouseY = 0;
            let circleX = 0,
                circleY = 0;
            let isHoveringInteractive = false;

            const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
            const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (isDesktop) {
                document.addEventListener('mousemove', (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
                });

                function animateCursor() {
                    circleX += (mouseX - circleX) * 0.12;
                    circleY += (mouseY - circleY) * 0.12;
                    cursorCircle.style.transform = `translate(${circleX}px, ${circleY}px) translate(-50%, -50%)`;
                    requestAnimationFrame(animateCursor);
                }
                animateCursor();

                document.querySelectorAll('a, button, .btn, .portfolio-item, .service-card').forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        cursorCircle.classList.add('hovered');
                        isHoveringInteractive = true;
                    });
                    el.addEventListener('mouseleave', () => {
                        cursorCircle.classList.remove('hovered');
                        isHoveringInteractive = false;
                    });
                });
            } else {
                cursorDot.style.display = 'none';
                cursorCircle.style.display = 'none';
                document.body.classList.remove('custom-cursor');
            }

            // ===== THÈME CLAIR / SOMBRE =====
            const themeToggle = document.getElementById('themeToggle');
            const themeToggleIcon = document.getElementById('themeToggleIcon');
            const themeToggleText = document.getElementById('themeToggleText');

            function applyTheme(theme) {
                const isLight = theme === 'light';
                document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
                themeToggle.setAttribute('aria-pressed', String(isLight));
                themeToggle.setAttribute('aria-label', isLight ? 'Activer le mode sombre' : 'Activer le mode clair');
                themeToggleIcon.textContent = isLight ? '☾' : '☀';
                themeToggleText.textContent = isLight ? 'Sombre' : 'Clair';
                try {
                    localStorage.setItem('hadassa-theme', isLight ? 'light' : 'dark');
                } catch (error) {
                    // Le thème fonctionne même si le stockage du navigateur est désactivé.
                }
            }

            let savedTheme = 'dark';
            try {
                savedTheme = localStorage.getItem('hadassa-theme') || 'dark';
            } catch (error) {
                // Le thème sombre est utilisé par défaut.
            }
            applyTheme(savedTheme);
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.dataset.theme || 'dark';
                applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });

            // ===== HEADER SCROLL =====
            const header = document.getElementById('header');
            let lastScrollY = 0;
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                if (scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                lastScrollY = scrollY;
            }, { passive: true });

            // ===== MENU MOBILE =====
            const hamburger = document.getElementById('hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            const body = document.body;

            // ===== SÉLECTEUR DE LANGUE =====
            const languageText = {
                'HOME': { fr: 'ACCUEIL', en: 'HOME' },
                'ABOUT': { fr: 'ÀPROPOS', en: 'ABOUT' },
                'WORK': { fr: 'PROJETS', en: 'WORK' },
                'SERVICES': { fr: 'SERVICES', en: 'SERVICES' },
                'EVENTS': { fr: 'ÉVÉNEMENTS', en: 'EVENTS' },
                'CONTACT': { fr: 'CONTACT', en: 'CONTACT' },
                'BOOK HADASSA →': { fr: 'RÉSERVER HADASSA →', en: 'BOOK HADASSA →' },
                'DESIGNER • MC • CREATIVE': { fr: 'DESIGNER • MC • CRÉATIVE', en: 'DESIGNER • MC • CREATIVE' },
                'I CREATE.': { fr: 'JE CRÉE.', en: 'I CREATE.' },
                'I DESIGN.': { fr: 'JE DESIGNE.', en: 'I DESIGN.' },
                'I COMMAND THE ROOM.': { fr: 'JE CAPTE LA SALLE.', en: 'I COMMAND THE ROOM.' },
                '"I transform ideas into powerful visuals and events into unforgettable experiences."': { fr: '« Je transforme les idées en visuels puissants et les événements en expériences inoubliables. »', en: '"I transform ideas into powerful visuals and events into unforgettable experiences."' },
                'VIEW MY WORK': { fr: 'VOIR MES PROJETS', en: 'VIEW MY WORK' },
                'BOOK ME': { fr: 'ME RÉSERVER', en: 'BOOK ME' },
                'AVAILABLE FOR PROJECTS & EVENTS': { fr: 'DISPONIBLE POUR PROJETS & ÉVÉNEMENTS', en: 'AVAILABLE FOR PROJECTS & EVENTS' },
                'About': { fr: 'À propos', en: 'About' },
                'DESIGNER BY MIND.': { fr: 'DESIGNER PAR L’ESPRIT.', en: 'DESIGNER BY MIND.' },
                'MC BY ENERGY.': { fr: 'MC PAR L’ÉNERGIE.', en: 'MC BY ENERGY.' },
                'Une créative capable de passer de la création visuelle à l’animation d’événements avec la même intensité.': { fr: 'Une créative capable de passer de la création visuelle à l’animation d’événements avec la même intensité.', en: 'A creative mind moving from visual design to event hosting with the same intensity.' },
                'Graphic Design': { fr: 'Design graphique', en: 'Graphic Design' },
                'Branding': { fr: 'Identité de marque', en: 'Branding' },
                'Social Media Design': { fr: 'Design pour réseaux sociaux', en: 'Social Media Design' },
                'Visual Identity': { fr: 'Identité visuelle', en: 'Visual Identity' },
                'Posters & Flyers': { fr: 'Affiches & flyers', en: 'Posters & Flyers' },
                'Digital Design': { fr: 'Design digital', en: 'Digital Design' },
                'MC / EVENT HOST': { fr: 'MC / ANIMATRICE', en: 'MC / EVENT HOST' },
                'Corporate Events': { fr: 'Événements corporate', en: 'Corporate Events' },
                'Weddings': { fr: 'Mariages', en: 'Weddings' },
                'Conferences': { fr: 'Conférences', en: 'Conferences' },
                'Product Launches': { fr: 'Lancements de produits', en: 'Product Launches' },
                'Ceremonies': { fr: 'Cérémonies', en: 'Ceremonies' },
                'Entertainment & Live Events': { fr: 'Divertissement & événements live', en: 'Entertainment & Live Events' },
                'Services': { fr: 'Services', en: 'Services' },
                'WHAT I DO': { fr: 'CE QUE JE FAIS', en: 'WHAT I DO' },
                'Portfolio': { fr: 'Portfolio', en: 'Portfolio' },
                'SELECTED WORK': { fr: 'PROJETS SÉLECTIONNÉS', en: 'SELECTED WORK' },
                'VIEW PROJECT →': { fr: 'VOIR LE PROJET →', en: 'VIEW PROJECT →' },
                'MC / Events': { fr: 'MC / Événements', en: 'MC / Events' },
                'WHEN THE LIGHTS GO ON,': { fr: 'QUAND LES LUMIÈRES S’ALLUMENT,', en: 'WHEN THE LIGHTS GO ON,' },
                'I TAKE THE ROOM.': { fr: 'JE PRENDS LA SALLE.', en: 'I TAKE THE ROOM.' },
                'EVENTS': { fr: 'ÉVÉNEMENTS', en: 'EVENTS' },
                'PEOPLE': { fr: 'PERSONNES', en: 'PEOPLE' },
                'ENERGY': { fr: 'ÉNERGIE', en: 'ENERGY' },
                'BOOK HADASSA FOR YOUR EVENT': { fr: 'RÉSERVER HADASSA POUR VOTRE ÉVÉNEMENT', en: 'BOOK HADASSA FOR YOUR EVENT' },
                'Testimonials': { fr: 'Témoignages', en: 'Testimonials' },
                'THEY SAY IT BETTER.': { fr: 'ILS EN PARLENT MIEUX.', en: 'THEY SAY IT BETTER.' },
                'Process': { fr: 'Processus', en: 'Process' },
                'FROM IDEA TO IMPACT.': { fr: 'DE L’IDÉE À L’IMPACT.', en: 'FROM IDEA TO IMPACT.' },
                'DISCOVER': { fr: 'DÉCOUVRIR', en: 'DISCOVER' },
                'CREATE': { fr: 'CRÉER', en: 'CREATE' },
                'DELIVER': { fr: 'LIVRER', en: 'DELIVER' },
                'IMPACT': { fr: 'IMPACT', en: 'IMPACT' },
                'LET\'S CREATE': { fr: 'CRÉONS', en: "LET'S CREATE" },
                'SOMETHING': { fr: 'QUELQUE CHOSE', en: 'SOMETHING' },
                'UNFORGETTABLE.': { fr: 'D’INOUBLIABLE.', en: 'UNFORGETTABLE.' },
                'START A PROJECT': { fr: 'DÉMARRER UN PROJET', en: 'START A PROJECT' },
                'BOOK HADASSA': { fr: 'RÉSERVER HADASSA', en: 'BOOK HADASSA' },
                'Designer • MC • Creative': { fr: 'Designer • MC • Créative', en: 'Designer • MC • Creative' },
                'Designing visuals. Creating experiences.': { fr: 'Créer des visuels. Créer des expériences.', en: 'Designing visuals. Creating experiences.' }
            };

            function setLanguage(language) {
                document.querySelectorAll('body *').forEach(element => {
                    element.childNodes.forEach(node => {
                        if (node.nodeType !== Node.TEXT_NODE) return;
                        const currentText = node.textContent.trim();
                        const original = node.__hadassaTranslationKey || Object.keys(languageText).find(key =>
                            languageText[key].fr === currentText || languageText[key].en === currentText
                        );
                        const translation = original ? languageText[original][language] : null;
                        if (translation) {
                            node.__hadassaTranslationKey = original;
                            node.textContent = node.textContent.replace(currentText, translation);
                        }
                    });
                });
                document.documentElement.lang = language;
                document.querySelectorAll('[data-language]').forEach(button => {
                    button.classList.toggle('active', button.dataset.language === language);
                });
                try {
                    localStorage.setItem('hadassa-language', language);
                } catch (error) {
                    // Le site reste utilisable même si le stockage du navigateur est désactivé.
                }
            }

            document.querySelectorAll('[data-language]').forEach(button => {
                button.addEventListener('click', () => setLanguage(button.dataset.language));
            });
            let savedLanguage = 'fr';
            try {
                savedLanguage = localStorage.getItem('hadassa-language') || 'fr';
            } catch (error) {
                // Langue française par défaut si le stockage est indisponible.
            }
            setLanguage(savedLanguage);

            function toggleMenu() {
                hamburger.classList.toggle('active');
                mobileMenu.classList.toggle('open');
                body.classList.toggle('no-scroll');
                const expanded = hamburger.getAttribute('aria-expanded') === 'true' ? 'false' : 'true';
                hamburger.setAttribute('aria-expanded', expanded);
                mobileMenu.setAttribute('aria-hidden', expanded === 'true' ? 'false' : 'true');
            }

            hamburger.addEventListener('click', toggleMenu);

            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (mobileMenu.classList.contains('open')) {
                        toggleMenu();
                    }
                });
            });

            // Fermer le menu si clic en dehors
            document.addEventListener('click', (e) => {
                if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(
                        e.target)) {
                    toggleMenu();
                }
            });

            // ===== NAVIGATION ACTIVE + DÉFILEMENT AUTOMATIQUE =====
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-desktop a');
            const desktopNav = document.querySelector('.nav-desktop');
            let previousActiveLink = null;

            function updateActiveLink() {
                const scrollPos = window.scrollY + 150;
                let currentId = 'home';

                sections.forEach(section => {
                    if (scrollPos >= section.offsetTop) {
                        currentId = section.id;
                    }
                });

                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === '#' + currentId;
                    link.classList.toggle('active', isActive);

                    // Recentrer le lien actif dès que l'utilisateur change de section,
                    // aussi bien vers la gauche que vers la droite.
                    if (isActive && link !== previousActiveLink && desktopNav) {
                        const navBounds = desktopNav.getBoundingClientRect();
                        const linkBounds = link.getBoundingClientRect();
                        const targetLeft = desktopNav.scrollLeft
                            + (linkBounds.left - navBounds.left)
                            - (desktopNav.clientWidth - linkBounds.width) / 2;

                        desktopNav.scrollTo({
                            left: Math.max(0, Math.min(
                                targetLeft,
                                desktopNav.scrollWidth - desktopNav.clientWidth
                            )),
                            behavior: 'auto'
                        });
                        previousActiveLink = link;
                    }
                });
            }

            window.addEventListener('scroll', updateActiveLink, { passive: true });
            updateActiveLink();

            // ===== ANIMATIONS DE SCROLL (Intersection Observer) =====
            const fadeElements = document.querySelectorAll('.fade-in');
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -10% 0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            fadeElements.forEach(el => observer.observe(el));

            // ===== VIDÉO MC MARIAGE AU SCROLL =====
            const portfolioVideos = document.querySelectorAll('.portfolio-video');
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting && !shouldReduceMotion) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.35 });

            portfolioVideos.forEach(video => {
                if (shouldReduceMotion) video.pause();
                videoObserver.observe(video);
            });

            document.querySelectorAll('.video-sound-toggle').forEach(button => {
                const toggleVideoSound = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const video = button.closest('.video-thumb').querySelector('.portfolio-video');
                    video.muted = !video.muted;
                    const soundEnabled = !video.muted;
                    button.setAttribute('aria-pressed', String(soundEnabled));
                    const label = soundEnabled ? 'Désactiver le son' : 'Activer le son';
                    button.setAttribute('aria-label', label);
                    button.setAttribute('title', label);
                    if (soundEnabled) {
                        video.play().catch(() => {});
                    }
                };

                button.addEventListener('pointerdown', toggleVideoSound);
            });

            // ===== COMPTEURS ANIMÉS =====
            const statNumbers = document.querySelectorAll('.number');
            const statObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = parseInt(el.getAttribute('data-target'), 10);
                        const suffix = el.getAttribute('data-suffix') || '';
                        const duration = 1500;
                        const startTime = performance.now();
                        const startValue = 0;

                        function updateCounter(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const currentValue = Math.floor(eased * target);
                            el.textContent = currentValue + suffix;
                            if (progress < 1) {
                                requestAnimationFrame(updateCounter);
                            } else {
                                el.textContent = target + suffix;
                            }
                        }
                        requestAnimationFrame(updateCounter);
                        statObserver.unobserve(el);
                    }
                });
            }, { threshold: 0.5 });

            statNumbers.forEach(num => statObserver.observe(num));

            // ===== BOUTONS MAGNÉTIQUES (desktop) =====
            if (isDesktop) {
                document.querySelectorAll('.btn, .header-cta').forEach(btn => {
                    btn.addEventListener('mousemove', (e) => {
                        const rect = btn.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.2}px)`;
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.transform = '';
                    });
                });
            }

            // ===== PARALLAX LÉGER sur le halo hero =====
            const heroHalo = document.querySelector('.hero-photo-halo');
            const heroShape1 = document.querySelector('.hero-photo-shape.shape-1');
            const heroShape2 = document.querySelector('.hero-photo-shape.shape-2');
            if (heroHalo && isDesktop) {
                window.addEventListener('scroll', () => {
                    const scrollY = window.scrollY;
                    const heroSection = document.querySelector('.hero');
                    const heroTop = heroSection.offsetTop;
                    const relativeScroll = scrollY - heroTop;
                    if (relativeScroll > -300 && relativeScroll < 600) {
                        heroHalo.style.transform = `translateY(${relativeScroll * 0.05}px)`;
                        heroShape1.style.transform = `translateY(${relativeScroll * 0.08}px) rotate(5deg)`;
                        heroShape2.style.transform = `translateY(${relativeScroll * 0.06}px) rotate(-5deg)`;
                    }
                }, { passive: true });
            }

            // ===== PREFERS-REDUCED-MOTION : désactiver les animations lourdes =====
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (prefersReducedMotion.matches) {
                // Les animations sont déjà désactivées via CSS, on arrête le JS
                if (typeof statObserver !== 'undefined') statObserver.disconnect();
                if (typeof observer !== 'undefined') observer.disconnect();
                document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
            }

            // ===== SMOTH SCROLL pour les ancres =====
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });

        })();

// ===== CONTENUS VISUELS ROTATIFS HADASSA (pilotés par Supabase) =====
        (async function loadHadassaRotatingMedia() {
            const SUPABASE_URL = 'https://cxwlfplkimnqlzmdsajj.supabase.co';
            const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ISAB6iARgJB_F0n9kr4l-A_4NLPH4_n';

            try {
                const response = await fetch(
                    SUPABASE_URL + '/rest/v1/media_rotation_slots?select=slot_key,current_media:media_assets!media_rotation_slots_current_media_fk(media_type,external_url,storage_path)&order=slot_key.asc',
                    {
                        headers: {
                            apikey: SUPABASE_PUBLISHABLE_KEY,
                            Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY
                        },
                        cache: 'no-store'
                    }
                );

                if (!response.ok) throw new Error('Supabase media request failed: ' + response.status);
                const slots = await response.json();

                const mediaUrl = (media) => {
                    if (!media) return null;
                    if (media.external_url) return media.external_url;
                    if (media.storage_path) {
                        return SUPABASE_URL + '/storage/v1/object/public/hadassa-media/' +
                            media.storage_path.split('/').map(encodeURIComponent).join('/');
                    }
                    return null;
                };

                slots.forEach((slot) => {
                    const media = Array.isArray(slot.current_media) ? slot.current_media[0] : slot.current_media;
                    const url = mediaUrl(media);
                    if (!url || !media) return;

                    if (slot.slot_key === 'projet_accueil' && media.media_type === 'image') {
                        const heroImage = document.querySelector('#heroPhotoPlaceholder img');
                        if (heroImage) {
                            heroImage.src = url;
                            heroImage.removeAttribute('srcset');
                        }
                    }

                    if (slot.slot_key === 'experience_digital' && media.media_type === 'video') {
                        const video = document.querySelector('video[aria-label="Vidéo Digital Experience"]');
                        const source = video && video.querySelector('source');
                        if (source && source.src !== url) {
                            source.src = url;
                            video.load();
                        }
                    }

                    if (slot.slot_key === 'mc_mariage' && media.media_type === 'video') {
                        const video = document.querySelector('video[aria-label="Vidéo MC mariage"]');
                        const source = video && video.querySelector('source');
                        if (source && source.src !== url) {
                            source.src = url;
                            video.load();
                        }
                    }
                });
            } catch (error) {
                console.warn('Les médias HADASSA restent sur les fichiers locaux :', error);
            }
        })();


// ===== CMS VISUEL HADASSA : textes, liens, images et disposition =====
(async function loadHadassaSiteBuilder() {
    const SUPABASE_URL = 'https://cxwlfplkimnqlzmdsajj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_ISAB6iARgJB_F0n9kr4l-A_4NLPH4_n';
    try {
        const response = await fetch(
            SUPABASE_URL + '/rest/v1/hadassa_site_content?content_key=eq.site.builder.v1&select=content',
            { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }, cache: 'no-store' }
        );
        if (!response.ok) throw new Error('CMS indisponible : ' + response.status);
        const rows = await response.json();
        const config = rows[0] && rows[0].content;
        if (!config) return;

        (config.fields || []).forEach((field) => {
            if (!field.selector) return;
            const element = document.querySelector(field.selector);
            if (!element) return;
            const value = field.value == null ? '' : String(field.value);
            const node = Number.isInteger(field.nodeIndex) ? element.childNodes[field.nodeIndex] : null;
            if (node && node.nodeType === Node.TEXT_NODE) {
                node.textContent = (field.prefix || '') + value + (field.suffix || '');
            } else if (!Number.isInteger(field.nodeIndex)) {
                element.textContent = value;
            }
        });

        (config.images || []).forEach((image) => {
            if (!image.selector) return;
            const element = document.querySelector(image.selector);
            if (!element) return;
            if (image.src) element.setAttribute('src', image.src);
            if (image.alt != null) element.setAttribute('alt', image.alt);
        });

        (config.links || []).forEach((link) => {
            if (!link.selector || !link.href) return;
            const element = document.querySelector(link.selector);
            if (element) element.setAttribute('href', link.href);
        });

        (config.sections || []).forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) element.hidden = section.visible === false;
        });

        const mainElement = document.querySelector('main');
        if (mainElement && Array.isArray(config.sections)) {
            const sectionElements = config.sections.map((section) => document.getElementById(section.id)).filter(Boolean);
            sectionElements.forEach((element) => mainElement.appendChild(element));
        }

        (config.grids || []).forEach((grid) => {
            const container = document.querySelector(grid.selector);
            if (!container || !Array.isArray(grid.order)) return;
            const elements = grid.order.map((selector) => document.querySelector(selector)).filter((element) => element && element.parentElement === container);
            elements.forEach((element) => container.appendChild(element));
        });
    } catch (error) {
        console.warn('Les contenus HADASSA restent sur leur version HTML :', error);
    }
})();
