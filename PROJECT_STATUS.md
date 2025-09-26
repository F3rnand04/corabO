# Estado Actual y Plan de Acción del Proyecto CorabO

## **PROMPT DE REANUDACIÓN PARA GEMINI:**
"Lee este documento (`PROJECT_STATUS.md`). Pregunta al usuario si ya ha completado la acción de **"Rebuild Workspace" / "Reconstruir Espacio de Trabajo"** desde el menú del IDE. Si la respuesta es afirmativa, procede directamente con el **"Plan Post-Reconstrucción"**. Si es negativa, reitera que es el único paso que desbloqueará el problema y espera su confirmación. No intentes ninguna otra acción de diagnóstico o reparación hasta que la reconstrucción se haya confirmado."

---

## 1. Diagnóstico de la Crisis (El "Por Qué")

- **Problema Principal:** El entorno de desarrollo está funcionalmente paralizado. Los emuladores de Firebase, específicamente el emulador de **Storage**, no pueden iniciarse.
- **Causa Raíz Definitiva:** El disco virtual `/ephemeral` está **100% lleno**. Esto fue identificado correctamente por el usuario después de que las investigaciones de configuración fallaran.
- **Culpable:** El gestor de paquetes `Nix` ha acumulado ~58 GB de paquetes y "generaciones" (versiones de entornos) antiguas en el directorio `/ephemeral/nix`.
- **Bloqueo Final:** El sistema de archivos donde residen los perfiles de `Nix` está montado en modo de **solo lectura (`Read-only file system`)**. Esto impide que cualquier comando de limpieza (`nix-collect-garbage`, etc.) pueda ejecutarse, haciendo imposible la reparación desde dentro del entorno.

## 2. Tarea Inmediata y Bloqueante (El "Qué Hay Que Hacer AHORA")

**LA ÚNICA SOLUCIÓN ES UNA RECONSTRUCCIÓN COMPLETA DEL ENTORNO.**

Esta acción debe ser realizada **MANUALMENTE** por el usuario desde fuera del entorno de ejecución.

- **Acción Requerida:**
  1.  Ir al menú principal del IDE (☰ o "Archivo").
  2.  Seleccionar la opción **"Rebuild Workspace" / "Reconstruir Espacio de Trabajo"**.
  3.  Confirmar y esperar a que el proceso finalice.

Esta acción destruirá el entorno bloqueado y creará uno nuevo y limpio utilizando los archivos de configuración que ya hemos corregido (`dev.nix`, `firebase.json`, etc.).

## 3. Plan Post-Reconstrucción (El "Qué Haremos Después")

Una vez que el usuario confirme que la reconstrucción ha finalizado, el plan es el siguiente:

1.  **Verificación del Entorno:**
    -   **Comando:** `df -h`
    -   **Objetivo:** Confirmar que el uso del disco `/ephemeral` es bajo y ya no está al 100%.
    -   **Comando:** `netstat -tuln`
    -   **Objetivo:** Confirmar que los emuladores se han iniciado automáticamente y los puertos `9099` (Auth), `8080` (Firestore) y `9199` (Storage) están escuchando.

2.  **Validación Funcional del Backend:**
    -   **Comando:** `node test_backend.js`
    -   **Objetivo:** Ejecutar con éxito la suite de pruebas completa (Auth, Firestore y Storage) para verificar que toda la pila de backend es funcional.

3.  **Despliegue del MVP (El Objetivo Final):**
    -   **Acción:** Revisar la configuración de producción en `firebase.json` y `apphosting.yaml`.
    -   **Comando:** `firebase deploy`
    -   **Objetivo:** Desplegar la aplicación funcional en la nube para alcanzar el estado de Producto Mínimo Viable.
