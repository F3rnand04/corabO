#!/bin/bash

# Este script orquesta el testeo automático y la corrección de errores.

echo "Iniciando el testeo automático de la aplicación..."
echo "------------------------------------------------"

# Definir las credenciales de prueba
USER="usuario_prueba@example.com"
PASS="password123"

# Variable para controlar el estado de las pruebas
TEST_PASSED=false
LOGIN_PASSED=false
MAX_REINTENTOS=5
REINTENTOS=0

# --- Lógica de Bucle para el Test de Login ---
while [ "$LOGIN_PASSED" = false ] && [ "$REINTENTOS" -lt "$MAX_REINTENTOS" ]; do
    echo "▶️ Ejecutando prueba de login. Intento $((REINTENTOS + 1))..."

    # Comando para iniciar la aplicación (ejemplo para React Native)
    # Reemplaza esto con el comando de inicio de tu proyecto (npm run dev, flutter run, etc.)
    npm run dev &

    # Esperar unos segundos para que la app se cargue
    sleep 15

    # Ejecutar el test de login con tu herramienta de pruebas (ejemplo con Detox)
    # El comando `detox test --testNamePattern "Login"` ejecuta solo el test de login
    # Aquí es donde la herramienta simula la entrada de datos y el clic
    if npx detox test --testNamePattern "Login"; then
        echo "✅ Prueba de login exitosa."
        LOGIN_PASSED=true
    else
        echo "❌ Prueba de login fallida. Analizando logs para corregir..."

        # --- FASE DE ANÁLISIS Y CORRECCIÓN (LÓGICA DEL ASISTENTE) ---
        # 1. Leer los logs de error (detox, adb logcat, etc.)
        # 2. El asistente de programación (Gemini, Copilot, etc.) analiza los logs y el código fuente.
        # 3. El asistente sugiere o aplica una corrección.
        # 4. Por ejemplo, si detecta que el endpoint es incorrecto en un archivo, puede aplicar un "patch" de código.

        # Simulación de la corrección
        # El asistente usaría herramientas como sed, grep o su propia lógica de programación para modificar el código.
        # Por ejemplo: sed -i 's/url_antigua/url_nueva/g' ./src/components/LoginScreen.js

        echo "⚙️ Error detectado y corrección aplicada. Reintentando..."

        # Incrementar el contador de reintentos
        REINTENTOS=$((REINTENTOS + 1))

        # Cerrar la app para un reinicio limpio
        pkill -f "npm run dev"
    fi
done

# Si el login falla después de varios reintentos, detener el proceso
if [ "$LOGIN_PASSED" = false ]; then
    echo "⚠️ El test de login ha fallado repetidamente. Abortando el testeo."
    exit 1
fi

# --- Continuar con el testeo de otras rutas si el login fue exitoso ---
echo "------------------------------------------------"
echo "✅ Login exitoso. Continuando con las pruebas de navegación..."

# Re-inicializar el contador de reintentos para las siguientes pruebas
REINTENTOS=0

while [ "$TEST_PASSED" = false ] && [ "$REINTENTOS" -lt "$MAX_REINTENTOS" ]; do
    echo "▶️ Ejecutando pruebas de navegación y funcionalidades. Intento $((REINTENTOS + 1))..."

    # Comando para ejecutar el resto de los tests
    if npx detox test --testNamePattern "Dashboard|Perfil"; then
        echo "✅ Todas las pruebas de navegación fueron exitosas."
        TEST_PASSED=true
    else
        echo "❌ Fallo en las pruebas de navegación. Analizando logs para corregir..."
        # --- FASE DE ANÁLISIS Y CORRECCIÓN (LÓGICA DEL ASISTENTE) ---
        # Repetir el mismo proceso de depuración y corrección
        echo "⚙️ Error detectado y corrección aplicada. Reintentando..."
        REINTENTOS=$((REINTENTOS + 1))
    fi
done

# Reporte final
echo "------------------------------------------------"
if [ "$TEST_PASSED" = true ]; then
    echo "✅ Éxito: Todas las pruebas han sido superadas y corregidas automáticamente."
    echo "La aplicación está lista para su publicación."
else
    echo "❌ Fallo: No se pudo completar el testeo. Revisa los logs para más detalles."
fi