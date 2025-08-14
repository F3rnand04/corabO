#!/bin/bash

# ===============================================================
# =        CORABO - PIPELINE DE INTEGRACIÓN CONTINUA            =
# ===============================================================
# Este script unifica el testeo de dependencias, compilación y
# funcionalidad para asegurar la estabilidad de la aplicación.

echo "🚀 INICIANDO PIPELINE DE VERIFICACIÓN COMPLETA DE CORABO 🚀"
echo "------------------------------------------------------------"

# --- Engranaje 1: Verificación de Dependencias y Entorno ---
echo "⚙️  ENGRANAJE 1: Alineando dependencias..."

# 1.1 Verificando gestor de paquetes
echo "  - Buscando gestor de paquetes..."
if command -v npm &> /dev/null; then
    PM="npm"
    INSTALL_CMD="npm install"
elif command -v yarn &> /dev/null; then
    PM="yarn"
    INSTALL_CMD="yarn"
else
    echo "❌ Error Crítico: No se encontró 'npm' o 'yarn'. Abortando."
    exit 1
fi
echo "  - Gestor de paquetes detectado: $PM"

# 1.2 Verificando e instalando dependencias críticas
echo "  - Asegurando que 'next' y 'react-day-picker' estén instalados..."
$INSTALL_CMD next@latest react-day-picker

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La instalación de dependencias falló."
    exit 1
fi
echo "✅ Dependencias críticas verificadas y alineadas."
echo "------------------------------------------------------------"


# --- Engranaje 2: Verificación de Compilación de Producción ---
echo "⚙️  ENGRANAJE 2: Compilando la aplicación..."

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error Crítico: La compilación de producción (next build) falló."
    echo "   Por favor, revisa los logs de compilación para más detalles."
    exit 1
fi
echo "✅ La aplicación se compiló correctamente."
echo "------------------------------------------------------------"


# --- Engranaje 3: Pruebas de Funcionalidad (Login y Navegación) ---
echo "⚙️  ENGRANAJE 3: Ejecutando pruebas de integración..."

MAX_REINTENTOS=3
REINTENTOS=0
TEST_PASSED=false

# Lógica de bucle para reintentar en caso de fallos intermitentes
while [ "$TEST_PASSED" = false ] && [ "$REINTENTOS" -lt "$MAX_REINTENTOS" ]; do
    echo "  - ▶️ Ejecutando suite de tests (Intento $((REINTENTOS + 1)))..."
    
    # Ejecutar todos los tests de integración con Jest
    # Nota: En un entorno real, la app estaría corriendo en un servidor de pruebas.
    if jest --testPathPattern=tests/integration; then
        echo "  - ✅ Todos los tests de integración pasaron."
        TEST_PASSED=true
    else
        echo "  - ❌ Fallo en los tests de integración."
        REINTENTOS=$((REINTENTOS + 1))
        if [ "$REINTENTOS" -lt "$MAX_REINTENTOS" ]; then
            echo "  - ⚠️ Reintentando en 5 segundos..."
            sleep 5
        fi
    fi
done

if [ "$TEST_PASSED" = false ]; then
    echo "❌ Error Crítico: Las pruebas de integración fallaron repetidamente."
    echo "   La aplicación tiene un error de ejecución (posiblemente de login o carga perpetua)."
    exit 1
fi

echo "✅ Pruebas de funcionalidad verificadas."
echo "------------------------------------------------------------"


# --- Reporte Final ---
echo "🎉 ¡ÉXITO TOTAL! 🎉"
echo "Todos los engranajes (Dependencias, Compilación, Funcionalidad) están perfectamente alineados."
echo "La aplicación está estable y lista para ser desplegada."
exit 0
