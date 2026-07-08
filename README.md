# Node.js + TypeScript + Nodemon (Actualizado para TypeScript 7)

Esta guía muestra cómo configurar un proyecto de **Node.js** utilizando **TypeScript 7**, **TSX** y **Nodemon** para obtener una experiencia de desarrollo rápida y moderna.

## Requisitos

* Node.js 24 o superior (recomendado LTS)
* pnpm, npm o yarn

> En esta guía se utiliza **pnpm**, pero puedes reemplazarlo por `npm` o `yarn` según prefieras.

---

## 1. Instalar TypeScript y los tipos de Node

```bash
pnpm add -D typescript @types/node
```

---

## 2. Inicializar TypeScript

Genera el archivo de configuración de TypeScript.

```bash
npx tsc --init --outDir dist/ --rootDir src
```

Esto creará un archivo `tsconfig.json`.

---

## 3. Compilar el proyecto

Compilar una sola vez:

```bash
npx tsc
```

Compilar automáticamente al detectar cambios:

```bash
npx tsc --watch
```

---

## 4. Instalar Nodemon y TSX

Con TypeScript 7 ya no se recomienda utilizar **ts-node** para desarrollo. La alternativa moderna es **TSX**.

```bash
pnpm add -D tsx nodemon
```

---

## 5. Crear el archivo `nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts,js",
  "ignore": [],
  "exec": "npx tsx ./src/app.ts"
}
```

Con esta configuración, Nodemon reiniciará automáticamente la aplicación cada vez que detecte cambios en los archivos del directorio `src`.

---

## 6. Agregar el script de desarrollo

En el archivo `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon"
  }
}
```

Ejecutar:

```bash
pnpm dev
```

---

## 7. Instalar Rimraf

Para eliminar el directorio `dist` de forma compatible con Windows, Linux y macOS:

```bash
pnpm add -D rimraf
```

---

## 8. Scripts para producción

Agregar al `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "rimraf ./dist && tsc",
    "start": "node dist/app.js"
  }
}
```

---

## Ejecutar el proyecto

### Desarrollo

```bash
pnpm dev
```

### Compilar

```bash
pnpm build
```

### Producción

```bash
pnpm start
```

---

## Estructura recomendada

```text
.
├── src
│   ├── app.ts
│   └── ...
├── dist
├── node_modules
├── nodemon.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Dependencias utilizadas

### Desarrollo

* TypeScript
* @types/node
* Nodemon
* TSX
* Rimraf

### Producción

Las dependencias de producción dependerán de las necesidades del proyecto.

---

## Flujo de trabajo recomendado

1. Crear el proyecto.
2. Instalar las dependencias.
3. Ejecutar `pnpm dev` durante el desarrollo.
4. Compilar con `pnpm build`.
5. Ejecutar la versión compilada con `pnpm start`.

Con esta configuración tendrás un entorno moderno, rápido y compatible con TypeScript 7.
