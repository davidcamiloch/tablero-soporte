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
  abierto: { etiqueta: 'Abierto', clases: 'bg-sky-100 text-sky-800', siguiente: 'en_progreso', boton: 'Empezar' },
  en_progreso: { etiqueta: 'En progreso', clases: 'bg-amber-100 text-amber-800', siguiente: 'resuelto', boton: 'Marcar resuelto' },
  resuelto: { etiqueta: 'Resuelto', clases: 'bg-green-100 text-green-800', siguiente: null, boton: null },
};

const PRIORIDADES = {
  baja: { etiqueta: 'Baja', clases: 'bg-gray-200 text-gray-700' },
  media: { etiqueta: 'Media', clases: 'bg-orange-100 text-orange-800' },
  alta: { etiqueta: 'Alta', clases: 'bg-red-100 text-red-800' },
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
    cargando: 'border border-gray-300 bg-gray-50 text-gray-600 rounded p-3 text-sm mb-4',
    error: 'border border-red-300 bg-red-50 text-red-700 rounded p-3 text-sm mb-4',
    vacio: 'border border-amber-300 bg-amber-50 text-gray-700 rounded p-3 text-sm mb-4',
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
  pintarResumen();

  if (tickets.length === 0) {
    mostrarMensaje('No hay tickets todavía. Crea el primero con el formulario.', 'vacio');
    return;
  }

  const visibles = filtrarTickets();

  if (visibles.length === 0) {
    mostrarMensaje('Ningún ticket coincide con el filtro.', 'vacio');
    return;
  }

  mostrarMensaje("");

  for (const ticket of visibles) {
    lista.appendChild(crearTarjeta(ticket));
  }
}

function crearTarjeta(ticket) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'border border-gray-300 rounded p-4 flex flex-col gap-2';
  if (ticket.estado === 'resuelto') {
    tarjeta.className = 'border border-gray-300 rounded p-4 flex flex-col gap-2 bg-gray-100 opacity-75';
  }

  const numero = document.createElement('p');
  numero.className = 'text-xs text-gray-500';
  numero.textContent = `#${ticket.id}`;

  const titulo = document.createElement('h3');
  titulo.className = 'font-bold text-gray-900';
  titulo.textContent = ticket.titulo;

  const descripcion = document.createElement('p');
  descripcion.className = 'text-sm text-gray-600';
  descripcion.textContent = ticket.descripcion;

  const detalle = document.createElement('p');
  detalle.className = 'text-xs text-gray-500';
  detalle.textContent = `${ticket.solicitante} · ${CATEGORIAS[ticket.categoria]}`;

  const badges = document.createElement('div');
  badges.className = 'flex gap-2';

  const acciones = document.createElement('div');
  acciones.className = 'flex gap-2 pt-2 border-t border-gray-200';

  const estado = ESTADOS[ticket.estado];

  if (estado.siguiente) {
    const btnAvanzar = document.createElement('button');
    btnAvanzar.type = 'button';
    btnAvanzar.className = 'bg-gray-900 rounded px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700 cursor-pointer';
    btnAvanzar.textContent = estado.boton;
    btnAvanzar.addEventListener('click', () => cambiarEstado(ticket, estado.siguiente));
    acciones.appendChild(btnAvanzar);
  }

  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'border border-gray-400 rounded px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer';
  btnEditar.textContent = 'Editar';
  btnEditar.addEventListener('click', () => editarTicket(ticket));
  acciones.appendChild(btnEditar);

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'border border-red-400 rounded px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer';
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
  badge.className = `inline-block rounded px-2 py-1 text-xs font-semibold ${info.clases}`;
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

/*     ==========================================================
       PASO 6
       ========================================================== */

const filtroEstado = document.getElementById('filtro-estado');
const busqueda = document.getElementById('busqueda');
const resumen = document.getElementById('resumen');

function filtrarTickets() {
  const estado = filtroEstado.value;
  const texto = busqueda.value.trim().toLowerCase();

  return tickets.filter((t) => {
    const coincideEstado = estado === 'todos' || t.estado === estado;
    const coincideTexto = t.titulo.toLowerCase().includes(texto);
    return coincideEstado && coincideTexto;
  });
}

function pintarResumen() {
  const porEstado = tickets.reduce((conteo, t) => {
    conteo[t.estado] = (conteo[t.estado] || 0) + 1;
    return conteo;
  }, {});

  const altasPendientes = tickets.filter((t) => t.prioridad === 'alta' && t.estado !== 'resuelto').length;

  resumen.innerHTML = "";
  resumen.appendChild(crearChip('Abiertos', porEstado.abierto || 0, 'border-gray-300 text-gray-600'));
  resumen.appendChild(crearChip('En progreso', porEstado.en_progreso || 0, 'border-gray-300 text-gray-600'));
  resumen.appendChild(crearChip('Resueltos', porEstado.resuelto || 0, 'border-gray-300 text-gray-600'));
  resumen.appendChild(crearChip('Alta sin resolver', altasPendientes, 'border-red-300 bg-red-50 text-red-700'));
}

function crearChip(etiqueta, cantidad, clases) {
  const chip = document.createElement('span');
  chip.className = `border rounded px-3 py-1 text-xs ${clases}`;
  chip.textContent = `${cantidad} ${etiqueta}`;
  return chip;
}

filtroEstado.addEventListener('change', pintar);
busqueda.addEventListener('input', pintar);

cargarTickets();
