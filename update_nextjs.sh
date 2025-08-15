#!/bin/bash

# ===============================================================
# =        CORABO - ENGRANAJE DE ACTUALIZACIÓN DE NEXT.JS       =
# ===============================================================
# Este script asegura que la versión de Next.js y sus dependencias
# clave estén correctamente instaladas y actualizadas.

echo "⚙️  INICIANDO ENGRANAJE: Verificación de Next.js..."
echo "------------------------------------------------------------"

# Detectar el gestor de paquetes
if command -v npm &> /dev/null; then
    INSTALL_CMD="npm install"
    echo "  - Usando 'npm' para la instalación."
else
    echo "❌ Error Crítico: No se encontró 'npm'. Abortando."
    exit 1
fi

# Instalar/actualizar Next.js y dependencias relacionadas
# Se añade react-day-picker como parte de la verificación de dependencias clave.
echo "  - Alineando Next.js y dependencias críticas (react, react-dom)..."
$INSTALL_CMD next@14.2.6 react@18.3.1 react-dom@18.3.1

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La actualización de Next.js falló."
    exit 1
fi

echo "✅ Engranaje de actualización de Next.js completado."
echo "------------------------------------------------------------"
exit 0
