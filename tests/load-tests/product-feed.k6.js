
import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * **Test de Límite de Memoria (Controlado)**
 * 
 * **Justificación Forense:** Esta no es una prueba de carga típica. Su objetivo es
 * forense: identificar el punto de quiebre del sistema. Al aumentar gradualmente los
 * usuarios virtuales (VUs), podemos monitorear la degradación del rendimiento (latencia)
 * y el consumo de memoria del servidor (a través de herramientas de APM externas).
 * El umbral estricto de 1000ms nos permite detectar un cuello de botella antes de que
 * cause un fallo catastrófico (MemoryAllocationError), dándonos datos precisos sobre
 * la capacidad máxima actual de nuestra infraestructura.
 */

export const options = {
  stages: [
    // Rampa suave para calentar el sistema
    { duration: '10s', target: 10 },
    // Aumento gradual para encontrar el punto de quiebre
    { duration: '50s', target: 100 }, 
    // Rampa de descenso para finalizar la prueba de forma controlada
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // El 95% de las peticiones deben completarse en menos de 1 segundo.
    // Este es nuestro principal indicador de rendimiento. Si se supera,
    // el sistema está sobrecargado.
    http_req_duration: ['p(95)<1000'],
    // El test fallará si más del 1% de las peticiones resultan en error.
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Simula la petición a la primera página del feed de productos.
  // En un entorno real, la URL apuntaría al servidor en pruebas.
  const res = http.get('http://localhost:9002/api/products?limit=10');

  // Verificación del resultado
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response contains products': (r) => r.json('products') !== undefined,
  });

  // Pausa para simular el comportamiento de un usuario real
  sleep(1);
}
