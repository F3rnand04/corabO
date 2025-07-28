
"use client";

import { Home, Laptop, Heart, GraduationCap, PartyPopper, Scissors, Car } from 'lucide-react';
import Link from 'next/link';

interface CategoryHubProps {
  onCategorySelect?: () => void;
}

const categories = [
  { name: 'Hogar y Reparaciones', icon: Home, color: 'bg-blue-500', href: '/services?category=Hogar' },
  { name: 'Tecnología y Soporte', icon: Laptop, color: 'bg-green-500', href: '/services?category=Tecnología' },
  { name: 'Automotriz y Repuestos', icon: Car, color: 'bg-gray-500', href: '/services?category=Automotriz' },
  { name: 'Salud y Bienestar', icon: Heart, color: 'bg-red-500', href: '/services?category=Salud' },
  { name: 'Educación', icon: GraduationCap, color: 'bg-yellow-500', href: '/services?category=Educacion' },
  { name: 'Eventos', icon: PartyPopper, color: 'bg-purple-500', href: '/services?category=Eventos' },
  { name: 'Belleza', icon: Scissors, color: 'bg-pink-500', href: '/services?category=Belleza' },
];

export function CategoryHub({ onCategorySelect }: CategoryHubProps) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-8">Explora Categorías</h2>
      <div className="grid grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link href={category.href} key={category.name} passHref>
            <div 
              onClick={onCategorySelect}
              className="flex flex-col items-center justify-center p-2 aspect-square rounded-2xl hover:scale-105 transition-all cursor-pointer group"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${category.color} shadow-lg group-hover:shadow-xl`}>
                 <category.icon className="w-10 h-10 text-white" />
              </div>
              <p className="font-semibold text-center text-sm mt-3">{category.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
