# FaltaUno - Sistema de Reservas de Canchas Deportivas

## 1. Identificación del Equipo y Responsabilidades

- **Bruno Medina:** Configuración de la arquitectura del servidor backend (Node.js/Express), diseño e implementación del modelo relacional en PostgreSQL (MER) y desarrollo de la lógica de administración.
- **Antonio Navarro:** Integración del frontend (Ionic/React) con la API REST, consumo directo de endpoints en vistas, depuración de errores, validaciones de seguridad en formularios, ejecución de pruebas en Postman, integración de APIs externas (Open-Meteo y Feriados Chile), implementación del sistema de notificaciones automáticas con EmailJS, configuración de seguridad HTTP (Helmet) y dockerización del frontend/backend.
- **Annais Legua:** Diseño de la interfaz de usuario (UI/UX) y desarrollo del frontend, incluyendo la vista de Modo Administrador, módulo de métodos de pago, edición de perfil, solicitudes de cancelación de canchas y redacción del script de inicialización de base de datos (`init.sql`).

---

## 2. Descripción General del Sistema

### Problema o Necesidad que Aborda

La gestión de reservas en recintos deportivos de nivel amateur (Fútbol 7, Tenis, Pádel) suele realizarse de manera informal mediante cuadernos o mensajería instantánea. Esto genera una sobredemanda mal gestionada, provocando pérdidas de ingresos por topes de horarios (doble reserva) y cancelaciones de última hora. Para el usuario, la fricción de contactar a múltiples recintos genera pérdida de tiempo y dificulta la coordinación de los grupos deportivos.

### Objetivos del Proyecto

Democratizar el acceso a un sistema digital mediante una aplicación web y móvil para recintos independientes. El sistema está centrado en visualizar la disponibilidad de canchas, permitir el agendamiento autónomo y centralizar la administración del recinto para evitar errores humanos y superposición de horarios.

---

## 3. Caracterización de Usuarios Objetivo

*Nota: Los perfiles construidos a continuación corresponden a una caracterización preliminar basada en fuentes secundarias (entrevistas informales y análisis de soluciones existentes) y supuestos razonados, no a resultados obtenidos de usuarios reales.*

### Proto-Persona 1: Javier (Cliente / Organizador)

- **Tipo de usuario o rol:** Cliente.
- **Características generales:** 24 años, estudiante universitario o joven profesional, nivel de experiencia tecnológica alto (usuario frecuente de aplicaciones móviles).
- **Necesidades principales:** Encontrar disponibilidad inmediata de canchas sin depender de respuestas asíncronas por chat o llamadas telefónicas.
- **Objetivos de uso:** Visualizar las opciones disponibles y concretar una reserva de forma autónoma en minutos.
- **Dificultades o puntos de frustración:** Perder tiempo consultando disponibilidad, o llegar al recinto y descubrir que la cancha está ocupada por un error administrativo.
- **Funcionalidades que utilizaría:** Buscador de canchas por fecha y deporte, consulta de horarios, confirmación de reservas, visualización del historial, gestión de métodos de pago y solicitud de cancelaciones.
- **Dispositivo y contexto probable de acceso:** Teléfono móvil (iOS/Android), uso en movimiento o durante pausas breves.
- **Supuestos:** Se asume que prefiere interactuar con una interfaz visual de bloques horarios en lugar de extensas listas de texto.

### Proto-Persona 2: Marcela (Administradora del Recinto)

- **Tipo de usuario o rol:** Administrador.
- **Características generales:** 45 años, dueña o administradora de un recinto deportivo, nivel de experiencia tecnológica medio-bajo (uso principal de ofimática básica).
- **Necesidades principales:** Centralizar las reservas en una única plataforma automatizada para evitar choques de horario.
- **Objetivos de uso:** Visualizar rápidamente la ocupación diaria y gestionar la oferta de canchas.
- **Dificultades o puntos de frustración:** Clientes que no asisten sin cancelar previamente y la superposición de reservas anotadas manualmente por distintos empleados.
- **Funcionalidades que utilizaría:** Calendario administrativo, consulta de reservas y gestión de canchas.
- **Dispositivo y contexto probable de acceso:** Computador de escritorio o tablet de uso estático en el mesón de recepción.
- **Supuestos:** Se asume que requiere interfaces de alto contraste, tipografía legible y navegación simplificada para mitigar errores de entrada de datos.

---

## 4. Requerimientos del Sistema

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
| **RF-12** | El sistema enviará un comprobante de reserva automático al correo electrónico del cliente tras un pago exitoso (vía EmailJS). | Genera y envía un correo real a la bandeja de entrada del usuario. | Cliente |
| **RF-13** | El sistema consultará y mostrará advertencias dinámicas de días feriados y el pronóstico del clima para la fecha seleccionada. | Renderiza alertas visuales en el buscador si la fecha coincide con feriados o condiciones climáticas específicas. | Cliente |

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

## 5. Arquitectura de Navegación y Experiencia de Usuario

### Relaciones Jerárquicas y Rutas

La aplicación define las siguientes rutas en el archivo `frontend/src/App.tsx`:

- **Rutas públicas:**
  - `/login` (Inicio de sesión).
  - `/registro` (Registro de usuarios).

- **Rutas correspondientes al Cliente:**
  - `/cliente/inicio` (Buscador principal de canchas).
  - `/cliente/perfil` (Perfil del usuario, que reúne datos personales, reservas y métodos de pago).
  - `/cliente/horarios/:id` (Consulta y selección de horarios de una cancha).
  - `/cliente/pago/:id` (Proceso de reserva y pago simulado).

- **Rutas correspondientes al Administrador:**
  - `/admin/calendario` (Calendario administrativo).
  - `/admin/canchas` (Gestión de canchas).

- **Ruta inicial:**
  - `/` (Redirige a `/cliente/inicio`).

La disponibilidad de las funcionalidades para cada tipo de usuario depende de la autenticación y el rol correspondiente.

### Flujo de Tareas Principales (Task Flow)

- **Task Flow de Reserva (Cliente):** Iniciar sesión → Pantalla de inicio → Seleccionar deporte y fecha → Consultar canchas y horarios disponibles → Seleccionar un bloque horario → Continuar al proceso de pago → Confirmar la reserva.

- **Task Flow de Gestión de Perfil (Cliente):** Iniciar sesión → Ingresar a Mi perfil → Consultar o modificar datos personales → Revisar reservas → Gestionar métodos de pago.

- **Task Flow de Administración:** Iniciar sesión con una cuenta administradora → Ingresar al calendario administrativo → Consultar reservas → Acceder al módulo de gestión de canchas.

### Puntos Críticos de Interacción

1. **Validación de Formularios:** Los formularios de registro y adición de tarjetas cuentan con validaciones para prevenir el ingreso de datos incompletos, inválidos o duplicados.
2. **Autenticación:** El sistema utiliza tokens JWT para identificar al usuario autenticado en las operaciones que requieren autorización.
3. **Solicitud de Cancelación:** Se contempla la confirmación de las solicitudes para evitar acciones accidentales.
4. **Disponibilidad de Horarios:** El backend valida los horarios antes de registrar una reserva para evitar superposiciones.

### Coherencia entre Dispositivos y Justificación Técnica

La arquitectura de la aplicación utiliza React Router, integrado con Ionic, para gestionar la navegación entre las distintas vistas. La interfaz busca mantener una organización visual clara y facilitar el acceso a las funcionalidades correspondientes a clientes y administradores.

---

## 6. Diseño UI/UX

**[Visualizar Prototipo Interactivo en Figma](https://www.figma.com/design/HMk4Bjnwq0eAr6vTQ2NcWn/Sin-t%C3%ADtulo?node-id=0-1&t=9lYpaFwlSHBVut0G-1)**

---

## 7. Modelo Relacional de la Base de Datos

El sistema utiliza un modelo relacional gestionado a través de PostgreSQL, asegurando la integridad referencial entre las entidades Usuarios, Canchas, Reservas y Métodos de Pago.

Las entidades principales son:

- **Usuarios:** almacena información personal, credenciales y rol de cada usuario.
- **Canchas:** almacena el nombre, tipo de deporte, precio por hora y disponibilidad de las canchas.
- **Reservas:** almacena el usuario asociado, la cancha, fecha, horario, estado y motivo de cancelación.
- **MetodosPago:** almacena los métodos de pago asociados a cada usuario, incluyendo marca, últimos cuatro dígitos, titular y vencimiento.

![Modelo Relacional](<img width="724" height="699" alt="image" src="https://github.com/user-attachments/assets/6bbbe1bf-68df-48eb-bdbd-101bf8535a2a" />
)

---

## 8. Tecnologías y Herramientas Utilizadas

- **Frontend:** Ionic Framework, React, TypeScript y Vite.
- **Backend:** Node.js y Express.js.
- **Base de Datos:** PostgreSQL y paquete `pg`.
- **Seguridad y Autenticación:** JSON Web Tokens (JWT), BcryptJS (hashing de contraseñas) y Helmet (seguridad HTTP).
- **APIs y Servicios de Terceros:**
  - **EmailJS:** Para el envío automatizado de comprobantes de reserva.
  - **Open-Meteo API:** Para el pronóstico del clima en tiempo real.
  - **Feriados Chile API (Víctor San Martín):** Para advertencias dinámicas de días festivos.
- **Contenerización y Despliegue:** Docker y Docker Compose.
- **Control de versiones:** Git y GitHub.
- **Herramientas de pruebas y diseño:** Postman y Figma.

---

## 9. Instrucciones de Instalación, Configuración y Ejecución

El proyecto puede ejecutarse de dos maneras: levantando el **entorno local de forma manual** (PostgreSQL, Backend y Frontend por separado) o mediante **Docker Compose**, que levanta y conecta los tres servicios automáticamente.

### Paso Previo: Obtener el Código Fuente desde GitHub

Este paso es común para ambas modalidades de ejecución.

**Opción A (Mediante Git):**

1. Abra una terminal o consola de comandos.
2. Ejecute:

   ```bash
   git clone https://github.com/AntonioNH1/INF3245-INGENIERIA_WEB_MOVIL.git
   ```

3. Ingrese a la carpeta del proyecto:

   ```bash
   cd INF3245-INGENIERIA_WEB_MOVIL
   ```

**Opción B (Descarga directa):**

1. En la página principal del repositorio en GitHub, haga clic en el botón verde **Code**.
2. Seleccione **Download ZIP**.
3. Extraiga el archivo comprimido en una ruta accesible de su equipo y abra la carpeta resultante en Visual Studio Code.

---

### Modalidad 1: Ejecución Manual (Frontend y Backend por separado)

Esta modalidad requiere tener instalados y configurados los servicios directamente en el equipo local.

#### Requisitos previos

- Node.js instalado.
- PostgreSQL instalado y funcionando.
- pgAdmin para administrar la base de datos.
- Visual Studio Code u otro editor de código.
- Postman para realizar las pruebas de la API (opcional).

#### Paso 1: Configuración de la Base de Datos

1. Inicie el servicio local de PostgreSQL y abra pgAdmin.
2. En el panel izquierdo, despliegue el servidor PostgreSQL correspondiente.
3. Haga clic derecho sobre **Databases** y seleccione **Create → Database**.
4. En el campo **Database**, escriba `faltauno`.
5. Mantenga como propietario el usuario correspondiente a su instalación de PostgreSQL (por ejemplo, `postgres`).
6. Presione **Save** para crear la base de datos.

**Ejecución del archivo `init.sql`:**

1. En pgAdmin, seleccione la base de datos `faltauno`.
2. Haga clic derecho sobre ella y seleccione **Query Tool**.
3. En la ventana de consulta, abra el archivo `init.sql`, ubicado dentro de la carpeta `backend` del proyecto.
4. Compruebe que la conexión de Query Tool corresponda a la base de datos `faltauno`.
5. Ejecute el script utilizando el botón de ejecución o la tecla `F5`.
6. Revise la pestaña **Messages** y compruebe que la consulta termine correctamente.

> **Importante:** En ejecución manual, el backend no ejecuta automáticamente el archivo `init.sql`; por lo tanto, debe cargarse desde pgAdmin antes de iniciar las pruebas. El script crea las tablas `Usuarios`, `Canchas`, `Reservas` y `MetodosPago` e inserta los datos iniciales de prueba.

#### Paso 2: Configuración y Ejecución del Servidor (Backend)

1. Abra una terminal en Visual Studio Code e ingrese al directorio del servidor:

   ```bash
   cd backend
   ```

2. Instale las dependencias necesarias:

   ```bash
   npm install
   ```

3. Cree un archivo denominado `.env` en la raíz de la carpeta `backend` con sus credenciales locales de PostgreSQL:

   ```env
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=SU_CONTRASENA_DE_POSTGRESQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=faltauno
   JWT_SECRET=SU_CLAVE_SECRETA
   ```

4. Inicie el servidor ejecutando:

   ```bash
   npm run dev
   ```

5. Compruebe que la terminal indique que el servidor está escuchando en `http://localhost:3000` y que se estableció la conexión con PostgreSQL. Mantenga esta terminal abierta.

*(Nota para Windows: si PowerShell bloquea la ejecución de `npm` por sus políticas de ejecución, utilice `npm.cmd install` y `npm.cmd run dev`).*

#### Paso 3: Ejecución de la Aplicación (Frontend)

1. Abra una nueva pestaña de terminal en la carpeta principal del proyecto e ingrese al directorio del cliente:

   ```bash
   cd frontend
   ```

2. Instale las dependencias:

   ```bash
   npm install
   ```

3. Inicie el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abra en el navegador web la dirección indicada por Vite (por defecto `http://localhost:5173`). Mantenga ambas terminales abiertas mientras utilice FaltaUno.

---

### Modalidad 2: Ejecución con Docker (Despliegue Contenerizado)

Esta modalidad orquesta automáticamente la base de datos PostgreSQL (con carga automática de `backend/init.sql`), la API en Node.js y el Frontend compilado, sin necesidad de instalar Node.js, instalar PostgreSQL ni crear manualmente el archivo `.env`.

#### Requisitos previos

- **Docker Desktop** instalado y en ejecución (motor en estado activo / verde).
- Puertos `3000`, `5173` y `5433` disponibles (detenga previamente cualquier instancia manual del backend o frontend).

#### Paso 1: Construir y levantar los contenedores

Desde la raíz del proyecto (`INF3245-INGENIERIA_WEB_MOVIL`), ejecute en una terminal:

```bash
docker compose up --build
```

*(Si desea liberar la terminal y ejecutar los contenedores en segundo plano, agregue la bandera `-d`: `docker compose up --build -d`).*

#### Paso 2: Verificar los servicios activos

En otra terminal puede comprobar que los tres contenedores (`faltauno-db`, `faltauno-backend` y `faltauno-frontend`) estén activos con:

```bash
docker compose ps
```

#### Paso 3: Acceder a la aplicación

Una vez que los logs confirmen que el backend estableció conexión con PostgreSQL, acceda desde el navegador:

- **Frontend (Aplicación Web):** `http://localhost:5173`
- **Backend (API REST):** `http://localhost:3000`
- **Base de Datos PostgreSQL (puerto externo):** `localhost:5433` (usuario: `postgres`, contraseña: `admin`, base de datos: `faltauno`).

#### Comandos útiles de Docker

- **Volver a levantar sin cambios en el código:**
  ```bash
  docker compose up
  ```
- **Detener los contenedores conservando los datos registrados:**
  ```bash
  docker compose down
  ```
- **Reiniciar la base de datos desde cero (elimina el volumen y vuelve a ejecutar `init.sql`):**
  ```bash
  docker compose down -v
  docker compose up
  ```

---

### Cuentas de Prueba (Accesos por Rol)

El archivo `init.sql` incorpora usuarios de prueba disponibles en ambas modalidades de ejecución:

**Modo Administrador:**

- **Nombre:** Admin General.
- **Correo:** `admin@faltauno.cl`
- **Contraseña:** `123456`
- **Rol:** `admin`.

**Modo Cliente:**

- **Nombre:** Jugador Estrella.
- **Correo:** `jugador@faltauno.cl`
- **Contraseña:** `123456`
- **Rol:** `cliente`.

**Asignación del rol de administrador a otro usuario:**

Para otorgar el rol de administrador a un usuario ya registrado, ejecute la siguiente sentencia SQL en la base de datos `faltauno` (ya sea desde **pgAdmin** en el puerto `5432` para ejecución manual / puerto `5433` para Docker, o desde la consola del contenedor con `docker exec -it faltauno-db psql -U postgres -d faltauno`):

```sql
UPDATE Usuarios
SET rol = 'admin'
WHERE email = 'correo_del_usuario@ejemplo.com';
```

Para comprobar el cambio:

```sql
SELECT id, nombre, email, rol
FROM Usuarios
WHERE email = 'correo_del_usuario@ejemplo.com';
```

Posteriormente, el usuario debe cerrar sesión y volver a iniciarla para obtener un nuevo token JWT con su rol actualizado.

> **Nota:** Las credenciales de prueba son para fines académicos y no deben utilizarse en un entorno de producción.

### Consideraciones de Seguridad

- El archivo `.env` contiene credenciales privadas y no debe subirse al repositorio de GitHub.
- Cada integrante debe configurar sus propias credenciales de PostgreSQL en modo local.
- La variable `JWT_SECRET` debe contener una clave secreta propia.
- No se deben almacenar números completos de tarjetas ni códigos de seguridad CVV en la base de datos.
- Los métodos de pago almacenan información parcial de las tarjetas.
- El proceso de pago de la aplicación es una simulación y no realiza cobros reales mediante una pasarela de pago.
---

## 10. Pruebas de la API mediante Postman

Para evaluar el funcionamiento de los endpoints de la API REST de FaltaUno, se proporciona una colección de solicitudes HTTP que permite probar las operaciones del sistema y sus validaciones.

El archivo de la colección se encuentra en la carpeta `backend` con el nombre:

`Api FaltaUno.postman_collection.json`

### Paso 1: Requisitos previos (Levantar el servidor)

Antes de realizar las pruebas, asegúrese de que:

1. PostgreSQL esté funcionando.
2. La base de datos `faltauno` esté creada y tenga sus tablas inicializadas mediante `init.sql`.
3. El archivo `.env` esté configurado correctamente.
4. El servidor backend esté iniciado desde la carpeta `backend` mediante:

   ```bash
   npm run dev
   ```

5. El servidor esté disponible en:

   `http://localhost:3000`

Mantenga abierta la terminal del backend durante las pruebas.

### Paso 2: Importar la colección en Postman

1. Abra la aplicación Postman.
2. Seleccione el botón **Import**.
3. Seleccione la opción **Files** o **Choose Files**.
4. Busque el archivo `Api FaltaUno.postman_collection.json` dentro de la carpeta `backend`.
5. Seleccione el archivo y presione **Import**.
6. Compruebe que aparezca la colección **Api FaltaUno** en el panel lateral, dentro de **Collections**.
7. Abra la colección para visualizar las solicitudes disponibles.

### Paso 3: Registro de usuario

1. Abra la solicitud denominada **Registro**.
2. Revise el método HTTP, la URL y los datos del cuerpo de la solicitud (Body).
3. Presione **Send**.
4. Compruebe que la respuesta sea `201 Created` si el registro se realizó correctamente.

Para probar la validación de registros duplicados, ejecute la solicitud **Registro Duplicado**. La respuesta esperada, según las instrucciones de las pruebas entregadas, es `409 Conflict`.

### Paso 4: Inicio de sesión y obtención del token JWT

1. Abra la solicitud **Login Exitoso**.
2. Presione **Send**.
3. Compruebe que la respuesta sea `200 OK`.
4. En el cuerpo de la respuesta, identifique el campo `token`.
5. Copie el token completo, sin las comillas.

También se pueden utilizar las cuentas de prueba definidas en `init.sql`:

- Administrador: `admin@faltauno.cl` / `123456`.
- Cliente: `jugador@faltauno.cl` / `123456`.

### Paso 5: Configuración del token de autenticación

Las solicitudes que requieren autenticación necesitan un token JWT válido.

Para configurar el token:

1. Seleccione la colección **Api FaltaUno** en el panel izquierdo de Postman.
2. Ingrese a la pestaña **Variables**.
3. Identifique la variable utilizada por las solicitudes protegidas para almacenar el token.
4. Pegue el token obtenido durante el inicio de sesión en el valor correspondiente.
5. Guarde los cambios cuando Postman lo solicite.

La guía de pruebas proporcionada por el equipo identifica la variable `json_web_token_0wy7`. Antes de utilizarla, compruebe que ese nombre coincida exactamente con el definido en el archivo JSON de la colección.

Una vez configurado correctamente el token, las solicitudes que utilicen esa variable podrán enviar la autenticación correspondiente.

### Paso 6: Ejecutar el resto de las pruebas

Después de realizar el registro, iniciar sesión y configurar el token, se pueden ejecutar las demás solicitudes de la colección.

Para cada prueba:

1. Seleccione la solicitud que desea ejecutar, por ejemplo, **Obtener Canchas**.
2. Revise el método HTTP, la URL y los parámetros correspondientes.
3. Compruebe los datos enviados en el Body, cuando corresponda.
4. Presione **Send**.
5. Revise el código de estado HTTP y la respuesta del servidor.

Las solicitudes disponibles permiten comprobar las distintas operaciones de la API, de acuerdo con los casos de prueba incluidos en la colección.

### Paso 7: Interpretación de los resultados

Los principales códigos de respuesta HTTP que pueden aparecer son:

| Código | Significado |
|---|---|
| `200 OK` | La solicitud se procesó correctamente. |
| `201 Created` | Se creó correctamente un nuevo registro. |
| `400 Bad Request` | Los datos enviados son inválidos o incumplen alguna validación. |
| `401 Unauthorized` | No se proporcionó un token válido o falló la autenticación. |
| `403 Forbidden` | El usuario no tiene autorización para realizar la operación. |
| `404 Not Found` | No se encontró el recurso solicitado. |
| `409 Conflict` | Existe un conflicto con alguna regla de negocio, por ejemplo, una superposición de horarios. |
| `500 Internal Server Error` | Se produjo un error interno en el servidor. |

**Nota sobre las pruebas fallidas:** Las solicitudes identificadas como `Duplicado` o `Fallido` están diseñadas para comprobar las validaciones del backend. Por lo tanto, recibir un código de error puede representar el resultado esperado, siempre que coincida con el escenario definido en la colección.

Se recomienda ejecutar las pruebas de registro y autenticación antes de probar las rutas que requieren autorización.

---

## 11. Notas y Correcciones de la Entrega Parcial 2 (EP2)

Para esta entrega se han aplicado refactorizaciones y mejoras basadas en la rúbrica de evaluación:

### 1. Base de Datos (`init.sql`)
-   **Datos fijos y reproducibilidad:** Se han eliminado los inserts aleatorios (`random()`) de las reservas. Ahora el script inserta datos de prueba fijos (fechas relativas a `CURRENT_DATE`) para garantizar que las pruebas sean consistentes en cada evaluación.
-   **Ejecución Segura:** Se agregaron instrucciones `DROP TABLE IF EXISTS CASCADE` al inicio del script, lo que permite que el `init.sql` sea 100% reproducible sin generar errores de duplicidad de datos.
-   **Restricciones de Integridad:** Se implementaron validaciones `CHECK` a nivel de base de datos para los roles de usuario (`cliente`, `admin`), estados de reserva, validación de `hora_fin > hora_inicio` y precio mayor a 0.

### 2. Arquitectura Backend (MVC)
-   **Separación de Responsabilidades:** El archivo `reservas.js` fue refactorizado siguiendo el patrón de diseño MVC. La lógica de negocio y las consultas SQL se separaron en el archivo `controllers/reservasController.js`, y las validaciones de fechas/horarios en `utils/validacionesReserva.js`.
-   **Middleware Centralizado:** La validación de permisos de administrador se extrajo a un middleware propio (`middleware/admin.js`) para evitar la repetición de código en las rutas.

### 3. API REST y Seguridad
-   **Versionamiento:** Todas las rutas del servidor han sido actualizadas para incluir el prefijo de versión correspondiente (`/api/v1/...`).
-   **Códigos HTTP:** Se ajustaron las respuestas para utilizar los códigos correctos según el estándar REST (ej. `401 Unauthorized` para fallos de login y `409 Conflict` para registros duplicados).
-   **JSON Estandarizado:** Se corrigieron los endpoints que devolvían arrays crudos; ahora todas las respuestas son objetos JSON estructurados (ej. `{ "canchas": [...] }`).
-   **Paginación:** Se implementó paginación (`LIMIT` / `OFFSET`) en el listado de reservas para administradores, optimizando la transferencia de datos.

### 4. Aclaración de Endpoints Específicos
-   **Rutas de Cancelación:** El sistema cuenta con dos endpoints de cancelación justificados por su contexto de uso:
  -   `PATCH /mis-reservas/:id/solicitar-cancelacion`: Utilizada por el *cliente* para enviar el motivo por el cual no puede asistir. Cambia el estado a pendiente de revisión.
  -   `PATCH /:id/resolver-cancelacion` y `PATCH /:id/cancelar`: Utilizadas exclusivamente por el *administrador* para rechazar/aprobar la solicitud del cliente o para realizar una cancelación forzada (por lluvia, mantenimiento, etc.) de manera inmediata.
-   **Métodos DELETE:** Se implementó el método HTTP `DELETE` tanto para la gestión de usuarios (Hard Delete) como de reservas, restringido únicamente al rol `admin`.

---

## 12. Notas y Cumplimiento de la Entrega Final (EF)

Para esta evaluación final, se integraron las siguientes características requeridas explícitamente por la rúbrica:

* **EF1 (Funcionalidades Completas y Notificaciones):** Se cerró el flujo de negocio con el envío real de notificaciones por correo usando **EmailJS** tras la confirmación de pago. Además, se verificó el funcionamiento del CRUD completo en el panel de administrador (Crear, Leer, Actualizar y Eliminar canchas) utilizando transacciones seguras que protegen la integridad referencial (no permite eliminar canchas con reservas activas).
* **EF3 (Seguridad Avanzada):** Se implementó **Helmet** en el backend para la seguridad de cabeceras HTTP. Se auditó y verificó el uso estricto de consultas parametrizadas (`$1, $2`) en PostgreSQL en todos los endpoints para prevenir Inyección SQL.
* **EF5 (Integración con Servicios Externos):** Se integraron dos servicios en la vista de agendamiento de canchas:
  * **Open-Meteo API:** Proporciona el pronóstico del clima (temperatura máxima, mínima y condiciones) ajustado a las coordenadas del recinto.
  * **Feriados Chile API:** Advierte dinámicamente si la fecha seleccionada por el usuario corresponde a un día festivo nacional.
* **EF6 (Despliegue Local con Docker):** Se "dockerizó" la aplicación mediante la creación de archivos `Dockerfile` para frontend y backend, orquestados a través de un archivo `docker-compose.yml`, permitiendo levantar el sistema completo con un solo comando.
