#!/bin/bash

# ===============================================================
# =        CORABO - ENGRANAJE DE CORRECCIÓN DE COMPILACIÓN      =
# ===============================================================
# Este script realiza una instalación limpia de las dependencias
# para resolver posibles inconsistencias.

echo "⚙️  INICIANDO ENGRANAJE: Reinstalación de dependencias..."
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

# --- Paso 2: Reinstalación desde cero ---
echo "  - Acción: Realizando una instalación limpia de dependencias..."

npm install

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: 'npm install' falló. Revisa 'package.json' por posibles errores."
    exit 1
fi
echo "  - ✅ Dependencias reinstaladas con éxito."
echo "------------------------------------------------------------"

echo "✅ Engranaje de corrección completado."
echo "------------------------------------------------------------"
exit 0
