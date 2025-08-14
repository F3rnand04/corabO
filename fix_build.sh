#!/bin/bash

# ===============================================================
# =        CORABO - ENGRANAJE DE CORRECCIÓN DE COMPILACIÓN      =
# ===============================================================
# Este script diagnostica y corrige el error de compilación por la
# falta de 'react-day-picker' y luego verifica que la compilación
# sea exitosa.

echo "⚙️  INICIANDO ENGRANAJE: Corrección de compilación..."
echo "------------------------------------------------------------"

# --- Paso 1: Detección y corrección de la dependencia ---
echo "  - Diagnóstico: Falta el módulo 'react-day-picker'."
echo "  - Acción: Instalando el paquete faltante..."

npm install react-day-picker

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: No se pudo instalar 'react-day-picker'. Abortando."
    exit 1
fi
echo "  - ✅ Paquete 'react-day-picker' instalado con éxito."
echo "------------------------------------------------------------"

# --- Paso 2: Verificación de la compilación post-corrección ---
echo "  - Verificación: Reintentando la compilación de producción..."

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La compilación falló incluso después de la corrección."
    echo "   Por favor, revisa los logs para identificar otros posibles errores."
    exit 1
fi

echo "✅ ¡Éxito! El error de compilación ha sido corregido."
echo "✅ Engranaje de corrección de compilación completado."
echo "------------------------------------------------------------"
exit 0
