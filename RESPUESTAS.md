# Preguntas de repaso

## 1. ¿Qué diferencia hay entre PUT y PATCH? ¿Por qué el nivel 3 usa PATCH y el nivel 4 usa PUT?

En el experimento le mandé el mismo cuerpo a dos tickets, `{ "titulo": "Solo mando el título" }`,
pero con métodos distintos, y el resultado fue muy diferente.

Con PUT, el ticket 3 quedó así en `db.json`:

```json
{ "titulo": "Solo mando el título", "id": 3 }
```

Se borraron la descripción, el solicitante, la categoría, la prioridad y el estado.

Con PATCH, el ticket 7 solo cambió el título y conservó todo lo demás.

Entonces PUT reemplaza el recurso completo por lo que uno envía: lo que no mandes se pierde.
PATCH en cambio modifica únicamente los campos que mandas y deja el resto igual.

El nivel 3 usa PATCH porque solo cambia un campo, el estado, y no tiene sentido volver a mandar
todo el ticket para eso. El nivel 4 usa PUT porque al editar se está reescribiendo el ticket
entero con lo que la persona escribió en el formulario.

## 2. El formulario del nivel 4 no tiene un campo de estado. ¿De dónde sale el estado que envías en el PUT, y qué le pasaría al ticket si no lo incluyeras?

El estado lo saco del ticket original que ya tengo guardado en el arreglo `tickets` del navegador,
no del formulario. En `guardarCambios()` lo busco así:

```js
const original = tickets.find((t) => t.id === idEnEdicion);
```

y después lo pongo en el objeto que envío: `estado: original.estado`.

Si no lo incluyera, como PUT reemplaza el ticket completo, el ticket quedaría guardado sin el
campo `estado`. Eso rompería la página, porque al pintar la tarjeta hago `ESTADOS[ticket.estado]`
y con un estado `undefined` no encontraría la etiqueta ni el color, y tampoco podría avanzarlo
con el botón del nivel 3.

## 3. Códigos de estado que vi en Network

| Operación | Método y ruta | Código | Familia |
|---|---|---|---|
| Crear un ticket | POST `/tickets` | 201 | 2xx, éxito |
| Cambiar el estado | PATCH `/tickets/:id` | 200 | 2xx, éxito |
| Editar un ticket | PUT `/tickets/:id` | 200 | 2xx, éxito |
| Eliminar un ticket | DELETE `/tickets/:id` | 200 | 2xx, éxito |
| Pedir un ticket que no existe | GET `/tickets/999` | 404 | 4xx, error del cliente |

Los 2xx significan que el servidor entendió la petición y la hizo. El 201 es más específico que
el 200: quiere decir "creado", que es justo lo que pasa con el POST, y por eso es el único
distinto de los cuatro.

Los 4xx significan que el problema está en la petición que mandé, no en el servidor. El 404 es
"no encontrado": pedí el ticket 999 y ese ticket no existe. Si el error fuera del servidor sería
un 5xx.

## 4. Idempotencia y el doble clic

Corrí `npm run api:lento`, llené el formulario e hice doble clic rápido en "Crear ticket".
Se crearon **dos tickets**, iguales pero con id distinto. Pasa porque cada clic dispara su propio
POST, y POST no es idempotente: cada vez que lo mandas, el servidor crea un recurso nuevo.

Con PUT no pasaría lo mismo. Si mando dos veces el mismo PUT al mismo ticket, la primera vez lo
reemplaza y la segunda lo vuelve a reemplazar por exactamente lo mismo, así que el servidor queda
igual que si lo hubiera mandado una sola vez. Por eso PUT sí es idempotente.

Desde la interfaz se evita deshabilitando el botón mientras la petición está en camino
(`btnGuardar.disabled = true` antes del fetch y volverlo a habilitar cuando responda), así el
segundo clic no hace nada.

## 5. ¿Qué diferencia hay, para fetch, entre que el servidor esté apagado y que responda 404?

Al `catch` sin que yo haga nada solo llega el caso del servidor apagado.

`fetch` solo rechaza la promesa cuando la petición ni siquiera se pudo hacer: no hay red, el
servidor está caído, el dominio no existe. Ahí sí se lanza el error solo y cae en el `catch`.

Cuando el servidor responde 404, la petición sí llegó y sí hubo respuesta, así que para `fetch`
eso es un éxito y la promesa se resuelve normalmente. Si yo no reviso nada, el código sigue como
si todo estuviera bien y se rompe más adelante al intentar usar unos datos que nunca llegaron.

Por eso en todas mis peticiones reviso el código a mano y lanzo el error yo mismo:

```js
if (!respuesta.ok) {
  throw new Error(`El servidor respondió ${respuesta.status}`);
}
```

Ese `throw` es el que hace que el 404 termine en el `catch` y se muestre mi mensaje de error.

## 6. ¿Por qué la búsqueda del nivel 6 no necesita hacer peticiones a la API?

Porque al cargar la página ya traje todos los tickets con un GET y los tengo en el arreglo
`tickets`. Filtrar es solo recorrer ese arreglo con `filter`, así que el navegador puede hacerlo
solo. Pedirle al servidor lo mismo que ya tengo sería más lento y además la búsqueda se sentiría
trabada, porque habría una petición por cada letra que escribo.

Al servidor le convendría hacer el filtro cuando hay muchísimos datos y no tiene sentido
descargarlos todos: por ejemplo si en vez de diez tickets fueran cincuenta mil. Ahí uno pide solo
la página de resultados que necesita, con algo como `/tickets?estado=abierto&_page=1`.

## 7. La sección scripts de package.json, npm install y node_modules

La sección `scripts` guarda comandos con un nombre corto para no tener que escribirlos completos
cada vez. En este proyecto, `npm run api` en realidad ejecuta
`node preparar-db.js && json-server --watch db.json --port 3000`. Además sirve para que cualquiera
que abra el proyecto sepa cómo levantarlo sin preguntar.

Cuando corro `npm install`, npm lee las dependencias de `package.json`, las descarga y las guarda
en la carpeta `node_modules` dentro del proyecto. También escribe `package-lock.json`, que anota
las versiones exactas que quedaron instaladas.

`node_modules` está en `.gitignore` porque son archivos que no escribí yo y pesan muchísimo
(miles de archivos). No tiene sentido subirlos: con `package.json` y `package-lock.json`
cualquiera puede volver a generar esa carpeta idéntica corriendo `npm install`.

## 8. Una clase con prefijo de mi proyecto

En mi tablero uso `md:grid-cols-2` en el div de los tickets:

```html
<div id="lista-tickets" class="grid gap-4 md:grid-cols-2"></div>
```

`grid` no tiene prefijo, así que aplica siempre. `md:grid-cols-2` solo aplica desde 768 px hacia
arriba.

Quien abre la página en un celular ve las tarjetas una debajo de otra, en una sola columna, porque
la pantalla es más angosta que 768 px y esa clase no se activa.

Quien la abre en un computador ve las tarjetas de a dos por fila, porque la pantalla pasa de
768 px y ahí sí se aplica `grid-cols-2`.

Es la idea de Tailwind de pensar primero en el celular: lo básico va sin prefijo y los prefijos
van agregando cambios a medida que hay más espacio.
