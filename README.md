# Sistema de Reservas de Canchas Deportivas (Fútbol 7, Tenis y Pádel)

## Presentado por:
- **Bruno Medina:** Configuración del servidor backend (Node.js/Express), conexión a PostgreSQL, diseño del modelo relacional (MER) e implementación de la lógica del Modo Administrador.
- **Antonio Navarro:** Integración del frontend (Ionic/React) con la API REST, consumo de endpoints (fetch/Axios), manejo de tokens JWT en el almacenamiento local y validaciones de seguridad.
- **Annais Legua:** Implementación de rutas protegidas en el frontend, gestión del estado de la sesión, redacción del script de base de datos (`init.sql`) y pruebas funcionales en Postman.

---

## Índice
1. [De qué trata el problema](#de-qué-trata-el-problema)
2. [Quiénes usarán la app](#quiénes-usarán-la-app)
3. [Requerimientos del Sistema](#requerimientos-del-sistema)
4. [Arquitectura de Navegación y UX](#arquitectura-de-navegación-y-ux)
5. [Nuestros diseños en Figma](#nuestros-diseños-en-figma)
6. [Modelo Relacional de la Base de Datos](#modelo-relacional-de-la-base-de-datos)
7. [Instrucciones de Instalación y Ejecución](#instrucciones-de-instalación-y-ejecución)
---

## De qué trata el problema
La gestión de reservas en recintos deportivos de nivel amateur e independiente suele realizarse de manera informal, utilizando cuadernos o planillas de cálculo básicas. Según estimaciones del sector, el auge de deportes como el Pádel y el Fútbol 7 ha generado una sobredemanda de recintos, lo que satura los canales de comunicación tradicionales (WhatsApp, llamadas). Si bien existen soluciones en el mercado como EasyCancha, muchos recintos pequeños no acceden a ellas por costos o complejidad, manteniéndose en la informalidad.

**Consecuencias de no resolver el problema:**
Si este problema persiste, los recintos continuarán enfrentando pérdidas de ingresos por topes de horarios (doble reserva) y cancelaciones de última hora sin capacidad de reacción. Por el lado del usuario, la fricción de tener que contactar a múltiples recintos genera desorganización, pérdida de tiempo y, a menudo, la disolución del grupo deportivo por no concretar una reserva a tiempo.

Nuestra solución busca democratizar el acceso a un sistema digital mediante una aplicación web y móvil ligera, centrada estrictamente en la visualización de disponibilidad y la reserva rápida.

---

## Quiénes usarán la app

**Proto-personas y Supuestos**

*Nota: Los siguientes perfiles representan a los usuarios objetivos del sistema, alineando sus necesidades con las funcionalidades reales implementadas en la plataforma.*

**1. El organizador del grupo (Cliente)**
* **Nombre:** Javier.
* **Nivel tecnológico:** Alto, usuario frecuente de aplicaciones web y móviles.
* **Necesidad principal:** Encontrar disponibilidad inmediata de canchas, agendar de forma autónoma y llevar un registro claro de sus partidos.
* **Interacción con el sistema (Evidencia):** Navega a través de categorías deportivas mediante tarjetas visuales (Fútbol, Pádel, Tenis, etc.) y utiliza filtros específicos de fecha y hora para encontrar disponibilidad. Gestiona su cuenta administrando datos personales, métodos de pago y revisa su historial para confirmar estados o solicitar la cancelación de un turno.

**2. La dueña del recinto (Administrador)**
* **Nombre:** Marcela.
* **Nivel tecnológico:** Medio, utiliza el computador del mesón de recepción para tareas administrativas.
* **Necesidad principal:** Centralizar la información, evitar choques de horario y gestionar las modificaciones de los clientes rápidamente.
* **Interacción con el sistema (Evidencia):** Opera desde un panel de control (Dashboard) optimizado para escritorio con alto contraste. Supervisa indicadores en tiempo real mediante tarjetas de métricas (reservas registradas, confirmadas, canceladas y cancelaciones pendientes) y utiliza el buscador de calendario para auditar los turnos de una fecha específica.
---

## Requerimientos del Sistema

### Requerimientos Funcionales (RF)

| ID | Descripción | Verificabilidad (Resultado esperado) | Rol |
| :--- | :--- | :--- | :--- |
| **RF-01** | El sistema permitirá la autenticación de usuarios y validación de roles. | Concede acceso a vistas específicas (Cliente o Administrador) según las credenciales ingresadas. | Ambos |
| **RF-02** | El sistema permitirá buscar disponibilidad filtrando por deporte, fecha (máx. 1 mes) y rango horario. | Retorna una lista de canchas disponibles que coinciden con los parámetros de búsqueda. | Cliente |
| **RF-03** | El sistema permitirá confirmar una reserva en un bloque disponible. | Genera un registro en la base de datos y cambia el estado de disponibilidad del bloque horario. | Cliente |
| **RF-04** | El sistema permitirá visualizar el historial de reservas activas e históricas. | Renderiza una lista con la fecha, hora, estado, precio y cancha asociada al usuario. | Cliente |
| **RF-05** | El sistema permitirá solicitar la cancelación de una reserva activa. | Cambia el estado de la reserva a "Pendiente de cancelación", requiriendo aprobación del administrador. | Cliente |
| **RF-06** | El sistema permitirá gestionar datos personales y cambiar contraseñas. | Actualiza la información de contacto o las credenciales de acceso del usuario en la base de datos. | Cliente |
| **RF-07** | El sistema permitirá agregar tarjetas como métodos de pago. | Registra los datos de la tarjeta asociados a la cuenta del usuario para futuras transacciones. | Cliente |
| **RF-08** | El sistema mostrará un panel de métricas generales (Dashboard). | Renderiza tarjetas con el total de reservas, confirmadas, canceladas y cancelaciones pendientes. | Admin |
| **RF-09** | El sistema permitirá buscar y auditar reservas por fecha. | Renderiza una lista detallada de todos los turnos registrados para una fecha seleccionada. | Admin |
| **RF-10** | El sistema permitirá aprobar o rechazar solicitudes de cancelación. | Cambia el estado de la reserva a "Cancelada" o mantiene la confirmación inicial tras la revisión. | Admin |
| **RF-11** | El sistema permitirá agregar, modificar o eliminar canchas del recinto. | Actualiza el inventario, precio o estado operativo de las instalaciones en la base de datos. | Admin |

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
* **Versión Web (Enfoque actual):** La interfaz está optimizada actualmente para navegadores de escritorio. Utiliza un menú lateral (Side Menu) para el cliente y un panel de control (Dashboard) expandido para el administrador, aprovechando el ancho de pantalla para gestionar el calendario y las métricas.
* **Escalabilidad Móvil:** Al estar construido sobre Ionic Framework y React, el proyecto posee la base técnica nativa para adaptarse a pantallas pequeñas y compilarse como aplicación móvil en futuras iteraciones de desarrollo.

### Rutas y Accesos por Roles

**Rutas Públicas:**
* `/login` y `/registro`.
* *Comportamiento:* Si la autenticación es exitosa, el sistema decodifica el rol del usuario. Si es Cliente, redirige a `/cliente/inicio`. Si es Admin, redirige a `/admin/calendario`.

**Rutas Protegidas - Cliente:**
* `/cliente/inicio`: Buscador principal de recintos deportivos por categoría.
* `/cliente/cancha/:id`: Grilla interactiva de horarios para un recinto específico.
* `/cliente/perfil`: Centro de gestión del usuario (agrupa las pestañas de Datos Personales, Mis Reservas y Métodos de Pago).
* *Comportamiento:* Si un Administrador intenta entrar a estas rutas, el sistema lo bloquea y redirige a su panel.

**Rutas Protegidas - Administrador:**
* `/admin/calendario`: Dashboard central con métricas y buscador de reservas.
* `/admin/canchas`: Gestión de espacios, disponibilidad y modificación de precios.
* *Comportamiento:* Si un Cliente intenta entrar, el sistema lo rechaza inmediatamente por falta de permisos.

**Ruta de Error:**
* `/*` -> Renderiza una pantalla genérica de **404 Not Found**.

---

### Justificación Técnica
La arquitectura de navegación se diseñó priorizando la **escalabilidad y la eficiencia**. Al separar los módulos de Cliente y Administrador mediante rutas anidadas y componentes de protección, evitamos cargar código innecesario, lo que mejora los tiempos de respuesta del sistema. 

A nivel de **usabilidad y claridad estructural**, esto garantiza que la interfaz gráfica no se sature de opciones irrelevantes para el rol activo, manteniendo flujos de tareas cortos, seguros y directos.
---

## Nuestros diseños en Figma
[Ver Prototipo Interactivo en Figma](https://www.figma.com/design/HMk4Bjnwq0eAr6vTQ2NcWn/Sin-t%C3%ADtulo?node-id=0-1&t=9lYpaFwlSHBVut0G-1)

---

### Modelo Relacional de la Base de Datos

A continuación se presenta el Modelo Entidad-Relación (MER) diseñado para el sistema de reservas de canchas "FaltaUno", detallando las entidades principales, sus atributos, claves primarias (PK) y claves foráneas (FK):

<img width="5664" height="2547" alt="erdplus" src="https://github.com/user-attachments/assets/ad64658f-83c0-48d6-96c9-d6fd82d15182" />


---
## Instrucciones de Instalación y Ejecución (Monorepo)

Este proyecto está dividido en dos ecosistemas: Frontend (Cliente) y Backend (Servidor).

### Requisitos previos:
- Node.js (LTS recomendado).
- PostgreSQL instalado (para el backend).
- Instalar la CLI de Ionic (si ya la tiene omita esto).

### 1. Configurar la Base de Datos
1. Abre tu gestor de base de datos PostgreSQL (ej. pgAdmin).
2. Crea una base de datos vacía (idealmente llamada `reservas_canchas`).
3. Abre y ejecuta el archivo `init.sql` (ubicado dentro de la carpeta `backend`) para crear las tablas y los datos de prueba.

### 2. Levantar el Backend (API REST)
1. Abrir terminal y navegar: `cd backend`
2. Instalar dependencias: `npm install`
3. **Paso crítico (Variables de Entorno):** Crea un archivo llamado exactamente `.env` en la raíz de la carpeta `backend` e ingresa tu contraseña local de PostgreSQL (en tu_contrasena_de_pgadmin). El formato debe ser el siguiente:
    ```env
    PORT=3000
    DB_USER=postgres
    DB_PASSWORD=tu_contrasena_de_pgadmin
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=reservas_canchas
    JWT_SECRET=tu_secreto_para_tokens
    ```
4. Ejecutar el servidor: `npm run dev`

### 3. Levantar el Frontend (Ionic/React)
1. Abrir **otra** terminal y navegar: `cd frontend`
2. Instalar la CLI de Ionic a nivel global (requisito previo): `npm install -g @ionic/cli`
3. Instalar dependencias: `npm install`
4. Levantar servidor local: `ionic serve`

### 4. Cuentas de Prueba (Accesos por Rol)

Para facilitar la evaluación del sistema, el script de la base de datos (`init.sql`) genera automáticamente cuentas preconfiguradas. Ingresa las siguientes credenciales en la pantalla de inicio de sesión (`/login`) para probar las distintas interfaces y permisos:

**Modo Administrador (Dueño del recinto):**
* **Correo:** admin@faltauno.cl
* **Contraseña:** 123456
* **Acceso:** Redirige al Dashboard de métricas y calendario (`/admin/calendario`).

**Modo Cliente (Jugador):**
* **Correo:** jugador@faltauno.cl
* **Contraseña:** 123456
* **Acceso:** Redirige al buscador de recintos deportivos (`/cliente/inicio`).

---
