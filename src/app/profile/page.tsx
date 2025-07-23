'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  // Datos de ejemplo del usuario (reemplaza con datos reales)
  const user = {
    name: "NOMBRE USUARIO",
    specialty: "ESPECIALIDAD",
    rating: 4.9,
    efficiency: "99.9%",
    completedJobs: "00 | 05",
    publications: 30,
    totalJobs: 15,
    profileImage: "/placeholder-avatar.png", // Ruta a la imagen de perfil
    mainImage: "/placeholder-main.png", // Ruta a la imagen principal
    shareCount: 4567,
    starCount: 8934.5,
    thumbnails: [
      "/placeholder-thumb1.png",
      "/placeholder-thumb2.png",
      "/placeholder-thumb3.png",
      "/placeholder-thumb4.png",
      "/placeholder-thumb5.png",
      "/placeholder-thumb6.png",
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <main className="container py-4 space-y-4"> {/* Usando container y space-y-4 como en el home */}
        {/* Sección de Encabezado del Perfil */}
        <Card> {/* Ejemplo de uso de un componente Card */}
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="relative">
              <Image
                src={user.profileImage}
                alt="Profile Picture"
                width={64} // Ajusta el tamaño según sea necesario
                height={64} // Ajusta el tamaño según sea necesario
                className="rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border-2 border-white cursor-pointer">
                +
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{user.name}</h1>
              <p className="text-sm text-gray-600">{user.specialty}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Estadísticas */}
        <Card>
          <CardContent className="p-4 flex justify-around items-center text-center text-gray-700">
            <div className="flex items-center space-x-1">
              <i className="fas fa-star text-yellow-400"></i>
              <span className="font-medium">{user.rating.toFixed(1)}</span>
            </div>
            <div>
              <p className="font-medium">{user.efficiency}</p>
              <p className="text-xs text-gray-500">Efec.</p>
            </div>
            <div>
              <p className="font-medium">{user.completedJobs}</p>
              <p className="text-xs text-gray-500">Trab. Realizados</p>
            </div>
            <div>
              <p className="font-medium">{user.publications}</p>
              <p className="text-xs text-gray-500">Publicaciones</p>
            </div>
            <div>
              <p className="font-medium">{user.totalJobs}</p>
              <p className="text-xs text-gray-500">Trab. Realizados</p>
            </div>
          </CardContent>
        </Card>

        {/* Botón de Gestión de Campañas */}
        <div className="flex justify-end">
          <button className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
            GESTION DE CAMPAÑAS
          </button>
        </div>

        {/* Sección de Contenido Principal (Imagen y Tabs) */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Tarjeta de Imagen Principal */}
            <div className="relative">
              <Image
                src={user.mainImage}
                alt="Main content image"
                width={600} // Ajusta el tamaño según sea necesario
                height={400} // Ajusta el tamaño según sea necesario
                className="rounded-lg object-cover w-full"
              />
              <div className="absolute top-6 right-6 flex flex-col items-center space-y-1 bg-white bg-opacity-75 p-1 rounded"> {/* Fondo semitransparente para mejor visibilidad */}
                <i className="fas fa-share-alt text-gray-600 text-xl cursor-pointer"></i>
                <span className="text-xs text-gray-600">{user.shareCount}</span>
              </div>
              <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-1 bg-white bg-opacity-75 p-1 rounded"> {/* Fondo semitransparente */}
                <i className="fas fa-star text-yellow-400 text-2xl cursor-pointer"></i>
                <span className="text-sm text-gray-700 font-semibold">{user.starCount.toFixed(1)}</span>
              </div>
            </div>

            {/* Tabs de Promoción y Descripción */}
            <div className="flex justify-around text-gray-700 font-medium text-lg border-b border-gray-200"> {/* Añadido borde inferior */}
              <span className="border-b-2 border-green-500 pb-2 cursor-pointer">Promoción del Día</span> {/* Ajustado padding y cursor */}
              <span className="pb-2 cursor-pointer">Editar Descripción</span> {/* Ajustado padding y cursor */}
            </div>

            {/* Grid de Thumbnails */}
            <div className="grid grid-cols-3 gap-4">
              {user.thumbnails.map((thumb, index) => (
                <div key={index} className="relative">
                  <Image
                    src={thumb}
                    alt={`Thumbnail ${index + 1}`}
                    width={100} // Ajusta el tamaño según sea necesario
                    height={100} // Ajusta el tamaño según sea necesario
                    className="rounded-lg object-cover w-full h-auto"
                  />
                  {/* Considera añadir un overlay o indicador si un thumbnail es el "del día" */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
