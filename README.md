# Sistema de Reservas de Canchas Deportivas

# Presentado por:
- Bruno Adolfo Medina Lara
- Rodrigo
- Annais

## Índice
1. [Justificación del problema](#justificación-del-problema)
2. [Usuarios objetivo](#usuarios-objetivo-quién-usará-la-aplicación)
    - [Roles del Sistema](#roles-del-sistema)
    - [Proto-personas](#proto-personas)
3. [Requerimientos](#requerimientos)
4. [Arquitectura de Navegación / UX](#arquitectura-de-navegación)
    - [Diferenciación de acceso según roles](#diferenciación-de-acceso-según-roles)
    - [Flujos de Tareas](#flujos-de-tareas)
    - [Puntos críticos de interacción](#puntos-críticos-de-interacción)
    - [Justificación Técnica](#justificación-técnica)
5. [Bocetos UX/UI](#bocetos-uiux)
6. [Librerías y Tecnologías](#librerías-usadas-con-react-ionic)

---

## Justificación del problema
En el ámbito deportivo aficionado y recreativo, la organización de partidos y la búsqueda de espacios adecuados suele ser un proceso ineficiente. Actualmente, los deportistas o grupos de amigos deben contactar a múltiples recintos deportivos a través de llamadas telefónicas o mensajes de WhatsApp para consultar la disponibilidad de canchas, lo que genera demoras y frustración cuando no obtienen respuestas oportunas[cite: 1, 2].

Por otro lado, los administradores y dueños de recintos deportivos enfrentan dificultades en la gestión de sus espacios. El uso de agendas físicas o planillas básicas para registrar las reservas a menudo deriva en errores humanos, tales como la duplicidad de reservas (double-booking), la falta de seguimiento ante inasistencias o cancelaciones de última hora, y la dificultad para visualizar el rendimiento general del negocio.

En este contexto, el problema abordado por el proyecto corresponde a la necesidad de **centralizar, automatizar y optimizar la gestión de reservas de canchas deportivas, facilitando tanto el acceso a los usuarios como la administración a los recintos**.

El desarrollo de una plataforma web y móvil permitirá a los deportistas visualizar la disponibilidad en tiempo real, comparar opciones y asegurar su reserva de forma autónoma. Simultáneamente, dotará a los administradores de una herramienta digital para gestionar su oferta, visualizar su calendario de ocupación y reducir las fricciones administrativas.

---

## Usuarios objetivo (Quién usará la aplicación)
La aplicación considera principalmente dos grupos de usuarios: **deportistas (clientes) y administradores de recintos**.

### Deportistas (Clientes)
Corresponden a los usuarios finales que buscan un espacio para practicar deporte. Constituyen un grupo que valora la rapidez y la claridad en la información.
Entre las necesidades identificadas para este grupo se encuentran:
- buscar canchas filtrando por fecha, horario y tipo de deporte;
- visualizar la disponibilidad en tiempo real sin necesidad de llamar al recinto;
- reservar un espacio de forma rápida y segura desde un dispositivo móvil;
- llevar un registro de sus reservas futuras y pasadas;
- recibir confirmaciones claras de sus acciones.

### Administradores de Recintos
Constituyen el grupo encargado de gestionar la oferta deportiva. Su función principal es administrar la disponibilidad de los espacios físicos y supervisar las reservas.
Entre sus necesidades se encuentran:
- registrar y configurar las canchas disponibles en su complejo (precios, horarios, tipos);
- visualizar un calendario claro con el estado diario y semanal de ocupación;
- gestionar cancelaciones o modificaciones;
- evitar cruces de horarios u overbooking.

---

## Roles del Sistema
- **Cliente**: Usuario que busca, visualiza y reserva canchas deportivas.
- **Administrador**: Usuario encargado de gestionar las canchas de un recinto y visualizar el calendario de reservas.

---

## Proto-personas
Las siguientes proto-personas corresponden a **perfiles hipotéticos** construidos a partir del análisis del problema y de fuentes secundarias[cite: 1, 2]. No representan resultados obtenidos directamente de usuarios reales, sino una caracterización preliminar[cite: 1, 2].

### Proto-persona 1: Deportista aficionado
**Nombre ficticio:** Javier  
**Tipo de usuario o rol:** Cliente[cite: 2]

#### Características generales
Javier es un oficinista que organiza partidos de futbolito con sus amigos los días jueves después del trabajo. Usa exclusivamente su teléfono móvil para coordinar las actividades[cite: 2].

#### Necesidades principales
- Encontrar horarios disponibles entre las 19:00 y las 21:00 horas.
- Confirmar la reserva rápidamente para avisar al grupo[cite: 2].
- Acceder a la plataforma desde el móvil en sus trayectos[cite: 2].

#### Dificultades o puntos de frustración
- Escribir a 3 complejos deportivos distintos y que le respondan horas después[cite: 2].
- Llegar a una cancha y descubrir que su reserva no fue anotada correctamente[cite: 2].

#### Funcionalidades de la aplicación que utilizaría
- Buscador de canchas con filtros[cite: 2].
- Visualización de disponibilidad[cite: 2].
- Confirmación de reserva[cite: 2].
- Historial de reservas[cite: 2].

#### Dispositivo y contexto probable de acceso
Utilizaría principalmente un **teléfono móvil** durante breves pausas en su trabajo o desplazamientos[cite: 2].

---

### Proto-persona 2: Dueño de recinto deportivo
**Nombre ficticio:** Marcela  
**Tipo de usuario o rol:** Administrador[cite: 2]

#### Características generales
Marcela administra un complejo con 4 canchas de pádel y 2 de futbolito. Recibe constantemente mensajes de WhatsApp y llamadas telefónicas solicitando disponibilidad[cite: 2].

#### Necesidades principales
- Visualizar rápidamente qué canchas están ocupadas hoy[cite: 2].
- Bloquear horarios por mantenimiento[cite: 2].
- Llevar un registro digital que reemplace su cuaderno de reservas[cite: 2].

#### Dificultades o puntos de frustración
- Anotar a dos grupos distintos en la misma cancha a la misma hora por error[cite: 2].
- Perder tiempo respondiendo mensajes a clientes preguntando por horarios que ya están ocupados[cite: 2].

#### Funcionalidades de la aplicación que utilizaría
- Dashboard o panel de control de reservas[cite: 2].
- Gestión (creación, edición) de canchas[cite: 2].
- Vista de calendario[cite: 2].

#### Dispositivo y contexto probable de acceso
Utilizaría principalmente un **computador portátil o tablet** desde la recepción de su recinto deportivo[cite: 2].

---

## Requerimientos

### Requerimientos Funcionales por Rol
Se definen al menos 7 requerimientos funcionales excluyendo autenticación[cite: 1].

| ID | Requerimiento funcional | Rol |
|---|---|---|
| **RF-01** | El sistema deberá permitir al cliente buscar canchas deportivas aplicando filtros de tipo de deporte, fecha, horario y ubicación. | Cliente |
| **RF-02** | El sistema deberá presentar al cliente una grilla visual con la disponibilidad en tiempo real de las canchas. | Cliente |
| **RF-03** | El sistema deberá permitir al cliente confirmar la reserva de una cancha en un bloque horario disponible. | Cliente |
| **RF-04** | El sistema deberá permitir al cliente visualizar un listado con el estado de sus reservas vigentes y pasadas. | Cliente |
| **RF-05** | El sistema deberá permitir al cliente cancelar una reserva vigente, liberando el bloque horario automáticamente en el sistema. | Cliente |
| **RF-06** | El sistema deberá permitir al administrador gestionar (crear, modificar y eliminar) la información de las canchas de su recinto (nombre, tipo de deporte, precio por bloque). | Administrador |
| **RF-07** | El sistema deberá permitir al administrador visualizar un calendario o dashboard con todas las reservas confirmadas de su complejo. | Administrador |

### Requerimientos No Funcionales
Se definen 5 requerimientos no funcionales orientados a calidad[cite: 1].

- **RNF-01 (Usabilidad - Diseño Adaptable):** La interfaz deberá adaptarse a dispositivos móviles (prioridad cliente) y de escritorio (prioridad administrador), asegurando la accesibilidad a las funciones[cite: 2].
- **RNF-02 (Rendimiento):** El sistema deberá retornar los resultados de disponibilidad de canchas en un tiempo de respuesta óptimo para no interrumpir el flujo de reserva[cite: 2].
- **RNF-03 (Seguridad - Roles):** El sistema deberá restringir las vistas de gestión de recintos exclusivamente a los usuarios con rol de Administrador[cite: 2].
- **RNF-04 (UX - Prevención de errores):** El sistema deberá bloquear automáticamente un horario en tiempo real mientras un usuario está confirmando su reserva para evitar cruces (double-booking)[cite: 2].
- **RNF-05 (UX - Claridad Visual):** La disponibilidad de las canchas deberá diferenciarse claramente mediante códigos de color (ej. verde disponible, gris/rojo ocupado) para reducir la carga cognitiva[cite: 2].

---

## Arquitectura de Navegación

### Rutas principales y secundarias[cite: 2]

#### Rutas públicas
| Ruta | Vista | Descripción |
|---|---|---|
| `/login` | Inicio de sesión | Ingreso al sistema[cite: 2]. |
| `/registro` | Registro | Creación de cuenta[cite: 2]. |

#### Rutas protegidas del Cliente
| Ruta | Vista | Descripción |
|---|---|---|
| `/cliente/inicio` | Buscador | Buscador principal de canchas por fecha y deporte[cite: 2]. |
| `/cliente/canchas/:id` | Detalle | Vista de la disponibilidad de un recinto específico[cite: 2]. |
| `/cliente/mis-reservas` | Historial | Listado de reservas del usuario[cite: 2]. |
| `/cliente/perfil` | Perfil | Datos personales del cliente[cite: 2]. |

#### Rutas protegidas del Administrador
| Ruta | Vista | Descripción |
|---|---|---|
| `/admin/dashboard` | Inicio Admin | Resumen diario de ocupación[cite: 2]. |
| `/admin/canchas` | Gestión Canchas | CRUD de las canchas del recinto[cite: 2]. |
| `/admin/calendario` | Calendario | Vista expandida de todas las reservas[cite: 2]. |

### Diferenciación de acceso según roles[cite: 2]
- **Cliente:** Solo tiene acceso a la búsqueda, visualización y generación de reservas. No puede modificar recintos[cite: 2].
- **Administrador:** Solo visualiza y edita la información de su propio recinto y las reservas asociadas a este. No tiene sentido que acceda al buscador general de clientes[cite: 2].

### Flujos de Tareas[cite: 2]

**Task Flow 1: Reserva de Cancha (Cliente)**
```text
Inicio de sesión -> Inicio (Buscador) -> Aplicar filtros (ej. Fútbol, Jueves) -> Ver resultados -> Seleccionar recinto -> Ver horarios disponibles -> Elegir bloque -> Confirmar reserva -> Ver detalle en 'Mis Reservas'.
