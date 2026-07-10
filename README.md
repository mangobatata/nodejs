# Proyecto NOC

Este proyecto es una base pequeña para practicar **Clean Architecture** con **Node.js + TypeScript**.
La idea principal es separar el sistema por responsabilidades para que la logica de negocio no dependa de detalles como archivos, cron jobs o librerias externas.

## Objetivo del proyecto

La aplicacion ejecuta una tarea programada que:

1. Revisa una URL.
2. Determina si el servicio responde correctamente.
3. Genera un log del resultado.
4. Guarda ese log en archivos del sistema.

Aunque el proyecto es pequeno, ya muestra una estructura comun de Clean Architecture:

- `domain`: reglas de negocio y contratos.
- `infrastructure`: implementaciones concretas.
- `presentation`: punto de entrada y orquestacion.
- `config`: configuraciones del entorno.

## Estructura del proyecto

```text
src/
  app.ts
  config/
    plugins/
      envs.plugin.ts
  domain/
    datasources/
      log.datasource.ts
    entities/
      log.entity.ts
    repository/
      log.repository.ts
    use-cases/
      checks/
        check-service.ts
  infrastructure/
    datasources/
      file-system.datasource.ts
    repositories/
      log.repository.impl.ts
  presentation/
    cron/
      cron-service.ts
    server.ts
```

## Que significa Clean Architecture aqui

La regla mas importante es esta:

**las capas externas pueden depender de las internas, pero las internas no deben depender de las externas**.

En este proyecto eso se ve asi:

- `presentation` depende de `domain` e `infrastructure`.
- `infrastructure` depende de `domain`.
- `domain` no depende de `presentation` ni de `infrastructure`.

Eso permite cambiar la forma de guardar logs sin tocar la logica principal del caso de uso.

## Flujo completo de ejecucion

Cuando corre la app, el recorrido es este:

1. [src/app.ts](/home/brite/repos/JS/nodejs/src/app.ts:1) arranca la aplicacion.
2. `app.ts` llama a `ServerApp.start()`.
3. [src/presentation/server.ts](/home/brite/repos/JS/nodejs/src/presentation/server.ts:1) crea un `LogRepositoryImpl` usando `FileSystemDatasource`.
4. `ServerApp` registra un cron job con `CronService`.
5. Cada vez que se dispara el cron, se instancia `CheckService`.
6. [src/domain/use-cases/checks/check-service.ts](/home/brite/repos/JS/nodejs/src/domain/use-cases/checks/check-service.ts:1) hace `fetch` a la URL.
7. Si la URL responde bien, crea un `LogEntity` de severidad `low`.
8. Si falla, crea un `LogEntity` de severidad `high`.
9. `CheckService` guarda el log usando el contrato `LogRepository`.
10. [src/infrastructure/repositories/log.repository.impl.ts](/home/brite/repos/JS/nodejs/src/infrastructure/repositories/log.repository.impl.ts:1) delega el guardado al datasource.
11. [src/infrastructure/datasources/file-system.datasource.ts](/home/brite/repos/JS/nodejs/src/infrastructure/datasources/file-system.datasource.ts:1) escribe el log en archivos dentro de `logs/`.

## Explicacion por capa

### 1. Domain

La carpeta `domain` contiene el nucleo del negocio. Esta capa deberia poder existir aunque cambies Express, cron, archivos, base de datos o cualquier framework.

#### Entidad: `LogEntity`

Archivo: [src/domain/entities/log.entity.ts](/home/brite/repos/JS/nodejs/src/domain/entities/log.entity.ts:1)

Esta clase representa un log del sistema.

```ts
export class LogEntity {
  public level: LogSeverityLevel;
  public message: string;
  public createdAt: Date;
}
```

Responsabilidades:

- Guardar el `message`.
- Guardar el `level`.
- Guardar la fecha `createdAt`.
- Convertir un JSON en una entidad con `fromJson`.

La entidad no sabe nada de archivos, cron ni consola. Solo representa informacion del dominio.

#### Enum: `LogSeverityLevel`

Tambien en [src/domain/entities/log.entity.ts](/home/brite/repos/JS/nodejs/src/domain/entities/log.entity.ts:1).

Define los niveles de severidad:

- `low`
- `medium`
- `high`

Esto evita usar strings sueltos por todo el proyecto.

#### Contrato: `LogDatasource`

Archivo: [src/domain/datasources/log.datasource.ts](/home/brite/repos/JS/nodejs/src/domain/datasources/log.datasource.ts:1)

```ts
export abstract class LogDatasource {
  abstract saveLog(log: LogEntity): Promise<void>;
  abstract getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]>;
}
```

Este archivo define **que operaciones debe ofrecer una fuente de datos** para logs.
No dice si sera una base de datos, un archivo, Mongo, Postgres o memoria.

#### Contrato: `LogRepository`

Archivo: [src/domain/repository/log.repository.ts](/home/brite/repos/JS/nodejs/src/domain/repository/log.repository.ts:1)

```ts
export abstract class LogRepository {
  abstract saveLog(log: LogEntity): Promise<void>;
  abstract getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]>;
}
```

Este repositorio es el punto que consume el caso de uso.

Idea clave:

- El caso de uso depende del `repository`.
- El `repository` depende de un `datasource`.

Eso agrega una capa intermedia para desacoplar aun mas la logica de negocio del detalle tecnico.

#### Caso de uso: `CheckService`

Archivo: [src/domain/use-cases/checks/check-service.ts](/home/brite/repos/JS/nodejs/src/domain/use-cases/checks/check-service.ts:1)

Este es el corazon del comportamiento principal.

```ts
export class CheckService {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly successCallback: SuccessCallback,
    private readonly errorCallback: ErrorCallback,
  ) {}
}
```

Que hace:

1. Recibe una URL.
2. Ejecuta `fetch(url)`.
3. Si la respuesta no es correcta, lanza un error.
4. Si sale bien, crea un log `low`.
5. Si falla, crea un log `high`.
6. Guarda el log usando `logRepository`.
7. Ejecuta callbacks de exito o error.

Punto importante:

`CheckService` **no sabe** como se guardan los logs. Solo sabe que existe un `LogRepository` con un metodo `saveLog`.

Ese desacoplamiento es una de las bases de Clean Architecture.

### 2. Infrastructure

La carpeta `infrastructure` contiene implementaciones concretas de los contratos del dominio.

#### Implementacion del datasource: `FileSystemDatasource`

Archivo: [src/infrastructure/datasources/file-system.datasource.ts](/home/brite/repos/JS/nodejs/src/infrastructure/datasources/file-system.datasource.ts:1)

Esta clase implementa `LogDatasource` usando el modulo `fs` de Node.

Responsabilidades:

- Crear la carpeta `logs/` si no existe.
- Crear los archivos de log si no existen.
- Guardar todos los logs en `logs/logs-all.log`.
- Guardar los logs `medium` en `logs/logs-medium.log`.
- Guardar los logs `high` en `logs/logs-high.log`.
- Leer logs desde archivos.

Detalles importantes del codigo:

- `createLogsFiles()` prepara el entorno de archivos.
- `saveLog()` serializa el log a JSON y lo agrega al archivo.
- `getLogsFromFile()` lee el archivo y reconstruye entidades con `LogEntity.fromJson`.
- `getLogs()` selecciona el archivo correcto segun la severidad.

Esto es infraestructura porque depende de un detalle tecnico concreto: el sistema de archivos.

#### Implementacion del repositorio: `LogRepositoryImpl`

Archivo: [src/infrastructure/repositories/log.repository.impl.ts](/home/brite/repos/JS/nodejs/src/infrastructure/repositories/log.repository.impl.ts:1)

```ts
export class LogRepositoryImpl implements LogRepository {
  constructor(private readonly logDatasource: LogDatasource) {}
}
```

Su trabajo es delegar operaciones al datasource:

- `saveLog()` llama `this.logDatasource.saveLog(log)`.
- `getLogs()` llama `this.logDatasource.getLogs(severityLevel)`.

Puede parecer una capa extra innecesaria en un proyecto chico, pero sirve para:

- aislar la logica de acceso a datos;
- cambiar datasources facilmente;
- agregar reglas de persistencia sin tocar el caso de uso.

### 3. Presentation

La carpeta `presentation` orquesta la ejecucion.
No deberia contener logica de negocio profunda; su tarea es conectar piezas.

#### `CronService`

Archivo: [src/presentation/cron/cron-service.ts](/home/brite/repos/JS/nodejs/src/presentation/cron/cron-service.ts:1)

Es un wrapper pequeno sobre la libreria `cron`.

```ts
export class CronService {
  static createJob(cronTime: CronTime, onTick: OnTick): CronJob {
    const job = new CronJob(cronTime, onTick);
    job.start();
    return job;
  }
}
```

Para que sirve:

- centraliza la creacion de cron jobs;
- evita que el resto del codigo dependa directamente de detalles repetidos de la libreria.

#### `ServerApp`

Archivo: [src/presentation/server.ts](/home/brite/repos/JS/nodejs/src/presentation/server.ts:1)

Esta clase hace el ensamblado de dependencias.

```ts
const fileSystemLogRepository = new LogRepositoryImpl(
  new FileSystemDatasource(),
);
```

Ese bloque conecta:

- un datasource concreto;
- un repositorio concreto;
- y luego ese repositorio se inyecta en `CheckService`.

Despues registra el trabajo programado:

```ts
CronService.createJob("*/5 * * * * *", () => {
  const url = "https://google.com";
  new CheckService(
    fileSystemLogRepository,
    () => console.log(`${url} is ok`),
    (error) => console.log(error),
  ).execute(url);
});
```

Esto significa:

- cada 5 segundos se revisa `https://google.com`;
- si responde bien, se imprime un mensaje de exito;
- si falla, se imprime el error;
- en ambos casos, se persiste un log.

### 4. Config

#### `envs.plugin.ts`

Archivo: [src/config/plugins/envs.plugin.ts](/home/brite/repos/JS/nodejs/src/config/plugins/envs.plugin.ts:1)

Este archivo centraliza variables de entorno.

```ts
export const envs = {
  PORT: env.get("PORT").required().asPortNumber(),
  MAILER_EMAIL: env.get("MAILER_EMAIL").required().asEmailString(),
  MAILER_SECRET_KEY: env.get("MAILER_SECRET_KEY").required().asString(),
  PROD: env.get("PROD").required().asBool(),
};
```

Su objetivo es:

- cargar variables desde `.env`;
- validarlas;
- exponerlas ya parseadas y tipadas.

Ahora mismo `app.ts` las importa y las imprime, pero todavia no estan integradas a la logica principal del chequeo.

## Explicacion de `app.ts`

Archivo: [src/app.ts](/home/brite/repos/JS/nodejs/src/app.ts:1)

```ts
import { envs } from "./config/plugins/envs.plugin";
import { ServerApp } from "./presentation/server";

(async () => {
  main();
})();

function main() {
  ServerApp.start();
  console.log(envs);
}
```

Que hace:

- importa configuracion;
- importa el servidor;
- ejecuta `main()`;
- arranca el sistema con `ServerApp.start()`;
- imprime las variables de entorno.

Observacion:

El `async` del IIFE no aporta mucho aqui porque `main()` no retorna una promesa. Se podria simplificar mas adelante.

## Dependencias entre capas

Puedes pensar las dependencias asi:

```text
app.ts
  -> presentation/server.ts
      -> presentation/cron/cron-service.ts
      -> domain/use-cases/checks/check-service.ts
      -> infrastructure/repositories/log.repository.impl.ts
          -> infrastructure/datasources/file-system.datasource.ts
              -> domain/entities/log.entity.ts
              -> domain/datasources/log.datasource.ts
          -> domain/repository/log.repository.ts
```

Y conceptualmente:

```text
Presentation -> Domain
Presentation -> Infrastructure
Infrastructure -> Domain
Domain -> no depende de capas externas
```

## Por que esto es mejor que poner todo en un archivo

Si todo estuviera mezclado:

- cambiar de archivos a base de datos seria mas costoso;
- testear la logica de chequeo seria mas dificil;
- el codigo creceria acoplado y dificil de mantener.

Con esta estructura:

- `CheckService` se puede reutilizar;
- el guardado de logs puede cambiar sin romper el caso de uso;
- la orquestacion del cron queda separada;
- el dominio mantiene reglas limpias.

## Ejemplo mental del desacoplamiento

Hoy tienes esto:

- `CheckService` usa `LogRepository`.
- `LogRepositoryImpl` usa `FileSystemDatasource`.

Manana podrias tener:

- `MongoLogDatasource`
- `PostgresLogDatasource`
- `ApiLogDatasource`

Sin cambiar `CheckService`, solo cambiarias la implementacion inyectada en `server.ts`.

Eso es inversion de dependencias aplicada en un caso real.

## Cosas que conviene mejorar

El proyecto ya sirve para aprender estructura, pero hay varios puntos mejorables:

1. `CheckService` deberia usar `await this.logRepository.saveLog(log)` para no dejar promesas sueltas.
2. `FileSystemDatasource.getLogsFromFile()` deberia filtrar lineas vacias antes de hacer `JSON.parse`.
3. Las dependencias `dotenv` y `env-var` deben estar instaladas para que `envs.plugin.ts` funcione.
4. Faltan tests unitarios del caso de uso `CheckService`.
5. `ServerApp` hoy hace el ensamblado manual; mas adelante podria centralizarse en un contenedor o factory.
6. `app.ts` podria usar `envs` para configurar la URL, el cron o el puerto en vez de solo imprimirlas.

## Como leer este proyecto para aprender

Te recomiendo este orden:

1. Lee [src/domain/entities/log.entity.ts](/home/brite/repos/JS/nodejs/src/domain/entities/log.entity.ts:1) para entender que datos maneja el dominio.
2. Lee [src/domain/repository/log.repository.ts](/home/brite/repos/JS/nodejs/src/domain/repository/log.repository.ts:1) y [src/domain/datasources/log.datasource.ts](/home/brite/repos/JS/nodejs/src/domain/datasources/log.datasource.ts:1) para entender los contratos.
3. Lee [src/domain/use-cases/checks/check-service.ts](/home/brite/repos/JS/nodejs/src/domain/use-cases/checks/check-service.ts:1) porque ahi esta la logica principal.
4. Luego pasa a [src/infrastructure/datasources/file-system.datasource.ts](/home/brite/repos/JS/nodejs/src/infrastructure/datasources/file-system.datasource.ts:1) para ver como se implementa la persistencia.
5. Despues mira [src/infrastructure/repositories/log.repository.impl.ts](/home/brite/repos/JS/nodejs/src/infrastructure/repositories/log.repository.impl.ts:1) para ver como se conecta el caso de uso con la infraestructura.
6. Termina en [src/presentation/server.ts](/home/brite/repos/JS/nodejs/src/presentation/server.ts:1) y [src/app.ts](/home/brite/repos/JS/nodejs/src/app.ts:1) para entender como se arma todo.

## Resumen corto

Este proyecto aplica Clean Architecture de forma simple:

- el `domain` define reglas y contratos;
- `infrastructure` implementa detalles tecnicos;
- `presentation` conecta todo y ejecuta el caso de uso;
- `app.ts` arranca el sistema.

La pieza mas importante para entender la arquitectura es esta:

**`CheckService` depende de una abstraccion (`LogRepository`), no de una implementacion concreta (`FileSystemDatasource`)**.

Esa decision es la base del desacoplamiento del proyecto.
