# Schematicia Studio

Este repositorio contiene la interfaz web de Schematicia para generar y visualizar propuestas de circuitos electrónicos.

## Instalación rápida

Desde la raíz del repositorio ejecuta:

```bash
npm install
```

El script anterior instala automáticamente las dependencias del proyecto ubicado en `scr/`.

## Scripts disponibles

Los comandos más habituales también están expuestos desde la raíz:

```bash
# Ejecuta el entorno de desarrollo de Vite
npm run dev

# Genera la build de producción y valida los tipos
npm run build

# Ejecuta ESLint sobre el código fuente
npm run lint

# Inicia la previsualización de la build
npm run preview
```

Si prefieres trabajar directamente dentro del paquete puedes cambiarte manualmente al directorio `scr/` y lanzar los mismos scripts con `npm --prefix scr run <comando>`.

Para más detalles técnicos consulta la documentación ampliada en [`scr/README.md`](scr/README.md).
