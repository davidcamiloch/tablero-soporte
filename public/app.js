// URL de la API. La levanta json-server cuando corres `npm run api`.
const API_URL = 'http://localhost:3000/tickets';

// Estado de la aplicación: la lista de tickets tal como la conoce el navegador.
// La pantalla siempre se dibuja a partir de este arreglo.
let tickets = [];

// Tu código empieza aquí.

/*     ==========================================================
       PASO 1
       ========================================================== */

const ESTADOS = {
  abierto: { etiqueta: 'Abierto', clases: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  en_progreso: { etiqueta: 'En progreso', clases: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  resuelto: { etiqueta: 'Resuelto', clases: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

const PRIORIDADES = {
  baja: { etiqueta: 'Baja', clases: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  media: { etiqueta: 'Media', clases: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  alta: { etiqueta: 'Alta', clases: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

const CATEGORIAS = {
  hardware: 'Hardware',
  software: 'Software',
  red: 'Red',
  accesos: 'Accesos',
};

const lista = document.getElementById('lista-tickets');
const mensaje = document.getElementById('mensaje');

async function cargarTickets() {
  mostrarMensaje("Cargando tickets...", "cargando");

  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió ${respuesta.status}`);
    }

    tickets = await respuesta.json();
    pintar();
  } catch (error) {
    mostrarMensaje(`No se pudieron cargar los tickets (${error.message}).`, "error");
  }
}

function mostrarMensaje(texto, tipo) {
  const CLASES = {
    cargando: 'rounded-lg border px-4 py-3 text-sm mb-4 border-slate-700 bg-slate-800/50 text-slate-300',
    error: 'rounded-lg border px-4 py-3 text-sm mb-4 border-rose-500/30 bg-rose-500/10 text-rose-300',
    vacio: 'rounded-lg border px-4 py-3 text-sm mb-4 border-slate-700 bg-slate-800/50 text-slate-400',
  };

  if (!texto) {
    mensaje.hidden = true;
    return;
  }

  mensaje.textContent = texto;
  mensaje.className = CLASES[tipo];
  mensaje.hidden = false;
}

function pintar() {
  lista.innerHTML = "";

  if (tickets.length === 0) {
    mostrarMensaje('No hay tickets todavía. Crea el primero con el formulario.', 'vacio');
    return;
  }

  mostrarMensaje("");

  for (const ticket of tickets) {
    lista.appendChild(crearTarjeta(ticket));
  }
}

function crearTarjeta(ticket) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'rounded-xl border border-slate-800 bg-slate-800/50 p-4 flex flex-col gap-3 transition-colors hover:border-slate-700';

  const numero = document.createElement('p');
  numero.className = 'text-xs font-mono text-slate-500';
  numero.textContent = `#${ticket.id}`;

  const titulo = document.createElement('h3');
  titulo.className = 'font-semibold text-white leading-snug';
  titulo.textContent = ticket.titulo;

  const descripcion = document.createElement('p');
  descripcion.className = 'text-sm text-slate-400 leading-relaxed';
  descripcion.textContent = ticket.descripcion;

  const detalle = document.createElement('p');
  detalle.className = 'text-xs text-slate-500';
  detalle.textContent = `${ticket.solicitante} · ${CATEGORIAS[ticket.categoria]}`;

  const badges = document.createElement('div');
  badges.className = 'flex flex-wrap gap-2';
  badges.appendChild(crearBadge(PRIORIDADES[ticket.prioridad]));
  badges.appendChild(crearBadge(ESTADOS[ticket.estado]));

  tarjeta.append(numero, titulo, descripcion, detalle, badges);
  return tarjeta;
}

function crearBadge(info) {
  const badge = document.createElement('span');
  badge.className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${info.clases}`;
  badge.textContent = info.etiqueta;
  return badge;
}

/*     ==========================================================
       PASO 2
       ========================================================== */

//Elementos
const form = document.getElementById('form-ticket');
const campoTitulo = document.getElementById('titulo');
const campoDescripcion = document.getElementById('descripcion');
const campoSolicitante = document.getElementById('solicitante');
const campoCategoria = document.getElementById('categoria');
const campoPrioridad = document.getElementById('prioridad');
const errorTitulo = document.getElementById('error-titulo');
const errorSolicitante = document.getElementById('error-solicitante');

function validar() {
  let valido = true;

  if (campoTitulo.value.trim().length < 5) {
    errorTitulo.textContent = 'El título debe tener al menos 5 caracteres.';
    valido = false;
  } else {
    errorTitulo.textContent = "";
  }

  if (campoSolicitante.value.trim() === "") {
    errorSolicitante.textContent = 'Escribe quién reporta el problema.';
    valido = false;
  } else {
    errorSolicitante.textContent = '';
  }

  return valido;
}

campoTitulo.addEventListener('input', () => {
  if (campoTitulo.value.trim().length >= 5) errorTitulo.textContent = "";
});

campoSolicitante.addEventListener('input', () => {
  if (campoSolicitante.value.trim() !== "") errorSolicitante.textContent = "";
});

async function crearTicket() {

  const nuevo = {
    titulo: campoTitulo.value.trim(),
    descripcion: campoDescripcion.value.trim(),
    solicitante: campoSolicitante.value.trim(),
    categoria: campoCategoria.value,
    prioridad: campoPrioridad.value,
    estado: 'abierto',
  };

  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió ${respuesta.status}`);
    }

    const creado = await respuesta.json();
    tickets.push(creado);
    pintar();
    form.reset();
  } catch (error) {
    mostrarMensaje(`No se pudo crear el ticket (${error.message}).`, "error");
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();   

  if (!validar()) return;  

  crearTicket();
});









cargarTickets();