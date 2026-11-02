# FaltaUno - Sistema de Reservas de Canchas Deportivas

## 1. Identificación del Equipo y Responsabilidades

- **Bruno Medina:** Configuración de la arquitectura del servidor backend (Node.js/Express), diseño e implementación del modelo relacional en PostgreSQL (MER) y desarrollo de la lógica de administración.
- **Antonio Navarro:** Integración del frontend (Ionic/React) con la API REST, consumo directo de endpoints en vistas, depuración de errores, validaciones de seguridad en formularios (restricciones de registro y tarjetas) y ejecución de pruebas de integración en Postman.
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

![Modelo Relacional](https://github.com/user-attachments/assets/ad64658f-83c0-48d6-96c9-d6fd82d15182)

---

## 8. Tecnologías y Herramientas Utilizadas

- **Frontend:** Ionic Framework, React, TypeScript y Vite.
- **Backend:** Node.js y Express.js.
- **Autenticación:** JSON Web Tokens (JWT).
- **Hashing de contraseñas:** BcryptJS.
- **Base de Datos:** PostgreSQL.
- **Conexión a la base de datos:** paquete `pg`.
- **Control de versiones:** Git y GitHub.
- **Herramientas de pruebas y diseño:** Postman y Figma.

---

## 9. Instrucciones de Instalación, Configuración y Ejecución

El siguiente instructivo detalla el proceso para descargar el código fuente, configurar la base de datos PostgreSQL y ejecutar los componentes Backend y Frontend de FaltaUno en un entorno local.

### Requisitos previos

- Node.js instalado.
- PostgreSQL instalado y funcionando.
- pgAdmin para administrar la base de datos.
- Visual Studio Code u otro editor de código.
- Postman para realizar las pruebas de la API.

### Paso 1: Obtener el Código Fuente desde GitHub

Puede obtener el proyecto mediante la terminal (Git) o descargándolo directamente desde el navegador.

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
3. Extraiga el archivo comprimido en una ruta accesible de su equipo y abra la carpeta resultante en su editor de código preferido (por ejemplo, Visual Studio Code).

### Paso 2: Configuración de la Base de Datos

1. Inicie el servicio local de PostgreSQL y abra pgAdmin.
2. En el panel izquierdo, despliegue el servidor PostgreSQL correspondiente.
3. Haga clic derecho sobre **Databases** y seleccione **Create → Database**.
4. En el campo **Database**, escriba `faltauno`.
5. Mantenga como propietario el usuario correspondiente a su instalación de PostgreSQL (por ejemplo, `postgres`).
6. Presione **Save** para crear la base de datos.

**Ejecución del archivo init.sql:**

1. En pgAdmin, seleccione la base de datos `faltauno`.
2. Haga clic derecho sobre ella y seleccione **Query Tool**.
3. En la ventana de consulta, seleccione el botón para abrir un archivo SQL.
4. Busque el archivo `init.sql`, ubicado dentro de la carpeta `backend` del proyecto.
5. Abra el archivo y compruebe que la conexión de Query Tool corresponda a la base de datos `faltauno`.
6. Ejecute el script utilizando el botón de ejecución o la tecla `F5`.
7. Revise la pestaña **Messages** y compruebe que la consulta termine correctamente.

El archivo `init.sql` contiene instrucciones para crear las tablas e incorporar los datos iniciales de prueba.

**Importante:** El backend no ejecuta automáticamente el archivo `init.sql`. Por lo tanto, este debe ejecutarse manualmente desde pgAdmin antes de iniciar las pruebas de la aplicación.

El script debe incluir la creación de las tablas `Usuarios`, `Canchas`, `Reservas` y `MetodosPago`. La tabla `MetodosPago` debe contener los campos `id`, `usuario_id`, `marca`, `ultimos_cuatro`, `titular`, `vencimiento` y `fecha_registro`, además de su relación con la tabla `Usuarios`.

El archivo debe ejecutarse una sola vez sobre una base de datos nueva. Aunque las instrucciones de creación de tablas utilizan `IF NOT EXISTS`, las inserciones de usuarios, canchas y reservas de prueba no están preparadas para ejecutarse repetidamente sin generar duplicaciones o errores.

### Paso 3: Configuración y Ejecución del Servidor (Backend)

1. Abra una terminal en Visual Studio Code.
2. Ingrese al directorio del servidor:

   ```bash
   cd backend
   ```

3. Instale las dependencias necesarias:

   ```bash
   npm install
   ```

4. Cree un archivo denominado `.env` exactamente en la raíz de la carpeta `backend`.
5. Configure las variables de entorno según los datos de conexión de su instalación de PostgreSQL:

   ```env
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=SU_CONTRASENA_DE_POSTGRESQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=faltauno
   JWT_SECRET=SU_CLAVE_SECRETA
   ```

6. Reemplace los valores de ejemplo por sus propias credenciales. El valor de `DB_NAME` debe coincidir con el nombre de la base de datos creada en pgAdmin.
7. Inicie el servidor ejecutando:

   ```bash
   npm run dev
   ```

8. Compruebe que la terminal indique que el servidor está escuchando en el puerto 3000 y que se haya establecido la conexión con PostgreSQL.

La dirección local del backend es:

`http://localhost:3000`

Mantenga esta terminal abierta mientras utilice la aplicación.

**Nota para Windows:** Si PowerShell bloquea la ejecución de `npm` por sus políticas de ejecución, puede utilizar `npm.cmd install` y `npm.cmd run dev`.

### Paso 4: Ejecución de la Aplicación (Frontend)

1. Abra una nueva pestaña o ventana de terminal.
2. Desde la carpeta principal del proyecto, ingrese al directorio del cliente:

   ```bash
   cd frontend
   ```

3. Instale las dependencias:

   ```bash
   npm install
   ```

4. Inicie el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Espere a que Vite indique la dirección local de la aplicación en la terminal.
6. Abra dicha dirección en el navegador web.

La dirección predeterminada de Vite suele ser:

`http://localhost:5173`

Mantenga abiertas las terminales del backend y del frontend mientras utilice FaltaUno.

### Paso 5: Cuentas de Prueba (Accesos por Rol)

El archivo `init.sql` incorpora usuarios de prueba para facilitar la evaluación de los distintos perfiles del sistema.

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

Estas cuentas se crean al ejecutar correctamente el script de inicialización.

**Asignación del rol de administrador a otro usuario:**

Si se desea otorgar el rol de administrador a un usuario que ya se encuentra registrado, se puede realizar desde pgAdmin:

1. Seleccione la base de datos `faltauno`.
2. Abra la herramienta **Query Tool**.
3. Ejecute la siguiente sentencia SQL, reemplazando el correo electrónico por el del usuario correspondiente:

   ```sql
   UPDATE Usuarios
   SET rol = 'admin'
   WHERE email = 'correo_del_usuario@ejemplo.com';
   ```

4. Para comprobar el cambio, ejecute:

   ```sql
   SELECT id, nombre, email, rol
   FROM Usuarios
   WHERE email = 'correo_del_usuario@ejemplo.com';
   ```

5. El usuario debe cerrar sesión y volver a iniciarla para obtener un nuevo token JWT con su rol actualizado.

**Importante:** El usuario debe estar registrado previamente. La sentencia solamente modifica el rol de la cuenta cuyo correo electrónico coincida con el indicado.

Las credenciales de prueba son para fines académicos y no deben utilizarse en un entorno de producción.

### Consideraciones de Seguridad

- El archivo `.env` contiene credenciales privadas y no debe subirse al repositorio de GitHub.
- Cada integrante debe configurar sus propias credenciales de PostgreSQL.
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

Para probar la validación de registros duplicados, ejecute la solicitud **Registro Duplicado**. La respuesta esperada, según las instrucciones de las pruebas entregadas, es `400 Bad Request`.

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

