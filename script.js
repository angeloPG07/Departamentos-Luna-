// Esperamos a que el HTML cargue (JavaScript Puro)
document.addEventListener('DOMContentLoaded', function () {
    // Selección de elementos del DOM
    const grid = document.getElementById('apartment-grid');
    const gallery = document.getElementById('gallery-container');
    const servicesGrid = document.getElementById('services-grid');

    // 0. EFECTO DE REVELACIÓN AL HACER SCROLL (JavaScript Puro)
    function reveal() {
        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(function (el) {
            const windowHeight = window.innerHeight;
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', reveal);
    reveal(); // Disparo inicial

    // 1. NAVEGACIÓN SUAVE (JavaScript Puro)
    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 2. CARGA DE DATOS JSON (jQuery - Usado una sola vez)
    function cargarDatos() {
        $.getJSON('data.json', function (data) {
            if (grid) {
                // Guardamos los apartamentos globalmente para poder re-renderizar al cambiar moneda sin re-leer el JSON
                window.cachedApartments = data.apartamentos;
                renderApartments(data.apartamentos);
            }
            if (servicesGrid) renderServices(data.servicios);
            if (gallery) renderGallery(data.galeria);
            if (data.carrusel) renderCarousel(data.carrusel);
            if (data.frases) renderInspiration(data.frases);
        });
    }

    // --- GESTIÓN DE DIVISAS Y CONVERSIÓN ---

    window.obtenerTasaCambio = function(accion, codigoIso) {
        const apiKey = 'c3194feab7msh05f995639cf09ffp1acc42jsn3f39f00bf5ba';
        const apiHost = 'currency-conversion-and-exchange-rates.p.rapidapi.com';

        if (accion == 1) {
            // Cargar símbolos iniciales
            $.ajax({
                url: `https://${apiHost}/symbols`,
                type: "GET",
                headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost },
                success: function (data) {
                    let opciones = '';
                    const selectElement = document.getElementById('selector-moneda');
                    if (!selectElement) return;

                    Object.entries(data.symbols).forEach(([key, value]) => {
                        if (key == 'USD' || key == 'EUR' || key == 'CRC') {
                            const selected = key === (sessionStorage.getItem('divisa_preferida') || 'USD') ? 'selected' : '';
                            opciones += `<option value="${key}" ${selected}>${value} (${key})</option>`;
                        }
                    });
                    selectElement.innerHTML = opciones;
                    
                    // Inicialización por defecto
                    if (!sessionStorage.getItem('divisa_preferida')) {
                        window.obtenerTasaCambio(2, 'USD');
                    }
                }
            });
        } else if (accion == 2) {
            sincronizarPreferencia(1, codigoIso);
            $.ajax({
                url: `https://${apiHost}/convert?from=USD&to=${codigoIso}&amount=1`,
                type: "GET",
                headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost },
                success: function (data) {
                    sessionStorage.setItem('valor_conversion', data.info.rate);
                    if (window.cachedApartments) {
                        renderApartments(window.cachedApartments);
                    } else {
                        cargarDatos();
                    }
                }
            });
        }
    };

    function sincronizarPreferencia(modo, iso) {
        if (modo == 1) sessionStorage.setItem('divisa_preferida', iso);
        return sessionStorage.getItem('divisa_preferida');
    }

    // Inicializar tipos de cambio si estamos en la página de apartamentos
    if (document.getElementById('selector-moneda')) {
        window.obtenerTasaCambio(1, "");
    }

    function getSimbolo(moneda) {
        switch (moneda) {
            case 'EUR': return '€';
            case 'CRC': return '₡';
            default: return '$';
        }
    }

    function renderApartments(apartments) {
        grid.innerHTML = '';
        const factor = parseFloat(sessionStorage.getItem('valor_conversion')) || 1;
        const divisaActual = sessionStorage.getItem('divisa_preferida') || 'USD';
        const simbolo = getSimbolo(divisaActual);

        apartments.forEach(function (apto) {
            // Limpiamos el precio del JSON (ej: "$1,200" -> 1200)
            const precioBase = parseFloat(apto.precio.replace(/[^0-9.-]+/g, ""));
            const precioFinal = (precioBase * factor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const card = document.createElement('div');
            card.className = 'reveal mb-4';
            card.innerHTML = `<div class="card border-0">
                <img src="${apto.imagen}" class="card-image" alt="${apto.nombre}">
                <div class="card-content">
                    <p class="small text-uppercase text-muted mb-2">${apto.ubicacion}</p>
                    <h3 class="h5 serif italic mb-3">${apto.nombre}</h3>
                    <p class="text-muted small mb-4">${apto.descripcion}</p>
                    <p class="fw-bold m-0">${simbolo}${precioFinal} <span class="fw-normal small">/ mes (${divisaActual})</span></p>
                </div></div>`;
            grid.appendChild(card);
        });
        reveal();
    }

    cargarDatos();

    // --- FUNCIONES DE DIBUJO (Rendering con JS Puro) ---

    function renderCarousel(slides) {
        const indicators = document.getElementById('carousel-indicators');
        const inner = document.getElementById('carousel-inner-container');
        if (!indicators || !inner) return;

        indicators.innerHTML = '';
        inner.innerHTML = '';

        slides.forEach(function (slide, index) {
            const activeClass = index === 0 ? 'active' : '';
            
            // Crear Indicador
            indicators.innerHTML += '<button type="button" data-bs-target="#home" data-bs-slide-to="' + index + '" class="' + activeClass + '"></button>';

            // Crear Slide
            const item = document.createElement('div');
            item.className = 'carousel-item ' + activeClass;
            // Aplicamos la imagen con comillas dobles para mayor seguridad en la ruta
            item.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("' + slide.imagen + '")';
            item.innerHTML = '<div class="carousel-caption">' +
                '<h1 class="display-1 serif italic">' + slide.titulo + '</h1>' +
                '<p class="lead tracking-widest small text-uppercase">' + slide.subtitulo + '</p></div>';
            inner.appendChild(item);
        });
    }

    function renderInspiration(quotes) {
        const quoteContainer = document.getElementById('quote-container');
        if (!quotes || !quoteContainer) return;
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        quoteContainer.innerHTML = '<p class="h3 mb-3">"' + q.q + '"</p>' +
            '<cite class="text-muted small">— ' + q.a + '</cite>';
    }

    function renderServices(services) {
        servicesGrid.innerHTML = '';
        services.forEach(function (s) {
            const div = document.createElement('div');
            div.className = 'col-6 col-md-4 mb-4';
            div.innerHTML = '<div class="p-4 bg-light rounded shadow-sm text-center reveal">' +
                '<i class="bi ' + s.icono + ' fs-2 text-primary d-block mb-2"></i>' +
                '<h6 class="small fw-bold">' + s.nombre + '</h6></div>';
            servicesGrid.appendChild(div);
        });
        reveal();
    }

    function renderGallery(images) {
        gallery.innerHTML = '';
        images.forEach(function (imgUrl) {
            const div = document.createElement('div');
            div.className = 'col-6 col-md-4 mb-3';
            div.innerHTML = '<div class="overflow-hidden reveal" style="height:150px; cursor:pointer;">' +
                '<img src="' + imgUrl + '" class="w-100 h-100 object-fit-cover"></div>';
            div.addEventListener('click', function () {
                document.getElementById('lightbox-img').src = imgUrl;
                document.getElementById('lightbox').style.display = 'flex';
            });
            gallery.appendChild(div);
        });
        reveal();
    }

    // --- UTILIDADES ---

    // Cerrar Lightbox (JS Puro)
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target.id === 'lightbox' || e.target.className === 'close-lightbox') {
                lightbox.style.display = 'none';
            }
        });
    }

    // Cálculo de Edad (JS Puro)
    const birthInput = document.getElementById('birthDate');
    if (birthInput) {
        birthInput.addEventListener('change', function () {
            const birth = new Date(this.value);
            const today = new Date();
            let edad = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) edad--;
            document.getElementById('calculatedAge').value = edad;
        });
    }

    // Rango de Ingresos (JS Puro)
    const rangeInput = document.getElementById('incomeRange');
    if (rangeInput) {
        rangeInput.addEventListener('input', function () {
            document.getElementById('rangeValue').textContent = this.value;
        });
    }

    // Formulario (JS Puro)
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Detenemos el envío para validar primero

            // 1. Capturamos los valores
            const nombre = document.getElementById('fullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const edad = document.getElementById('calculatedAge').value;
            const comentario = document.getElementById('message').value.trim();
            
            // Patrón para validar que el correo sea real (usuario@dominio.com)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // 2. Aplicamos las validaciones de JavaScript Puro
            
            if (nombre.length < 5) {
                alert("Error: El nombre debe tener al menos 5 caracteres.");
                return; // Detiene el proceso
            }

            if (!emailRegex.test(email)) {
                alert("Error: Por favor, ingrese un correo electrónico válido.");
                return;
            }

            if (!edad || edad === "") {
                alert("Error: Debe seleccionar una fecha de nacimiento válida.");
                return;
            }

            if (parseInt(edad) < 18) {
                alert("Lo sentimos, el registro solo es permitido para mayores de 18 años.");
                return;
            }

            // 3. Si pasó todas las validaciones
            alert("¡Registro exitoso!\nGracias por tu interés, " + nombre + ".");
            this.reset(); // Limpiamos el formulario
            
            // Opcional: Reiniciar el numerito del rango si lo tuvieras en esta página
            const rangeLabel = document.getElementById('rangeValue');
            if (rangeLabel) rangeLabel.textContent = "5500";
        });
    }

    // Geolocalización (JS Puro)
    function configurarGeolocalizacion() {
        const btnRuta = document.getElementById('btn-ruta');
        if (btnRuta && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (pos) {
                const url = "https://www.google.com/maps/dir/" + pos.coords.latitude + "," + pos.coords.longitude + "/10.016259,-84.214154/";
                btnRuta.setAttribute('href', url);
            });
        }
    }
    configurarGeolocalizacion();

    // Resaltar menú activo (JS Puro)
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
