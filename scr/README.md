# Schematicia Studio

Interfaz web construida con Vite y React que combina LangChain con los modelos de OpenAI para generar propuestas de circuitos electrónicos a partir de instrucciones en lenguaje natural.

El asistente produce:

- Respuestas conversacionales que explican el diseño.
- Una estructura JSON con componentes, conexiones, notas y advertencias.
- Una visualización SVG sencilla del esquema para comprender las relaciones principales.

## Requisitos

- Node.js 20 o superior.
- Una API key válida de OpenAI con acceso al modelo que quieras utilizar.

## Puesta en marcha

```bash
# Instala dependencias
npm install

# Ejecuta el entorno de desarrollo en http://localhost:5173
npm run dev
```

Cuando abras la aplicación:

1. Despliega la sección **Configuración** en la parte superior derecha.
2. Introduce tu API key de OpenAI. El valor se almacena únicamente en tu navegador mediante `localStorage`.
3. Selecciona un modelo (por defecto `gpt-4o-mini`) o especifica uno personalizado.
4. Ajusta la temperatura si necesitas respuestas más creativas.

Después, describe el circuito que deseas prototipar. El asistente sugerirá componentes y conexiones, y generará una visualización básica basada en el JSON devuelto por LangChain.

## Personalización

- El esquema JSON se valida en el navegador y se muestra en la sección derecha. Puedes copiarlo para integrarlo en otros flujos de trabajo.
- El lienzo SVG interpreta posiciones sugeridas por el modelo (`position.x`, `position.y`). Si no se proporcionan, se calcula una cuadrícula automática.
- El prompt del asistente se define en `src/lib/circuitDesigner.ts`; puedes adaptarlo para ajustarlo a tus normas de diseño.

## Scripts disponibles

- `npm run dev`: inicia Vite en modo desarrollo.
- `npm run build`: genera la versión de producción y valida los tipos.
- `npm run lint`: ejecuta ESLint sobre el proyecto.

## Seguridad

El proyecto no incluye backend. Las peticiones a OpenAI se realizan desde el navegador del usuario. Evita desplegar esta aplicación tal cual en producción sin incorporar un proxy seguro que proteja tu API key.
