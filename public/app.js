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
  abierto: { etiqueta: 'Abierto', clases: 'bg-sky-50 text-sky-800 border-sky-700', siguiente: 'en_progreso', boton: 'Empezar' },
  en_progreso: { etiqueta: 'En progreso', clases: 'bg-amber-50 text-amber-800 border-amber-600', siguiente: 'resuelto', boton: 'Marcar resuelto' },
  resuelto: { etiqueta: 'Resuelto', clases: 'bg-green-50 text-green-800 border-green-700', siguiente: null, boton: null },
};

const PRIORIDADES = {
  baja: { etiqueta: 'Baja', clases: 'bg-stone-50 text-stone-600 border-stone-400' },
  media: { etiqueta: 'Media', clases: 'bg-orange-50 text-orange-800 border-orange-600' },
  alta: { etiqueta: 'Alta', clases: 'bg-red-50 text-red-800 border-red-700' },
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
    cargando: 'border-l-4 border-stone-400 bg-stone-50 text-stone-600 px-4 py-3 text-sm mb-4',
    error: 'border-l-4 border-red-600 bg-red-50 text-red-800 px-4 py-3 text-sm mb-4',
    vacio: 'border-l-4 border-amber-400 bg-amber-50 text-stone-700 px-4 py-3 text-sm mb-4',
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
  tarjeta.className = 'rounded-sm border border-stone-300 bg-white shadow-sm p-4 flex flex-col gap-3 transition-shadow hover:shadow-md';
  if (ticket.estado === 'resuelto') {
    tarjeta.className = 'rounded-sm border border-stone-200 bg-stone-50 p-4 flex flex-col gap-3 opacity-60';
  }

  const numero = document.createElement('p');
  numero.className = 'self-start font-mono text-xs font-bold tracking-widest text-stone-500 bg-stone-100 border border-stone-300 px-1.5 py-0.5';
  numero.textContent = `#${ticket.id}`;

  const titulo = document.createElement('h3');
  titulo.className = 'font-bold text-stone-900 leading-snug';
  titulo.textContent = ticket.titulo;

  const descripcion = document.createElement('p');
  descripcion.className = 'text-sm text-stone-600 leading-relaxed';
  descripcion.textContent = ticket.descripcion;

  const detalle = document.createElement('p');
  detalle.className = 'text-xs text-stone-500';
  detalle.textContent = `${ticket.solicitante} · ${CATEGORIAS[ticket.categoria]}`;

  const badges = document.createElement('div');
  badges.className = 'flex flex-wrap gap-2';

  const acciones = document.createElement('div');
  acciones.className = 'flex gap-2 mt-auto pt-3 border-t border-dashed border-stone-300';

  const estado = ESTADOS[ticket.estado];

  if (estado.siguiente) {
    const btnAvanzar = document.createElement('button');
    btnAvanzar.type = 'button';
    btnAvanzar.className = 'rounded-sm bg-stone-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-amber-400 hover:text-stone-900 transition-colors cursor-pointer';
    btnAvanzar.textContent = estado.boton;
    btnAvanzar.addEventListener('click', () => cambiarEstado(ticket, estado.siguiente));
    acciones.appendChild(btnAvanzar);
  }

  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'rounded-sm border border-stone-400 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer';
  btnEditar.textContent = 'Editar';
  btnEditar.addEventListener('click', () => editarTicket(ticket));
  acciones.appendChild(btnEditar);

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'rounded-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-50 transition-colors cursor-pointer ml-auto';
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.addEventListener('click', () => eliminarTicket(ticket));
  acciones.appendChild(btnEliminar);

  badges.appendChild(crearBadge(PRIORIDADES[ticket.prioridad]));
  badges.appendChild(crearBadge(ESTADOS[ticket.estado]));

  tarjeta.append(numero, titulo, descripcion, detalle, badges, acciones);
  return tarjeta;
}

function crearBadge(info) {
  const badge = document.createElement('span');
  badge.className = `inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border-2 ${info.clases}`;
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

  if (idEnEdicion === null) {
    crearTicket();
  } else {
    guardarCambios();
  }
});

/*     ==========================================================
       PASO 3
       ========================================================== */

async function cambiarEstado(ticket, nuevoEstado) {
  try {
    const respuesta = await fetch(`${API_URL}/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió ${respuesta.status}`);
    }

    const actualizado = await respuesta.json();
    const indice = tickets.findIndex((t) => t.id === actualizado.id);
    tickets[indice] = actualizado;
    pintar();
  } catch (error) {
    mostrarMensaje(`No se pudo cambiar el estado (${error.message}).`, "error");
  }
}

/*     ==========================================================
       PASO 4
       ========================================================== */

let idEnEdicion = null;

const tituloFormulario = document.getElementById('titulo-formulario');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

function editarTicket(ticket) {
  idEnEdicion = ticket.id;

  campoTitulo.value = ticket.titulo;
  campoDescripcion.value = ticket.descripcion;
  campoSolicitante.value = ticket.solicitante;
  campoCategoria.value = ticket.categoria;
  campoPrioridad.value = ticket.prioridad;

  tituloFormulario.textContent = `Editar ticket #${ticket.id}`;
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.hidden = false;

  campoTitulo.focus();
}

function cancelarEdicion() {
  idEnEdicion = null;

  form.reset();
  errorTitulo.textContent = "";
  errorSolicitante.textContent = "";

  tituloFormulario.textContent = 'Nuevo ticket';
  btnGuardar.textContent = 'Crear ticket';
  btnCancelar.hidden = true;
}

async function guardarCambios() {
  const original = tickets.find((t) => t.id === idEnEdicion);

  const editado = {
    titulo: campoTitulo.value.trim(),
    descripcion: campoDescripcion.value.trim(),
    solicitante: campoSolicitante.value.trim(),
    categoria: campoCategoria.value,
    prioridad: campoPrioridad.value,
    estado: original.estado,
  };

  try {
    const respuesta = await fetch(`${API_URL}/${idEnEdicion}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editado),
    });

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió ${respuesta.status}`);
    }

    const actualizado = await respuesta.json();
    const indice = tickets.findIndex((t) => t.id === actualizado.id);
    tickets[indice] = actualizado;
    pintar();
    cancelarEdicion();
  } catch (error) {
    mostrarMensaje(`No se pudo guardar el ticket (${error.message}).`, "error");
  }
}

btnCancelar.addEventListener('click', cancelarEdicion);

/*     ==========================================================
       PASO 5
       ========================================================== */

async function eliminarTicket(ticket) {
  const confirmado = confirm(`¿Eliminar el ticket #${ticket.id} "${ticket.titulo}"?`);

  if (!confirmado) return;

  try {
    const respuesta = await fetch(`${API_URL}/${ticket.id}`, {
      method: 'DELETE',
    });

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió ${respuesta.status}`);
    }

    tickets = tickets.filter((t) => t.id !== ticket.id);

    if (idEnEdicion === ticket.id) {
      cancelarEdicion();
    }

    pintar();
  } catch (error) {
    mostrarMensaje(`No se pudo eliminar el ticket (${error.message}).`, "error");
  }
}

cargarTickets();
