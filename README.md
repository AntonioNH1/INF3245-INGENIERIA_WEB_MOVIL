# Sistema de Reservas de Canchas Deportivas (Fútbol 7, Tenis y Pádel)

# Presentado por:
- Bruno Medina
- Antonio Navarro
- Annais Legua

## Índice
1. [De qué trata el problema](#de-qué-trata-el-problema)
2. [Quiénes usarán la app](#quiénes-usarán-la-app)
    - [Los Roles](#los-roles)
    - [Nuestros usuarios imaginarios (Proto-personas)](#nuestros-usuarios-imaginarios-proto-personas)
3. [Lo que tiene que hacer la app (Requerimientos)](#lo-que-tiene-que-hacer-la-app)
4. [Cómo nos movemos en la app (Navegación y UX)](#cómo-nos-movemos-en-la-app)
    - [Qué puede ver cada uno](#qué-puede-ver-cada-uno)
    - [El paso a paso de las tareas](#el-paso-a-paso-de-las-tareas)
    - [Las partes complicadas (Puntos críticos)](#las-partes-complicadas)
    - [Por qué lo diseñamos así](#por-qué-lo-diseñamos-así)
5. [Nuestros diseños en Figma](#nuestros-diseños-en-figma)
6. [Las herramientas que usamos](#las-herramientas-que-usamos)

---

## De qué trata el problema
Armar un partido con los amigos casi siempre es un dolor de cabeza. Hoy en día, si quieres arrendar una cancha de Fútbol 7, jugar Tenis o armar una partida de Pádel, tienes que ponerte a escribir por WhatsApp o llamar a un montón de lugares distintos para ver si de casualidad tienen un horario libre. A veces se demoran horas en responder, y para cuando lo hacen, ya se te pasaron las ganas o el grupo se desarmó.

Por el otro lado, los dueños de los recintos tampoco lo pasan muy bien. Muchos siguen anotando las reservas en un cuaderno o en un Excel súper básico, lo que termina en errores clásicos: anotan a dos grupos a la misma hora en la misma cancha de pádel, o se les olvida tachar a alguien que canceló a última hora. 

Nuestra idea es solucionar este desorden creando una app web y móvil súper sencilla. Queremos que cualquier persona pueda meterse, ver al tiro qué canchas de Fútbol 7, Tenis o Pádel están libres y reservar ahí mismo. Y que los dueños tengan un calendario clarito en su pantalla para controlar su negocio sin estrés.

---

## Quiénes usarán la app
Pensamos en dos tipos de personas principalmente:

### 1. Los deportistas (Nuestros clientes)
Son los que andan buscando dónde jugar. No quieren perder el tiempo; necesitan agarrar su celular, ver si hay una cancha libre, reservarla y listo.
Lo que más necesitan es:
- Filtrar rápido si quieren Fútbol 7, Tenis o Pádel, y elegir el día.
- Ver qué horarios están desocupados sin tener que hablar con nadie.
- Tener un registro para acordarse a qué hora era el partido.

### 2. Los dueños de las canchas (Los administradores)
Son los que arriendan los espacios y necesitan organizar la agenda de su local.
Lo que más necesitan es:
- Ver un calendario fácil de entender con todas las canchas ocupadas del día.
- Poder subir las canchas que tienen disponibles con sus precios.
- Evitar a toda costa que dos grupos lleguen a la misma hora a jugar a la misma cancha.

---

## Los Roles
Para que la app funcione bien, separamos a los usuarios en dos roles:
- **Cliente**: El que entra a buscar y reservar su cancha.
- **Administrador**: El que maneja el recinto y revisa que todo esté en orden en su calendario.

---

## Nuestros usuarios imaginarios (Proto-personas)
Inventamos a un par de personas basadas en la realidad para entender mejor cómo harían uso de la app.

### Proto-persona 1: El organizador del grupo
**Nombre:** Javier  
**Rol:** Cliente

- **Cómo es:** Javier trabaja en una oficina y es el típico amigo al que le toca organizar la pichanga de Fútbol 7 todos los jueves en la tarde. Hace todo desde el celular.
- **Qué necesita:** Encontrar una cancha libre entre las 19:00 y las 21:00, y reservarla rápido para avisarle al grupo por el grupo de WhatsApp.
- **Qué le molesta:** Odia mandar mensajes a 4 complejos distintos y quedarse esperando a que le respondan. Le carga llegar a la cancha y que el dueño le diga "uy, me equivoqué de día al anotarlos".
- **Qué usaría de la app:** El buscador para pillar canchas de Fútbol 7, ver los cuadritos verdes de horas libres y darle a "Reservar".

### Proto-persona 2: La dueña del recinto
**Nombre:** Marcela  
**Rol:** Administrador

- **Cómo es:** Marcela es dueña de un club que tiene 4 canchas de Pádel y 2 de Tenis. Se la pasa pegada al celular respondiendo mensajes de gente que pregunta "¿tienes hora hoy?".
- **Qué necesita:** Poder ver en la pantalla del computador de su recepción cómo viene el día y qué canchas le faltan por llenar.
- **Qué le molesta:** Perder tiempo respondiendo mensajes por horarios que ya arrendó, y equivocarse al anotar reservas cruzadas en su agenda de papel.
- **Qué usaría de la app:** La vista de calendario, y la opción de agregar o modificar los precios de sus canchas.

---

## Lo que tiene que hacer la app

### Cosas que se pueden hacer (Requerimientos Funcionales)
Según lo que pide el proyecto, acá están nuestras 7 funciones principales (sin contar el inicio de sesión).

| ID | ¿Qué hace? | ¿Quién lo usa? |
|---|---|---|
| **RF-01** | La app dejará que la persona busque canchas filtrando por deporte (Fútbol 7, Tenis o Pádel), fecha y hora. | Cliente |
| **RF-02** | La app mostrará una pantalla donde se vea claramente qué horarios están libres para llegar y reservar. | Cliente |
| **RF-03** | La app dejará que la persona confirme su reserva con un par de toques. | Cliente |
| **RF-04** | La app tendrá una sección de "Mis Reservas" para que la persona vea a dónde y a qué hora tiene que ir a jugar. | Cliente |
| **RF-05** | La app permitirá cancelar una reserva si a la persona se le bajó el equipo, liberando esa hora para que otro la tome. | Cliente |
| **RF-06** | La app dejará que el dueño del lugar agregue sus canchas (indicando si es de Pádel, Tenis o F7) y le ponga el precio. | Administrador |
| **RF-07** | La app le mostrará al dueño un calendario general con todas las reservas del día para que sepa quién viene. | Administrador |

### Detalles de calidad (Requerimientos No Funcionales)
Las 5 cosas técnicas que tienen que funcionar impecable.

- **RNF-01 (Que se vea bien):** La app tiene que acomodarse perfecto a la pantalla del celular para los que reservan, y verse bien en un computador para los dueños de las canchas.
- **RNF-02 (Rápida):** Al buscar una cancha, los resultados tienen que aparecer casi al instante para que la gente no se aburra y cierre la app.
- **RNF-03 (Seguridad básica):** Alguien que solo viene a jugar no puede meterse por ningún motivo a cambiar los precios o borrar las canchas del recinto. Eso es solo para el administrador.
- **RNF-04 (Cero choques):** Si dos personas están intentando reservar la última cancha de Pádel de las 20:00 al mismo tiempo, el sistema tiene que bloquearla rápido para el primero que hizo clic, para que no se arriende dos veces.
- **RNF-05 (Colores claros):** Tiene que ser súper obvio cuándo una cancha está disponible (ej. color verde) y cuándo está ocupada (ej. color gris), para que la gente no tenga que pensar mucho.

---

## Cómo nos movemos en la app

### Las pantallas principales

**Para cualquiera (Rutas públicas):**
- `/login` -> Para entrar con tu correo y clave.
- `/registro` -> Para crearse una cuenta nueva.

**Para el que juega (Rutas del Cliente):**
- `/cliente/inicio` -> El buscador principal (¿Qué quieres jugar hoy? F7, Tenis o Pádel).
- `/cliente/cancha/:id` -> Para ver los horarios de un lugar específico.
- `/cliente/mis-reservas` -> El historial para ver los partidos que se vienen.

**Para el dueño (Rutas del Administrador):**
- `/admin/calendario` -> La vista gigante para ver qué canchas están ocupadas hoy.
- `/admin/canchas` -> Donde el dueño sube, edita o borra las canchas de su negocio.

### Qué puede ver cada uno
Es súper simple: el cliente solo entra a mirar disponibilidad y armar su partido. No puede editar nada del negocio. Por el contrario, el dueño solo entra a ver su propio recinto y a manejar sus horarios; a él no le sirve el buscador general porque no anda buscando arrendar en otros lados.

### El paso a paso de las tareas (Task Flows)

**1. Cómo reservar una cancha (El cliente):**
Entras a la app -> Buscas "Pádel" para el "Viernes" -> Revisas la lista de lugares -> Eliges uno que te guste -> Haces clic en la hora de las "19:00" -> Le das a "Confirmar" -> Te sale un aviso de éxito y te queda anotado en tus reservas.

**2. Cómo subir una cancha nueva (El administrador):**
Entras a tu panel -> Vas a la sección de tus canchas -> Pinchas en "Añadir Cancha" -> Pones que es de "Tenis" y cuesta $10.000 -> Guardas -> Aparece lista para que la gente la empiece a arrendar.

### Las partes complicadas (Puntos críticos)
1. **Que no se pisen la cola reservando:** Si hay alta demanda un sábado, el sistema tiene que ser muy pillo para no cobrarle a dos grupos por la misma hora[cite: 2].
2. **El calendario en el celular:** Poner un calendario lleno de horas en una pantalla chica de celular es difícil. Vamos a tener que hacer que se vea como una lista hacia abajo para que el cliente no se maree.

### Por qué lo diseñamos así
Hicimos la navegación de la manera más lógica y directa posible. Queremos que sea "a prueba de tontos", o sea, que no necesites un manual para entender cómo arrendar una cancha. Si el cliente quiere jugar Fútbol 7, que entre, busque, haga dos clics y ya tenga lista su pichanga.

---

## Nuestros diseños en Figma
https://www.figma.com/design/HMk4Bjnwq0eAr6vTQ2NcWn/Sin-t%C3%ADtulo?node-id=0-1&t=9lYpaFwlSHBVut0G-1
---

## Las herramientas que usamos
- `@ionic/react`: Para que los botones y las pantallas se vean como una app de verdad.
- `react-router-dom`: Para saltar de una pantalla a otra sin dramas.
- `ionicons`: Para poner los íconos de los menús y cosas así.
