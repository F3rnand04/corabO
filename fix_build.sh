#!/bin/bash

# ===============================================================
# =        CORABO - ENGRANAJE DE CORRECCIÓN DE COMPILACIÓN      =
# ===============================================================
# Este script diagnostica y corrige errores de compilación
# realizando una instalación limpia de las dependencias y luego
# verificando que la compilación sea exitosa.

echo "⚙️  INICIANDO ENGRANAJE: Corrección de compilación..."
echo "------------------------------------------------------------"

# --- Paso 1: Limpieza Profunda de Dependencias ---
echo "  - Diagnóstico: Posible inconsistencia de dependencias."
echo "  - Acción: Eliminando 'node_modules' y 'package-lock.json' para forzar una reinstalación limpia..."

rm -rf node_modules package-lock.json

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: No se pudo eliminar 'node_modules' o 'package-lock.json'. Es posible que no existieran, continuando..."
fi
echo "  - ✅ Limpieza completada."
echo "------------------------------------------------------------"

# --- Paso 2: Reinstalación desde cero (Solo Producción) ---
echo "  - Acción: Realizando una instalación limpia de dependencias de producción..."

npm install --omit=dev

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: 'npm install' falló. Revisa 'package.json' por posibles errores."
    exit 1
fi
echo "  - ✅ Dependencias reinstaladas con éxito."
echo "------------------------------------------------------------"


# --- Paso 3: Verificación de la compilación post-corrección ---
echo "  - Verificación: Reintentando la compilación de producción..."

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La compilación falló incluso después de la corrección."
    echo "   Por favor, revisa los logs de 'npm run build' para identificar otros posibles errores."
    exit 1
fi

echo "✅ ¡Éxito! El error de compilación ha sido corregido."
echo "✅ Engranaje de corrección de compilación completado."
echo "------------------------------------------------------------"
exit 0
