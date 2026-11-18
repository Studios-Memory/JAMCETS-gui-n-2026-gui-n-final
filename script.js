/* ===== APERTURA DE INVITACIÓN Y MÚSICA ===== */

const enter = document.getElementById('enter');
const musica = document.getElementById('musica');
const controlMusica = document.getElementById('control-musica');

enter.addEventListener('click', () => {

    document.getElementById('cover').style.display = 'none';

    document.getElementById('invitation').hidden = false;

    window.scrollTo(0, 0);

    observe();

    // Iniciar música
    musica.play().then(() => {
        controlMusica.textContent = '🔊';
    }).catch(error => {
        console.log('No se pudo iniciar la música:', error);
    });

});

// Botón para pausar y reproducir
controlMusica.addEventListener('click', () => {

    if (musica.paused) {
        musica.play();
        controlMusica.textContent = '🔊';
    } else {
        musica.pause();
        controlMusica.textContent = '🔇';
    }

});

/* ===== ANIMACIONES AL DESPLAZARSE ===== */

function observe() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.13 });

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

/* ===== VISOR UNIVERSAL CON ZOOM TÁCTIL ===== */

const fotoGrupal = document.querySelector('.foto-grupal');

if (fotoGrupal) {

    const visor = document.createElement('div');
    visor.className = 'visor-foto';

    visor.innerHTML = `
        <div class="controles-zoom">
            <button type="button" id="cerrarFoto">✕</button>
            <button type="button" id="alejarFoto">−</button>
            <button type="button" id="acercarFoto">+</button>
        </div>

        <div class="visor-foto-contenido">
            <img src="${fotoGrupal.src}" alt="Fotografía ampliada">
        </div>
    `;

    document.body.appendChild(visor);

    const contenido = visor.querySelector('.visor-foto-contenido');
    const imagen = contenido.querySelector('img');

    let zoom = 1;
    let posicionX = 0;
    let posicionY = 0;

    const zoomMaximo = 4;
    const zoomMinimo = 1;

    // Registrar los dedos que están tocando la pantalla
    const dedos = new Map();

    let distanciaInicial = 0;
    let zoomInicial = 1;
    let centroInicial = null;
    let posicionInicialX = 0;
    let posicionInicialY = 0;
    let ultimoPunto = null;

    // Aplicar ampliación y movimiento

    function actualizarImagen() {

        imagen.style.transform =
            `translate(${posicionX}px, ${posicionY}px) scale(${zoom})`;

    }

    // Evitar que la fotografía se desplace demasiado

    function limitarMovimiento() {

        const maxX = Math.max(
            0,
            (imagen.clientWidth * zoom - contenido.clientWidth) / 2
        );

        const maxY = Math.max(
            0,
            (imagen.clientHeight * zoom - contenido.clientHeight) / 2
        );

        posicionX = Math.max(-maxX, Math.min(maxX, posicionX));
        posicionY = Math.max(-maxY, Math.min(maxY, posicionY));

    }

    // Restaurar tamaño y posición originales

    function reiniciarZoom() {

        zoom = 1;
        posicionX = 0;
        posicionY = 0;

        dedos.clear();

        distanciaInicial = 0;
        ultimoPunto = null;
        centroInicial = null;

        actualizarImagen();

    }

    // Acercar o alejar

    function cambiarZoom(cantidad) {

        zoom = Math.max(
            zoomMinimo,
            Math.min(zoomMaximo, zoom + cantidad)
        );

        if (zoom === 1) {
            posicionX = 0;
            posicionY = 0;
        }

        limitarMovimiento();
        actualizarImagen();

    }

    // Abrir fotografía grupal

    fotoGrupal.addEventListener('click', () => {

        imagen.src = fotoGrupal.src;

        reiniciarZoom();

        visor.classList.add('activo');

    });

    // Botones de zoom

    document.getElementById('acercarFoto').addEventListener('click', () => {
        cambiarZoom(0.25);
    });

    document.getElementById('alejarFoto').addEventListener('click', () => {
        cambiarZoom(-0.25);
    });

    // Cerrar visor

    document.getElementById('cerrarFoto').addEventListener('click', () => {

        visor.classList.remove('activo');
        reiniciarZoom();

    });

    visor.addEventListener('click', (e) => {

        if (e.target === visor) {
            visor.classList.remove('activo');
            reiniciarZoom();
        }

    });

    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape') {
            visor.classList.remove('activo');
            reiniciarZoom();
        }

    });

    /* ===== GESTOS TÁCTILES ===== */

    function obtenerDistancia(p1, p2) {

        return Math.hypot(
            p2.x - p1.x,
            p2.y - p1.y
        );

    }

    function obtenerCentro(p1, p2) {

        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

    }

    function prepararGesto() {

        const puntos = [...dedos.values()];

        if (puntos.length === 1) {

            ultimoPunto = puntos[0];

        } else if (puntos.length === 2) {

            distanciaInicial = obtenerDistancia(
                puntos[0],
                puntos[1]
            );

            zoomInicial = zoom;

            centroInicial = obtenerCentro(
                puntos[0],
                puntos[1]
            );

            posicionInicialX = posicionX;
            posicionInicialY = posicionY;

            ultimoPunto = null;

        }

    }

    // Detectar dedos sobre la fotografía

    contenido.addEventListener('pointerdown', (e) => {

        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();

        contenido.setPointerCapture(e.pointerId);

        dedos.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY
        });

        prepararGesto();

    });

    // Ampliar con dos dedos o mover con uno

    contenido.addEventListener('pointermove', (e) => {

        if (!dedos.has(e.pointerId)) return;

        e.preventDefault();

        dedos.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY
        });

        const puntos = [...dedos.values()];

        if (puntos.length === 2 && distanciaInicial > 0) {

            const distanciaActual = obtenerDistancia(
                puntos[0],
                puntos[1]
            );

            const centroActual = obtenerCentro(
                puntos[0],
                puntos[1]
            );

            zoom = Math.max(
                zoomMinimo,
                Math.min(
                    zoomMaximo,
                    zoomInicial * distanciaActual / distanciaInicial
                )
            );

            posicionX = posicionInicialX +
                centroActual.x - centroInicial.x;

            posicionY = posicionInicialY +
                centroActual.y - centroInicial.y;

        } else if (puntos.length === 1 && zoom > 1 && ultimoPunto) {

            posicionX += puntos[0].x - ultimoPunto.x;
            posicionY += puntos[0].y - ultimoPunto.y;

            ultimoPunto = puntos[0];

        }

        if (zoom === 1) {
            posicionX = 0;
            posicionY = 0;
        }

        limitarMovimiento();
        actualizarImagen();

    });

    // Detectar cuando se levantan los dedos

    function terminarGesto(e) {

        if (!dedos.has(e.pointerId)) return;

        dedos.delete(e.pointerId);

        if (contenido.hasPointerCapture(e.pointerId)) {
            contenido.releasePointerCapture(e.pointerId);
        }

        prepararGesto();

    }

    contenido.addEventListener('pointerup', terminarGesto);
    contenido.addEventListener('pointercancel', terminarGesto);

    /* ===== RESTABLECER ZOOM ENTRE FOTOGRAFÍAS ===== */

    // Cuando otra galería cambie la imagen del visor
    const observadorImagen = new MutationObserver(() => {

        reiniciarZoom();

    });

    observadorImagen.observe(imagen, {
        attributes: true,
        attributeFilter: ['src']
    });

    // Cuando se abra el visor desde cualquier galería
    const observadorVisor = new MutationObserver(() => {

        if (visor.classList.contains('activo')) {
            reiniciarZoom();
        }

    });

    observadorVisor.observe(visor, {
        attributes: true,
        attributeFilter: ['class']
    });

}

/* ===== CUENTA REGRESIVA JAMCETS 2026 ===== */

// Fecha: 15 de diciembre de 2026
// Hora: 19:00 (Bolivia)

const fechaGraduacion = new Date(2026, 11, 15, 19, 0, 0).getTime();

function actualizarCuentaRegresiva() {

    const ahora = new Date().getTime();

    const diferencia = fechaGraduacion - ahora;

    if (diferencia <= 0) {
        document.getElementById('dias').textContent = '00';
        document.getElementById('horas').textContent = '00';
        document.getElementById('minutos').textContent = '00';
        document.getElementById('segundos').textContent = '00';
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    const horas = Math.floor(
        (diferencia / (1000 * 60 * 60)) % 24
    );

    const minutos = Math.floor(
        (diferencia / (1000 * 60)) % 60
    );

    const segundos = Math.floor(
        (diferencia / 1000) % 60
    );

    document.getElementById('dias').textContent = String(dias).padStart(2, '0');
    document.getElementById('horas').textContent = String(horas).padStart(2, '0');
    document.getElementById('minutos').textContent = String(minutos).padStart(2, '0');
    document.getElementById('segundos').textContent = String(segundos).padStart(2, '0');
}

actualizarCuentaRegresiva();
setInterval(actualizarCuentaRegresiva, 1000);


/* ===== SISTEMA DE ACCESO DE EGRESADOS ===== */

const egresados = [
    { nombre: "Alcocer Arcani Carla Jhoana", foto: "1.jpg", codigo: "9631" },
    { nombre: "Alvarado Coro Alejandro", foto: "2.jpg", codigo: "2979" },
    { nombre: "Arias Roca Andres Rafael", foto: "3.jpg", codigo: "7322" },
    { nombre: "Aspetty Lopez Pablo Santiago", foto: "4.jpg", codigo: "5494" },
    { nombre: "Beckmann Mamani Andres", foto: "5.jpg", codigo: "3271" },
    { nombre: "Candia Suarez Orlando", foto: "6.jpg", codigo: "6322" },
    { nombre: "Castedo Ortiz Jose Enrique", foto: "7.jpg", codigo: "2895" },
    { nombre: "Copajira Duran Wilfredo Gadiel", foto: "8.jpg", codigo: "7548" },
    { nombre: "Coraci Estrada Aline Yisely", foto: "9.jpg", codigo: "7429" },
    { nombre: "De Marins Lafuente Thiago James", foto: "10.jpg", codigo: "1055" },
    { nombre: "Delgado Davila Emili Scarlet", foto: "11.jpg", codigo: "3570" },
    { nombre: "Diaz Ibarra Maite Luciana", foto: "12.jpg", codigo: "6998" },
    { nombre: "Fernandez Tupa Daniel", foto: "13.jpg", codigo: "9163" },
    { nombre: "Flores Justiniano Jose Jorge", foto: "14.jpg", codigo: "4769" },
    { nombre: "Honor Serrudo Yoaldry", foto: "15.jpg", codigo: "7608" },
    { nombre: "Mendez Chosco Pablo Junior", foto: "16.jpg", codigo: "3648" },
    { nombre: "Murua Valencia Jet Li Daruwin", foto: "17.jpg", codigo: "5556" },
    { nombre: "Orellana Rojas Anderson", foto: "18.jpg", codigo: "7681" },
    { nombre: "Ortuño Cespedes Jose Carlos", foto: "19.jpg", codigo: "8787" },
    { nombre: "Segovia Antelo Jesus Fabian", foto: "20.jpg", codigo: "4426" },
    { nombre: "Suarez Coria Mateo", foto: "21.jpg", codigo: "3013" },
    { nombre: "Taboada Rojas Joel", foto: "22.jpg", codigo: "2038" },
    { nombre: "Torrez Mamani Anderson Matias", foto: "23.jpg", codigo: "7980" },
    { nombre: "Vallejos Coya Maria Rene", foto: "24.jpg", codigo: "6476" },
    { nombre: "Vilamani Quispia Carla Aracely", foto: "25.jpg", codigo: "8684" }
];

const botonesEgresados = document.querySelectorAll('.egresado-btn');
const modalEgresado = document.getElementById('modal-egresado');
const nombreEgresado = document.getElementById('nombre-egresado');
const codigoEgresado = document.getElementById('codigo-egresado');
const validarCodigo = document.getElementById('validar-codigo');
const galeriaEgresado = document.getElementById('galeria-egresado');
const fotosEgresado = [
    document.getElementById('foto-egresado-1'),
    document.getElementById('foto-egresado-2'),
    document.getElementById('foto-egresado-3')
];

const botonesDescarga = [
    document.getElementById('descargar-foto-1'),
    document.getElementById('descargar-foto-2'),
    document.getElementById('descargar-foto-3')
];
const mensajeError = document.getElementById('mensaje-error');

let egresadoSeleccionado = null;

// Abrir ventana al seleccionar un nombre

botonesEgresados.forEach((boton, indice) => {

    boton.addEventListener('click', () => {

        egresadoSeleccionado = egresados[indice];

        nombreEgresado.textContent = egresadoSeleccionado.nombre;

       codigoEgresado.value = '';
mensajeError.textContent = '';

galeriaEgresado.style.display = 'none';

fotosEgresado.forEach(foto => {
    foto.removeAttribute('src');
});

botonesDescarga.forEach(boton => {
    boton.removeAttribute('href');
});

codigoEgresado.style.display = 'block';
validarCodigo.style.display = 'inline-block';

modalEgresado.classList.add('activo');
    });

});

// Validar código personal

function comprobarCodigo() {

    if (!egresadoSeleccionado) return;

    if (codigoEgresado.value === egresadoSeleccionado.codigo) {

        // Obtener el número de fotografía del estudiante
        const numero = egresadoSeleccionado.foto.replace('.jpg', '');

        // Construir las rutas de sus tres fotografías
        const rutas = [
            `img/egresados/${numero}.jpg`,
            `img/egresados/${numero}-2.jpg`,
            `img/egresados/${numero}-3.jpg`
        ];

        // Mostrar las tres fotografías
        fotosEgresado.forEach((foto, indice) => {

            foto.src = rutas[indice];

            // Configurar descarga individual
            botonesDescarga[indice].href = rutas[indice];

            botonesDescarga[indice].setAttribute(
                'download',
                `JAMCETS_2026_Egresado_${numero}_Foto_${indice + 1}.jpg`
            );

        });

        // Ocultar el formulario después del acceso correcto
        codigoEgresado.style.display = 'none';
        validarCodigo.style.display = 'none';

        // Mostrar la galería
        galeriaEgresado.style.display = 'block';

        mensajeError.textContent = '';

    } else {

        mensajeError.textContent = 'Código incorrecto. Inténtalo nuevamente.';

        galeriaEgresado.style.display = 'none';

    }

}

validarCodigo.addEventListener('click', comprobarCodigo);

// Permitir validar presionando Enter

codigoEgresado.addEventListener('keydown', (e) => {

    if (e.key === 'Enter') {
        comprobarCodigo();
    }

});

// Cerrar ventana

document.getElementById('cerrar-modal').addEventListener('click', () => {

    modalEgresado.classList.remove('activo');

});

modalEgresado.addEventListener('click', (e) => {

    if (e.target === modalEgresado) {
        modalEgresado.classList.remove('activo');
    }

});

// Cerrar con Escape

document.addEventListener('keydown', (e) => {

    if (e.key === 'Escape') {
        modalEgresado.classList.remove('activo');
    }

});

/* ===== AMPLIAR FOTOGRAFÍAS DE EGRESADOS ===== */

const visorEgresados = document.querySelector('.visor-foto');

if (visorEgresados) {

    const imagenVisor = visorEgresados.querySelector(
        '.visor-foto-contenido img'
    );

    fotosEgresado.forEach(foto => {

        foto.addEventListener('click', () => {

            if (!foto.getAttribute('src')) return;

            // Mostrar la fotografía seleccionada
            imagenVisor.src = foto.src;

            // Restablecer el zoom
            imagenVisor.style.transform = 'scale(1)';

            // Abrir el visor
            visorEgresados.classList.add('activo');

        });

    });

}

/* ===== GALERÍA DE RECUERDOS JAMCETS 2026 ===== */

// Cantidad de fotografías disponibles
const cantidadRecuerdos = 53;

// Contenedor de la galería
const galeriaRecuerdos = document.getElementById('galeria-recuerdos');

// Guardaremos las rutas de las fotografías
const imagenesRecuerdos = [];

// Crear las fotografías automáticamente
if (galeriaRecuerdos) {

    for (let i = 1; i <= cantidadRecuerdos; i++) {

        const ruta = `img/galeria/${String(i).padStart(2, '0')}.jpg`;

        imagenesRecuerdos.push(ruta);

        const tarjeta = document.createElement('div');
        tarjeta.className = 'recuerdo-foto';

        const imagen = document.createElement('img');

        imagen.src = ruta;
        imagen.alt = `Recuerdo JAMCETS 2026 - Fotografía ${i}`;
        imagen.loading = 'lazy';
        imagen.decoding = 'async';

        tarjeta.appendChild(imagen);
        galeriaRecuerdos.appendChild(tarjeta);
    }
}

/* ===== VISUALIZACIÓN DE RECUERDOS ===== */

// Reutilizar el visor que ya tenemos
const visorRecuerdos = document.querySelector('.visor-foto');

if (galeriaRecuerdos && visorRecuerdos) {

    const imagenAmpliada = visorRecuerdos.querySelector(
        '.visor-foto-contenido img'
    );

    const controles = visorRecuerdos.querySelector('.controles-zoom');

    let recuerdoActual = 0;

    // Crear controles para navegar entre fotografías
    const botonAnterior = document.createElement('button');
    botonAnterior.type = 'button';
    botonAnterior.textContent = '❮';
    botonAnterior.setAttribute('aria-label', 'Fotografía anterior');

    const botonSiguiente = document.createElement('button');
    botonSiguiente.type = 'button';
    botonSiguiente.textContent = '❯';
    botonSiguiente.setAttribute('aria-label', 'Fotografía siguiente');

    controles.appendChild(botonAnterior);
    controles.appendChild(botonSiguiente);

    // Ocultar las flechas cuando no estemos en la galería
    botonAnterior.style.display = 'none';
    botonSiguiente.style.display = 'none';

    function mostrarRecuerdo(indice) {

        recuerdoActual = (
            indice + imagenesRecuerdos.length
        ) % imagenesRecuerdos.length;

        imagenAmpliada.src = imagenesRecuerdos[recuerdoActual];

        // Restablecer ampliación al cambiar fotografía
        imagenAmpliada.style.transform = 'scale(1)';
    }

    // Abrir fotografía seleccionada
    galeriaRecuerdos.addEventListener('click', (evento) => {

        const tarjeta = evento.target.closest('.recuerdo-foto');

        if (!tarjeta) return;

        const tarjetas = [...galeriaRecuerdos.children];

        const indice = tarjetas.indexOf(tarjeta);

        if (indice < 0) return;

        mostrarRecuerdo(indice);

        botonAnterior.style.display = 'block';
        botonSiguiente.style.display = 'block';

        visorRecuerdos.classList.add('activo');
    });

    // Fotografía anterior
    botonAnterior.addEventListener('click', () => {
        mostrarRecuerdo(recuerdoActual - 1);
    });

    // Fotografía siguiente
    botonSiguiente.addEventListener('click', () => {
        mostrarRecuerdo(recuerdoActual + 1);
    });

    // Ocultar flechas al cerrar el visor
    document.getElementById('cerrarFoto').addEventListener('click', () => {
        botonAnterior.style.display = 'none';
        botonSiguiente.style.display = 'none';
    });

    // Ocultar flechas cuando se cierre tocando el fondo
    visorRecuerdos.addEventListener('click', (evento) => {

        if (evento.target === visorRecuerdos) {
            botonAnterior.style.display = 'none';
            botonSiguiente.style.display = 'none';
        }

    });

    // Ocultar flechas al cerrar con Escape
    document.addEventListener('keydown', (evento) => {

        if (evento.key === 'Escape') {
            botonAnterior.style.display = 'none';
            botonSiguiente.style.display = 'none';
        }

    });

    // Navegación con teclado
    document.addEventListener('keydown', (evento) => {

        if (!visorRecuerdos.classList.contains('activo')) return;

        if (botonAnterior.style.display === 'none') return;

        if (evento.key === 'ArrowLeft') {
            mostrarRecuerdo(recuerdoActual - 1);
        }

        if (evento.key === 'ArrowRight') {
            mostrarRecuerdo(recuerdoActual + 1);
        }

    });

}

/* ===== MOMENTOS INOLVIDABLES JAMCETS 2026 ===== */

const cantidadMomentos = 7;

const contenedorMomentos = document.getElementById('imagenes-momentos');
const indicadoresMomentos = document.getElementById('indicadores-momentos');

const anteriorMomento = document.getElementById('momento-anterior');
const siguienteMomento = document.getElementById('momento-siguiente');

if (
    contenedorMomentos &&
    indicadoresMomentos &&
    anteriorMomento &&
    siguienteMomento
) {

    let momentoActual = 0;
    const imagenesMomentos = [];
    const indicadores = [];

    // Crear las cuatro fotografías

    for (let i = 1; i <= cantidadMomentos; i++) {

        const imagen = document.createElement('img');

        imagen.src = `img/momentos/${String(i).padStart(2, '0')}.jpg`;
        imagen.alt = `Momento inolvidable JAMCETS 2026 - ${i}`;
        imagen.className = 'imagen-momento';
        imagen.loading = i === 1 ? 'eager' : 'lazy';
        imagen.decoding = 'async';

        if (i === 1) {
            imagen.classList.add('activa');
        }

        contenedorMomentos.appendChild(imagen);
        imagenesMomentos.push(imagen);

        // Crear indicador

        const indicador = document.createElement('button');

        indicador.type = 'button';
        indicador.className = 'indicador-momento';
        indicador.setAttribute('aria-label', `Mostrar fotografía ${i}`);

        if (i === 1) {
            indicador.classList.add('activo');
        }

        indicadoresMomentos.appendChild(indicador);
        indicadores.push(indicador);

    }

    // Mostrar fotografía seleccionada

    function mostrarMomento(indice) {

        imagenesMomentos[momentoActual].classList.remove('activa');
        indicadores[momentoActual].classList.remove('activo');

        momentoActual = (
            indice + cantidadMomentos
        ) % cantidadMomentos;

        imagenesMomentos[momentoActual].classList.add('activa');
        indicadores[momentoActual].classList.add('activo');

    }

    // Cambio automático cada cuatro segundos

    let intervaloMomentos = setInterval(() => {
        mostrarMomento(momentoActual + 1);
    }, 4000);

    // Reiniciar temporizador después de navegar manualmente

    function reiniciarCarrusel() {

        clearInterval(intervaloMomentos);

        intervaloMomentos = setInterval(() => {
            mostrarMomento(momentoActual + 1);
        }, 4000);

    }

    // Flecha anterior

    anteriorMomento.addEventListener('click', () => {
        mostrarMomento(momentoActual - 1);
        reiniciarCarrusel();
    });

    // Flecha siguiente

    siguienteMomento.addEventListener('click', () => {
        mostrarMomento(momentoActual + 1);
        reiniciarCarrusel();
    });

    // Indicadores inferiores

    indicadores.forEach((indicador, indice) => {

        indicador.addEventListener('click', () => {
            mostrarMomento(indice);
            reiniciarCarrusel();
        });

    });

    // Ampliar fotografía utilizando el visor existente

    const visorMomentos = document.querySelector('.visor-foto');

    if (visorMomentos) {

        const imagenVisor = visorMomentos.querySelector(
            '.visor-foto-contenido img'
        );

        imagenesMomentos.forEach(imagen => {

            imagen.addEventListener('click', () => {

                if (!imagen.classList.contains('activa')) return;

                imagenVisor.src = imagen.src;
                imagenVisor.style.transform = 'scale(1)';

                visorMomentos.classList.add('activo');

            });

        });

    }

}