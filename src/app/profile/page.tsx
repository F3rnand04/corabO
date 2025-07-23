'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const providerProfile = {
    name: "Tecno Soluciones S.A.",
    specialty: "Reparación de Computadoras",
    rating: 4.8,
    efficiency: "99.9%",
    completedJobs: "85 | 10",
    publications: 5,
    totalJobs: 95,
    profileImage: "https://placehold.co/128x128.png",
    mainImage: "https://placehold.co/600x400.png",
    shareCount: 4567,
    starCount: 8934.5,
    thumbnails: [
      "https://placehold.co/100x100.png",
      "https://placehold.co/100x100.png",
      "https://placehold.co/100x100.png",
      "https://placehold.co/100x100.png",
      "https://placehold.co/100x100.png",
      "https://placehold.co/100x100.png",
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <main className="container py-4 space-y-4">
        {/* Profile Header Section */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="relative">
              <Image
                src={providerProfile.profileImage}
                alt="Profile Picture"
                width={64}
                height={64}
                className="rounded-full object-cover"
                data-ai-hint="user profile"
              />
              <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border-2 border-white cursor-pointer">
                +
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{providerProfile.name}</h1>
              <p className="text-sm text-gray-600">{providerProfile.specialty}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card>
          <CardContent className="p-4 flex justify-around items-center text-center text-gray-700">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
              <span className="font-medium">{providerProfile.rating.toFixed(1)}</span>
            </div>
            <div>
              <p className="font-medium">{providerProfile.efficiency}</p>
              <p className="text-xs text-gray-500">Efec.</p>
            </div>
            <div>
              <p className="font-medium">{providerProfile.completedJobs}</p>
              <p className="text-xs text-gray-500">Trab. Realizados</p>
            </div>
            <div>
              <p className="font-medium">{providerProfile.publications}</p>
              <p className="text-xs text-gray-500">Publicaciones</p>
            </div>
            <div>
              <p className="font-medium">{providerProfile.totalJobs}</p>
              <p className="text-xs text-gray-500">Trab. Realizados</p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Management Button */}
        <div className="flex justify-end">
          <Button className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
            GESTION DE CAMPAÑAS
          </Button>
        </div>

        {/* Main Content (Image and Tabs) */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Main Image Card */}
            <div className="relative">
              <Image
                src={providerProfile.mainImage}
                alt="Main content image"
                width={600}
                height={400}
                className="rounded-lg object-cover w-full"
                data-ai-hint="professional workspace"
              />
              <div className="absolute top-6 right-6 flex flex-col items-center space-y-1 bg-white bg-opacity-75 p-1 rounded">
                <Share2 className="text-gray-600 h-5 w-5 cursor-pointer"/>
                <span className="text-xs text-gray-600">{providerProfile.shareCount}</span>
              </div>
              <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-1 bg-white bg-opacity-75 p-1 rounded">
                <Star className="text-yellow-400 fill-yellow-400 h-6 w-6 cursor-pointer"/>
                <span className="text-sm text-gray-700 font-semibold">{providerProfile.starCount.toFixed(1)}</span>
              </div>
            </div>

            {/* Promotion and Description Tabs */}
            <div className="flex justify-around text-gray-700 font-medium text-lg border-b border-gray-200">
              <span className="border-b-2 border-green-500 pb-2 cursor-pointer">Promoción del Día</span>
              <span className="pb-2 cursor-pointer">Editar Descripción</span>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-3 gap-4">
              {providerProfile.thumbnails.map((thumb, index) => (
                <div key={index} className="relative">
                  <Image
                    src={thumb}
                    alt={`Thumbnail ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover w-full h-auto"
                    data-ai-hint="product image"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
