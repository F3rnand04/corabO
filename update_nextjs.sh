#!/bin/bash

# Este script verifica e instala automáticamente la última versión de Next.js
# utilizando los gestores de paquetes más comunes.
# La lógica de "engranaje" asegura que todo esté correctamente alineado.

echo "Iniciando el proceso de actualización y verificación de Next.js..."
echo "------------------------------------------------------------------"

# --- SECCIÓN DE CONFIGURACIÓN ---
# Define la versión que quieres instalar: "canary" o "latest"
VERSION="latest"

# --- LÓGICA DE DETECCIÓN Y EJECUCIÓN (Engranaje 1) ---
# Se verifica qué gestor de paquetes está disponible para usar el correcto.
echo "🔍 Buscando gestores de paquetes disponibles..."
if command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
elif command -v pnpm &> /dev/null;
    PACKAGE_MANAGER="pnpm"
elif command -v bun &> /dev/null; then
    PACKAGE_MANAGER="bun"
else
    echo "❌ Error: No se encontró ningún gestor de paquetes (npm, yarn, pnpm, bun)."
    echo "⚠️ Por favor, instala uno para continuar. Abortando."
    exit 1
fi

echo "✅ Gestor de paquetes detectado: $PACKAGE_MANAGER"

# --- PROCESO DE INSTALACIÓN Y ACTUALIZACIÓN (Engranaje 2) ---
# Se intenta instalar/actualizar la versión de Next.js.
echo "🚀 Actualizando Next.js a la versión '$VERSION' con $PACKAGE_MANAGER..."
case "$PACKAGE_MANAGER" in
    "npm")
        npm i next@$VERSION
        ;;
    "yarn")
        yarn add next@$VERSION
        ;;
    "pnpm")
        pnpm add next@$VERSION
        ;;
    "bun")
        bun add next@$VERSION
        ;;
esac

# Verificar si el comando de instalación fue exitoso
if [ $? -ne 0 ]; then
    echo "❌ Error: La instalación de Next.js falló. Revisa la salida del comando anterior."
    echo "⚠️ El engranaje no está alineado. Por favor, revisa manualmente. Abortando."
    exit 1
fi

echo "✅ Next.js se ha actualizado con éxito."

# --- VERIFICACIÓN DE VERSIONES (Engranaje 3) ---
# Se valida que la versión instalada esté en el archivo de dependencias.
echo "✅ Verificando que Next.js esté en el archivo de dependencias..."
if grep -q '"next":' package.json; then
    INSTALLED_VERSION=$(grep '"next":' package.json | awk -F'"' '{print $4}')
    echo "✅ Versión de Next.js instalada: $INSTALLED_VERSION"
    echo "👍 La configuración del proyecto está perfectamente alineada."
else
    echo "❌ Error: No se pudo encontrar Next.js en el archivo package.json."
    echo "⚠️ El engranaje no está completo. Revisa la instalación. Abortando."
    exit 1
fi

# --- RESULTADO FINAL ---
echo "------------------------------------------------------------------"
echo "✅ ¡Éxito! El sistema está perfectamente alineado. La versión de Next.js ha sido verificada y está lista."
echo "La aplicación puede continuar con sus procesos."
exit 0
