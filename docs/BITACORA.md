# Bitácora del proyecto · Ventas MX

Registro de lo que se construyó, en qué orden, **por qué** se tomó cada decisión y qué falta.
El [README](../README.md) explica cómo usar el proyecto; este documento cuenta cómo llegamos aquí.

---

## 1. Objetivo

Un dashboard empresarial para el **portafolio**, pensado para ganar clientes:

- Debe verse como un producto real que una PyME mexicana pagaría, no como un ejercicio de tutorial.
- Debe demostrar arquitectura seria en el backend (.NET + Clean Architecture) y un frontend moderno.
- Debe poder enseñarse en vivo en 3 minutos (ver *Guion de demo* en el README).

**Dominio elegido:** ventas e inventario de una PyME con 4 sucursales (CDMX, Monterrey, Guadalajara, Puebla).
Es un caso que cualquier dueño de negocio entiende al instante.

---

## 2. Cronología

| # | Commit | Fase | Qué se hizo |
|---|---|---|---|
| 0 | `6b556c5` | Inicio | Repositorio vacío. |
| 1 | `7d06689` | Dashboard base | API .NET 10 en 4 capas, PostgreSQL en Docker, datos de demo (12 meses de ventas), endpoint de resumen y frontend React con KPIs y gráficas. |
| 2 | `a35c912` | Seguridad | Login con JWT + refresh token con rotación en cookie `HttpOnly`, 3 roles y filtrado de datos por sucursal en el backend. |
| 3 | `c990a42` | Funcionalidad | CRUD de productos con validación en ambos lados, exportar a Excel y scripts `iniciar-demo.cmd` / `detener-demo.cmd`. |
| 4 | `162a884` | Rediseño | Se descartó el look genérico de "plantilla SaaS" y se creó una identidad editorial propia: tipografías, mapa de calor, paleta de comandos, comparación con periodo anterior. |
| 5 | `b42cf90` | Ajuste de marca | Paleta cambiada a azul marino + cobalto según psicología del color y público objetivo; se quitó el texto de relleno; mensaje claro si la API no responde. |

---

## 3. Decisiones técnicas y por qué

### Backend

| Decisión | Por qué |
|---|---|
| **.NET 10 + Minimal APIs** | Rendimiento alto, tipado fuerte y muy pedido en empresas mexicanas. |
| **Clean Architecture** (Domain → Application → Infrastructure → Api) | Separa reglas de negocio de detalles técnicos. Cambiar PostgreSQL por SQL Server solo toca Infrastructure. Es lo que un cliente técnico quiere ver. |
| **PostgreSQL en Docker** | Gratis, robusto y se levanta igual en cualquier PC con un comando. |
| **Agregaciones en SQL** (`SUM`, `GROUP BY` vía EF Core) | Los cálculos se hacen en la base de datos, no trayendo miles de filas a memoria. |
| **Comparación con el periodo anterior** en el mismo endpoint | El frontend muestra "+13.7 %" sin una segunda llamada. Solo se compara si hay historial que cubra **todo** el periodo anterior; si no, saldrían variaciones engañosas (+2,300 %). |
| **Seguridad por datos, no por pantalla** | Un Gerente siempre recibe solo su sucursal aunque mande otro `branchId`; un Vendedor recibe 403 en el dashboard. El frontend solo oculta opciones. |
| **JWT corto (15 min) + refresh token rotado** | El access token vive en memoria (no en `localStorage`) para reducir el impacto de un XSS; la cookie `HttpOnly` lo renueva. Reusar un refresh token revoca todas las sesiones. |

### Frontend

| Decisión | Por qué |
|---|---|
| **React 19 + TypeScript + Vite** | Estándar de la industria, arranque instantáneo y errores detectados al compilar. |
| **TanStack Query** | Caché, estados de carga y error, y datos anteriores visibles (atenuados) mientras llega un filtro nuevo. |
| **Tailwind v4 con tokens propios** | Todos los colores salen de variables CSS (`--accent`, `--surface`…); cambiar la paleta completa es editar un solo archivo (`index.css`). |
| **Recharts** | Gráficas SVG accesibles y fáciles de personalizar. |
| **Cliente HTTP propio** (`lib/api.ts`) | Un solo lugar que agrega el token, renueva la sesión ante un 401 y traduce errores a mensajes en español. |

---

## 4. Diseño: cómo llegamos al look actual

### 4.1 Primer intento → "se ve muy básico"

La primera versión usaba tarjetas blancas, íconos y azul de plantilla: correcto, pero idéntico a cualquier dashboard.
Se rediseñó con una **dirección editorial** (como un reporte financiero impreso):

- **Tipografías** (empaquetadas en la app, funcionan sin internet):
  - *Instrument Serif* para cifras protagonistas y títulos.
  - *Geist* para la interfaz.
  - *Geist Mono* para etiquetas, fechas y datos.
- **Panel protagonista** oscuro con la cifra de ingresos grande y animada.
- **Mapa de calor "Ritmo diario"**: cada cuadro es un día; muestra de un vistazo qué días se vende más.
- **Rankings** con numerales grandes (01, 02…) en lugar de barras genéricas.
- **Paleta de comandos `Ctrl + K`**: navegar, cambiar tema o buscar un producto desde cualquier pantalla.

### 4.2 Segundo ajuste → "rosa, ¿qué tiene que ver?" y "sin tanto texto"

**Público objetivo:** dueños y directores de PyMEs y gerentes de sucursal. Toman decisiones de dinero y necesitan **confiar** en los números.

**Psicología del color aplicada:**

| Color | Uso | Qué transmite |
|---|---|---|
| Azul marino `#0f2244` | Panel principal, tinta del texto | Confianza, estabilidad, seriedad financiera (el color de la banca: BBVA, PayPal, Amex). |
| Azul cobalto `#1f4fd1` (claro) / `#5a8cf5` (oscuro) | **Único** color de datos en gráficas | Claridad; guiño a la talavera poblana, mexicano sin caer en el cliché. |
| Dorado `#a16207` / `#e2b04a` | Solo en el logo | Valor y prosperidad, en dosis mínimas. |
| Verde / ámbar / rojo | Solo estados: subió, atención, bajó | Convención universal en finanzas; al no usarlos en las gráficas, nunca se confunden con los datos. |

Los colores de datos se validaron con un verificador de contraste y daltonismo en modo claro, oscuro y sobre el panel marino.

**Menos texto, más visual:**

- Se quitaron el párrafo de "resumen ejecutivo", la frase de bienvenida del login y las descripciones largas.
- Los hallazgos se muestran como **datos compactos**: `Mejor día · Domingo · $56.7k/día · ↗ 22.9 %`.
- Los detalles secundarios (fechas exactas del periodo anterior, descripción de cada perfil demo) aparecen al pasar el mouse.

### 4.3 Reglas de visualización que seguimos

- Un solo color para gráficas de una sola medida; leyenda solo cuando hay 2+ series.
- Cada gráfica tiene vista de **tabla** (accesibilidad y valores exactos).
- Los estados siempre llevan **ícono + texto**, nunca solo color.
- Animaciones que se desactivan si el sistema tiene "reducir movimiento".
- Modo oscuro con tonos propios, no una inversión automática.

---

## 5. Problemas que encontramos y cómo se resolvieron

| Problema | Causa | Solución |
|---|---|---|
| Comparación de "+2,300 %" en 12 meses | Los datos de demo empiezan en nov 2025; el "periodo anterior" estaba casi vacío. | Solo se compara si el historial cubre todo el periodo anterior. |
| "Failed to fetch" en inglés al iniciar sesión | La API estaba apagada; el navegador da un mensaje genérico. | `lib/api.ts` lo traduce: *"No se pudo conectar con el servidor…"*. |
| La API se cerraba sola | La PC tiene poca RAM (≈1 GB libre) y el sistema la mataba. | Volver a correr `iniciar-demo.cmd` (solo levanta lo que falta). Apagar contenedores que no se usen ayuda. |
| No compilaba el backend (archivo bloqueado) | La API en ejecución tenía tomadas las DLL. | Detener la API antes de compilar. |
| La etiqueta del pico chocaba con el eje | El pico caía en el primer o último mes. | La etiqueta se coloca a la derecha / izquierda en los extremos. |
| El conteo animado no corría en modo desarrollo | React StrictMode monta dos veces los componentes. | `useCountUp` guarda el valor mostrado en un `ref`. |

---

## 6. Cómo se verificó

- `npx tsc -b` y `npm run lint` sin errores ni avisos.
- `dotnet build` sin errores ni avisos.
- Pruebas visuales automatizadas con Playwright: login, dashboard claro/oscuro, filtro 6M con comparación, mapa de calor, `Ctrl + K`, catálogo, formulario y vista móvil (390 px, sin scroll horizontal).
- Prueba de humo de la API: `salesByDay` con 352 días para 12 meses y `previous = null` para "todo el histórico".

---

## 7. Pendientes (siguiente fase)

- [ ] **Despliegue:** Dockerfile para API y frontend, Nginx como proxy y un VPS con demo en vivo.
- [ ] **Pruebas automáticas:** xUnit + Testcontainers (backend) y Vitest (frontend).
- [ ] **CI/CD** con GitHub Actions.
- [ ] **Tiempo real** con SignalR (ventas que aparecen al momento).
- [ ] Pull request de `Dev` → `main` cuando la versión esté lista para mostrarse.

---

## 8. Mapa rápido de archivos clave

| Quiero cambiar… | Archivo |
|---|---|
| Colores, tipografías, animaciones | `frontend/src/index.css` |
| Página del dashboard | `frontend/src/features/dashboard/DashboardPage.tsx` |
| Cifra protagonista + gráfica mensual | `frontend/src/features/dashboard/components/RevenueHero.tsx` |
| Mapa de calor | `frontend/src/features/dashboard/components/DailyRhythm.tsx` y `rhythm.ts` |
| Login | `frontend/src/features/auth/LoginPage.tsx` |
| Paleta `Ctrl + K` | `frontend/src/components/CommandPalette.tsx` |
| Mensajes de error / llamadas a la API | `frontend/src/lib/api.ts` |
| Cálculos del dashboard (KPIs, comparación) | `backend/src/Dashboard.Application/Features/Dashboard/DashboardService.cs` |
| Datos de demo | `backend/src/Dashboard.Infrastructure/Persistence/DataSeeder.cs` |
| Levantar / apagar la demo | `iniciar-demo.cmd`, `detener-demo.cmd`, `scripts/` |
