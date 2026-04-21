document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('apartment-grid');
    const gallery = document.getElementById('gallery-container');
    const servicesGrid = document.getElementById('services-grid');
    // Nuevos elementos para el mini carrusel
    const miniGalleryCarousel = document.getElementById('mini-gallery-carousel');
    const miniGalleryIndicators = document.getElementById('mini-gallery-indicators');

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
    reveal();

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

    function cargarDatos() {
        $.getJSON('data.json', function (data) {
            if (grid) {
                window.cachedApartments = data.apartamentos;
                renderApartments(data.apartamentos);
            }
            if (servicesGrid) renderServices(data.servicios);
            if (gallery) renderGallery(data.galeria);
            if (data.carrusel) renderCarousel(data.carrusel);
            if (data.frases) renderInspiration(data.frases);
            if (data.valores) renderValues(data.valores);
            if (miniGalleryCarousel && data.miniGaleria) renderMiniGalleryCarousel(data.miniGaleria); // Cargar mini galería
        });
    }

    window.obtenerTasaCambio = function(accion, codigoIso) {
        const apiKey = 'c3194feab7msh05f995639cf09ffp1acc42jsn3f39f00bf5ba';
        const apiHost = 'currency-conversion-and-exchange-rates.p.rapidapi.com';

        if (accion == 1) {
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

    function renderCarousel(slides) {
        const indicators = document.getElementById('carousel-indicators');
        const inner = document.getElementById('carousel-inner-container');
        if (!indicators || !inner) return;

        indicators.innerHTML = '';
        inner.innerHTML = '';

        slides.forEach(function (slide, index) {
            const activeClass = index === 0 ? 'active' : '';
            
            indicators.innerHTML += '<button type="button" data-bs-target="#home" data-bs-slide-to="' + index + '" class="' + activeClass + '"></button>';

            const item = document.createElement('div');
            item.className = 'carousel-item ' + activeClass;
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

    function renderValues(values) {
        const valuesGrid = document.getElementById('values-grid');
        if (!valuesGrid) return;
        valuesGrid.innerHTML = '';
        values.forEach(function (v) {
            const div = document.createElement('div');
            div.className = 'col-md-4';
            div.innerHTML = '<div class="info-item reveal">' +
                '<i class="bi ' + v.icono + ' fs-2 mb-3 d-block text-dark"></i>' +
                '<h4 class="h5 fw-bold mb-3">' + v.nombre + '</h4>' +
                '<p class="text-muted small mb-0">' + v.descripcion + '</p>' +
                '</div>';
            valuesGrid.appendChild(div);
        });
        reveal();
    }

    function renderServices(services) {
        servicesGrid.innerHTML = '';
        services.forEach(function (s) {
            const div = document.createElement('div');
            div.className = 'col-6 col-md-3 mb-4';
            div.innerHTML = '<div class="p-4 bg-light rounded shadow-sm text-center reveal h-100">' +
                '<i class="bi ' + s.icono + ' fs-2 text-primary d-block mb-2"></i>' +
                '<h6 class="small fw-bold">' + s.nombre + '</h6></div>';
            servicesGrid.appendChild(div);
        });
        reveal();
    }

    // Nueva función para renderizar el mini carrusel de la galería
    function renderMiniGalleryCarousel(items) {
        const miniGalleryInner = document.getElementById('mini-gallery-inner');
        if (!miniGalleryIndicators || !miniGalleryInner) return;

        miniGalleryIndicators.innerHTML = '';
        miniGalleryInner.innerHTML = '';

        items.forEach(function (imgObj, index) {
            const activeClass = index === 0 ? 'active' : '';
            
            // Crear botón indicador
            const indicatorButton = document.createElement('button');
            indicatorButton.setAttribute('type', 'button');
            indicatorButton.setAttribute('data-bs-target', '#mini-gallery-carousel');
            indicatorButton.setAttribute('data-bs-slide-to', index);
            indicatorButton.className = activeClass;
            indicatorButton.setAttribute('aria-label', 'Slide ' + (index + 1));
            miniGalleryIndicators.appendChild(indicatorButton);

            const item = document.createElement('div');
            item.className = 'carousel-item ' + activeClass;
            item.innerHTML = `
                <div class="position-relative overflow-hidden" style="height: 650px;">
                    <div style="background-image: url('${imgObj.imagen}'); background-size: cover; background-position: center; filter: blur(30px) brightness(0.3); position: absolute; width: 110%; height: 110%; top: -5%; left: -5%;"></div>
                    
                    <div class="d-flex justify-content-center align-items-center h-100 position-relative">
                        <img src="${imgObj.imagen}" class="mh-100 mw-100 shadow-lg border border-white border-opacity-10" alt="${imgObj.titulo}" style="object-fit: contain;">
                    </div>

                    <!-- Encabezado de Título Lujoso -->
                    <div class="position-absolute top-0 w-100 pt-5 text-center" style="z-index: 5;">
                        <h3 class="text-white serif italic fw-light mb-0" 
                            style="letter-spacing: 0.4em; text-transform: uppercase; font-size: 1.1rem; text-shadow: 0 2px 15px rgba(0,0,0,0.6);">
                            ${imgObj.titulo}
                        </h3>
                        <div class="mx-auto mt-3" style="width: 30px; height: 1px; background-color: rgba(255,255,255,0.4);"></div>
                    </div>
                </div>`;
            miniGalleryInner.appendChild(item);
        });
        
        reveal(); // Asegura que el carrusel aparezca con la animación

        // Reinicializar el carrusel manualmente para asegurar que los controles y el auto-play funcionen
        const carouselEl = document.getElementById('mini-gallery-carousel');
        if (carouselEl) {
            new bootstrap.Carousel(carouselEl, {
                interval: 5000,
                ride: 'carousel'
            });
        }
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

    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target.id === 'lightbox' || e.target.className === 'close-lightbox') {
                lightbox.style.display = 'none';
            }
        });
    }

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

    const rangeInput = document.getElementById('incomeRange');
    if (rangeInput) {
        rangeInput.addEventListener('input', function () {
            document.getElementById('rangeValue').textContent = this.value;
        });
    }

    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {

            const nombre = document.getElementById('fullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const edad = document.getElementById('calculatedAge').value;
            const comentario = document.getElementById('message').value.trim();
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (nombre.length < 5) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Error: El nombre debe tener al menos 5 caracteres.");
                return;
            }

            if (!emailRegex.test(email)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Error: Por favor, ingrese un correo electrónico válido.");
                return;
            }

            if (!edad || edad === "") {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Error: Debe seleccionar una fecha de nacimiento válida.");
                return;
            }

            if (parseInt(edad) < 18) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Lo sentimos, el registro solo es permitido para mayores de 18 años.");
                return;
            }
        });
    }

    function configurarGeolocalizacion() {
        const btnRuta = document.getElementById('btn-ruta');
        if (btnRuta && navigator.geolocation) {
            // Solicitamos permiso y coordenadas al usuario
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const destino = encodeURIComponent("Power House Gym San Isidro, 4R55+28M, Alajuela Province, Dulce Nombre");
                    const url = `https://www.google.com/maps/dir/${lat},${lng}/${destino}/`;
                    btnRuta.setAttribute('href', url);
                },
                function (error) {
                    console.warn("Permiso de ubicación denegado o error: ", error.message);
                }
            );
        }
    }
    configurarGeolocalizacion();

    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-link').forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
