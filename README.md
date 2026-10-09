# Sistema de Reservas de Canchas Deportivas (Fútbol 7, Tenis y Pádel)

## Presentado por:
- **Bruno Medina:** Configuración inicial, ruteo base, documentación y maquetación de vistas de cliente.
- **Antonio Navarro:** Lógica de componentes, diseño de interfaz y validaciones de formularios.
- **Annais Legua:** Prototipado en Figma, flujos de navegación y estructuración de la arquitectura de información.

---

## Índice
1. [De qué trata el problema](#de-qué-trata-el-problema)
2. [Quiénes usarán la app](#quiénes-usarán-la-app)
3. [Requerimientos del Sistema](#requerimientos-del-sistema)
4. [Arquitectura de Navegación y UX](#arquitectura-de-navegación-y-ux)
5. [Nuestros diseños en Figma](#nuestros-diseños-en-figma)
6. [Instrucciones de Instalación y Ejecución](#instrucciones-de-instalación-y-ejecución)

---

## De qué trata el problema
La gestión de reservas en recintos deportivos de nivel amateur e independiente suele realizarse de manera informal, utilizando cuadernos o planillas de cálculo básicas. Según estimaciones del sector, el auge de deportes como el Pádel y el Fútbol 7 ha generado una sobredemanda de recintos, lo que satura los canales de comunicación tradicionales (WhatsApp, llamadas). Si bien existen soluciones en el mercado como EasyCancha, muchos recintos pequeños no acceden a ellas por costos o complejidad, manteniéndose en la informalidad.

**Consecuencias de no resolver el problema:**
Si este problema persiste, los recintos continuarán enfrentando pérdidas de ingresos por topes de horarios (doble reserva) y cancelaciones de última hora sin capacidad de reacción. Por el lado del usuario, la fricción de tener que contactar a múltiples recintos genera desorganización, pérdida de tiempo y, a menudo, la disolución del grupo deportivo por no concretar una reserva a tiempo.

Nuestra solución busca democratizar el acceso a un sistema digital mediante una aplicación web y móvil ligera, centrada estrictamente en la visualización de disponibilidad y la reserva rápida.

---

## Quiénes usarán la app

### Proto-personas y Supuestos
*Nota: Los siguientes perfiles fueron construidos en base a entrevistas informales a jugadores frecuentes y administradores locales (evidencia), combinados con supuestos sobre sus hábitos de uso tecnológico.*

#### 1. El organizador del grupo (Cliente)
- **Nombre:** Javier.
- **Nivel tecnológico:** Alto, usuario frecuente de apps móviles.
- **Necesidad principal:** Encontrar disponibilidad inmediata de canchas y agendar de forma autónoma.
- **Privacidad y Accesibilidad:** Requiere navegación rápida a una mano (móvil) y que sus datos personales solo sean compartidos con el recinto para la validación de identidad.
- **Evidencia vs Supuesto:** Se verificó (evidencia) que es el encargado de coordinar en WhatsApp. Se asume (supuesto) que prefiere ver una grilla visual antes que un listado de texto.

#### 2. La dueña del recinto (Administrador)
- **Nombre:** Marcela.
- **Nivel tecnológico:** Medio-bajo, utiliza el computador del mesón de recepción principalmente para ofimática.
- **Necesidad principal:** Centralizar las reservas para evitar choques de horario y actualizar su oferta.
- **Privacidad y Accesibilidad:** Necesita contraste alto en pantalla y tipografía grande, además de accesos restringidos para que sus empleados no puedan borrar canchas.
- **Evidencia vs Supuesto:** Se verificó que el uso de papel genera reservas dobles. Se asume que prefiere una vista de calendario mensual/diario por sobre una lista de eventos.

---

## Requerimientos del Sistema

### Requerimientos Funcionales (RF)
| ID | Descripción | Verificabilidad (Resultado esperado) | Rol |
|---|---|---|---|
| **RF-01** | El sistema permitirá buscar disponibilidad filtrando por deporte, fecha y rango horario. | Retorna una lista de recintos que coinciden con los parámetros. | Cliente |
| **RF-02** | El sistema mostrará la grilla de bloques horarios específicos de un recinto seleccionado. | Despliega bloques (ej. 19:00 - 20:30) con su estado (disponible/ocupado). | Cliente |
| **RF-03** | El sistema permitirá confirmar una reserva en un bloque disponible. | Genera un registro en la base de datos y cambia el estado del bloque a ocupado. | Cliente |
| **RF-04** | El sistema permitirá visualizar el historial de reservas activas e históricas del usuario. | Renderiza una lista con la fecha, hora y recinto de cada reserva asociada al ID del usuario. | Cliente |
| **RF-05** | El sistema permitirá cancelar una reserva activa. | Cambia el estado del bloque reservado a "disponible" nuevamente. | Cliente |
| **RF-06** | El sistema permitirá agregar una nueva cancha al recinto. | Crea un nuevo registro de cancha con su tipo de deporte asociado al ID del recinto. | Admin |
| **RF-07** | El sistema permitirá fijar o modificar el precio de arriendo de una cancha. | Actualiza el valor monetario asociado a la cancha en la base de datos. | Admin |
| **RF-08** | El sistema permitirá eliminar una cancha del recinto. | Borra o desactiva la cancha, impidiendo que aparezca en nuevas búsquedas. | Admin |
| **RF-09** | El sistema mostrará un calendario interactivo con las reservas del día. | Renderiza una vista cronológica agrupando las reservas por cancha. | Admin |

### Requerimientos No Funcionales (RNF)
| ID | Atributo | Descripción y Métrica |
|---|---|---|
| **RNF-01** | Interfaz | El diseño será responsivo, adaptándose a pantallas móviles (viewport < 768px) y web de escritorio. |
| **RNF-02** | Rendimiento | Las consultas de disponibilidad de canchas deben resolverse y mostrarse en pantalla en un tiempo máximo de 2 segundos. |
| **RNF-03** | Seguridad | Las rutas de administración estarán protegidas; un Cliente no podrá acceder a `/admin/*` y será redirigido. |
| **RNF-04** | Concurrencia | El sistema aplicará bloqueo optimista en la base de datos en menos de 1 segundo para evitar que dos usuarios reserven el mismo bloque simultáneamente. |
| **RNF-05** | Usabilidad | La paleta de colores para el estado de las canchas debe cumplir con las normativas de contraste WCAG 2.1 (AA) para asegurar legibilidad. |
| **RNF-06** | Privacidad | El RUT y teléfono solicitados en el registro se utilizarán exclusivamente para validar la identidad física en el recinto; se prohíbe su exposición en perfiles públicos. |

---

## Arquitectura de Navegación y UX

### Adaptación por Dispositivo
- **Versión Móvil:** Navegación basada en un *Bottom Tab Bar* (barra inferior) para accesibilidad a una mano, priorizando el buscador y las reservas activas.
- **Versión Web (Escritorio):** Navegación basada en un *Side Menu* (menú lateral) para aprovechar el ancho de pantalla, ideal para la vista de calendario del administrador.

### Rutas y Accesos por Roles
**Rutas Públicas:**
- `/login` y `/registro`
- *Comportamiento:* Si el login es exitoso, el sistema valida el rol. Si es Cliente, redirige a `/cliente/inicio`. Si es Admin, redirige a `/admin/calendario`.

**Rutas Protegidas - Cliente:**
- `/cliente/inicio`: Buscador de recintos.
- `/cliente/cancha/:id`: Grilla de horarios de un recinto.
- `/cliente/mis-reservas`: Historial del jugador.
- *Comportamiento:* Si un Admin intenta entrar, el sistema lo bloquea y redirige a su panel.

**Rutas Protegidas - Administrador:**
- `/admin/calendario`: Vista central de reservas.
- `/admin/canchas`: Gestión de espacios y precios.
- *Comportamiento:* Si un Cliente intenta entrar, el sistema lo rechaza por falta de permisos.

**Ruta de Error:**
- `/*` -> Renderiza una pantalla **404 Not Found** genérica.

### Justificación Técnica
La arquitectura se diseñó buscando **escalabilidad** y **eficiencia**. Al separar los módulos de Cliente y Administrador mediante rutas anidadas y componentes de protección, evitamos cargar código innecesario para el usuario, mejorando el tiempo de respuesta. A nivel de **usabilidad** y **claridad estructural**, esto garantiza que la interfaz no se sature de opciones que el usuario actual no necesita usar, manteniendo flujos de tareas cortos y directos.

---

## Nuestros diseños en Figma
[Ver Prototipo Interactivo en Figma](https://www.figma.com/design/HMk4Bjnwq0eAr6vTQ2NcWn/Sin-t%C3%ADtulo?node-id=0-1&t=9lYpaFwlSHBVut0G-1)

---

## Instrucciones de Instalación y Ejecución (Monorepo)

Este proyecto está dividido en dos ecosistemas: Frontend (Cliente) y Backend (Servidor).

### Requisitos previos:
- Node.js (LTS recomendado).
- PostgreSQL instalado (para el backend).

### 1. Levantar el Backend (API REST)
1. Abrir terminal y navegar: `cd backend`
2. Instalar dependencias: `npm install`
3. Ejecutar el servidor: `node index.js`

### 2. Levantar el Frontend (Ionic/React)
1. Abrir **otra** terminal y navegar: `cd frontend`
2. Instalar dependencias: `npm install`
3. Levantar servidor local: `ionic serve`