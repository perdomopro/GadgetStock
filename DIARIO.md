02/05/2026
Hice la validacion de si se ha vendido implementada correctamente

Podrias manaina hacer el roi

03/05/2026
Hice la validacion de no poder guardar y actualizar objetos vendidos sin precio

Hacer que devuelva 400 enves de 500.Con @ExceptionHandler

04/05/2026
Se hico la validacion con el error 500.
Se empezo la parte del frontend del proyecto.
Desarrollar parte del front con los endpoints ya creados

05/05/2026
Se limpio lo innecesario de los css y se hizo una mini landing page
Listar productos en landing page

06/05/2026
Lista hardcodeada
Hacerlo con Useeffect

09/05/2026
Hecho el listado de gadgets de la base de datos
useFetch

crear tabla y usar mas endpoints

10/05/2026
Arreglado loading, added error.


10/11/2026 - Cierre MVP GadgetStock (R1 a R5)
- [R1 Base de Datos y Seguridad]: Eliminadas credenciales expuestas de Supabase en `application.properties`. Configurados perfiles Spring Boot (`dev` con H2 100% en memoria `jdbc:h2:mem:gadgetstockdb`, consola `/h2-console` y `DataSeeder` precargado; `prod` desacoplado por variables de entorno `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
- [R2 Modelo, API y Excepciones]: Ampliado `GadgetModel` con `category`, `repairCost` (BigDecimal por defecto 0) y `listedPrice`. Corregido `PUT /gadget/{id}` en `GadgetController` y `GadgetService` para actualizar `isSold`, `soldPrice` y `soldDate`. Implementados `GlobalExceptionHandler` y `ErrorResponse` para respuestas HTTP 400 (validación) y 404 (no encontrado).
- [R3 Motor Financiero]: Implementado `FinancialSummaryDTO` y `GET /gadget/finance/summary` calculando Ganancia Neta (`soldPrice - (price + repairCost)`) y ROI (%) exclusivamente sobre artículos vendidos (`isSold = true`), y Capital en Stock sobre artículos disponibles (`isSold = false`).
- [R4 Frontend React + Vite]: Construida interfaz completa con vista principal tipo Dashboard (resumen financiero, inventario rápido y formulario de alta rápida), pestañas independientes de Inventario detallado y Finanzas/Ventas, y selectores dinámicos de idioma (`ES` / `EN`) y moneda (`USD` / `MXN`).
- [R5 Limpieza y Git]: Eliminados archivos residuales (`.save*`, `back/hola.gitignore`, `.gitignore copy`, `prueba.md`), unificado `.gitignore` en la raíz e inicializado el repositorio Git.
