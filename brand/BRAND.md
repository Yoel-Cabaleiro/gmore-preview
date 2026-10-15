# G-MoRE · Identidades visuales: reglas para construir la web

Este directorio define **exactamente** cómo se ve cada una de las identidades
candidatas de G-MoRE. La web que construyas (una web estática de previsualización
con un selector de identidad) debe reproducirlas sin interpretarlas.

## Qué hay aquí

| Ruta | Qué es | Autoridad |
|---|---|---|
| `reference/<id>.html` | La página de referencia renderizada de cada identidad (1, 2, 3, 3b, 3c, 4, 5, 6). Ábrela en un navegador. | **Máxima.** Si algo difiere de esto, está mal. |
| `identities.json` | Todos los valores de cada identidad: paleta (con su origen), tokens, tipografía, assets, titular y overrides. | Fuente de datos para el código. |
| `tokens.css` | Los mismos tokens como variables CSS bajo `:root[data-theme="<id>"]`. | Generado de `identities.json`. |
| `assets/` | Logos, símbolos y piezas del quilt, recortados de las fichas originales. | Usar tal cual. |
| `sheets/` | Las fichas de identidad originales. | Contexto visual; no extraer valores nuevos de aquí. |
| `source/` | La plantilla y los scripts con los que se generaron las referencias. | Trazabilidad. |

## Reglas

1. **No inventes valores.** Todo color, fuente, peso, tamaño, radio o borde sale
   de `identities.json` / `tokens.css`. Si necesitas un valor que no existe, pregunta;
   no lo derives, no lo "armonices" ni lo aproximes.
2. **Los logos son imágenes.** Usa los PNG de `assets/` tal cual. No los redibujes
   en SVG, no los recrees con texto o CSS, no los recolorees ni cambies su proporción.
3. **Tipografías exactas.** Usa las familias y pesos de `typography` en
   `identities.json`. Para producción, descarga los archivos (woff2) de Google Fonts
   y sírvelos desde el repo; las pilas de fallback se mantienen.
4. **Overrides.** Las identidades 3b, 3c, 5 y 6 tienen una lista `overrides` con
   diferencias que no son tokens (franjas de color, píldoras, avatares con piezas
   del quilt, titular en dos estilos…). Impleméntalas todas, con los valores exactos.
5. **Estructura común.** Todas las identidades comparten la misma página (cabecera,
   hero, bloque Research/Dialogue/Practice, proyectos, convocatoria, personas, pie).
   Cambiar de identidad cambia el estilo, no el contenido ni el orden, salvo el
   titular (`content.h1`) y los assets.
6. **Grupo 3.** 3, 3b y 3c son subvariantes de la misma identidad (mismo logo y
   tipografía). El selector debe mostrarlas agrupadas.
7. **Accesibilidad.** Las combinaciones texto/fondo de las referencias ya cumplen
   contraste 4.5:1 (3:1 en texto grande). No cambies colores de texto sobre fondos
   de color.

## Criterio de aceptación

Para cada identidad, la página con ese tema activo, a **1440 px de ancho**, debe
coincidir visualmente con `reference/<id>.html` al mismo ancho.

Recomendado: antes de empezar, genera capturas de las 8 referencias con
Playwright (con conexión, para que carguen las fuentes) y guárdalas como línea base;
después compara las capturas de la web con cada tema contra ellas.
