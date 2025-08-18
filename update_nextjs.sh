#!/bin/bash

# ===============================================================
# =        CORABO - ENGRANAJE DE ACTUALIZACIÓN DE NEXT.JS       =
# ===============================================================
# Este script asegura que la versión de Next.js y sus dependencias
# clave estén correctamente instaladas y actualizadas, realizando
# una instalación limpia para resolver problemas de dependencias.

echo "⚙️  INICIANDO ENGRANAJE: Verificación y reinstalación de Next.js..."
echo "------------------------------------------------------------"

# Detectar el gestor de paquetes
if command -v npm &> /dev/null; then
    INSTALL_CMD="npm install"
    echo "  - Usando 'npm' para la instalación."
else
    echo "❌ Error Crítico: No se encontró 'npm'. Abortando."
    exit 1
fi

# **Paso Clave:** Limpiar instalaciones anteriores para evitar conflictos.
echo "  - Limpiando dependencias anteriores (node_modules y package-lock.json)..."
rm -rf node_modules package-lock.json
echo "  - ✅ Limpieza completada."

# Instalar todas las dependencias desde cero para asegurar consistencia.
echo "  - Realizando una instalación limpia de todas las dependencias..."
$INSTALL_CMD

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La instalación limpia de dependencias falló."
    exit 1
fi

echo "✅ Engranaje de actualización de Next.js completado. Las dependencias han sido reinstaladas."
echo "------------------------------------------------------------"
exit 0
