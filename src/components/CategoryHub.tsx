
"use client";

import { Home, Laptop, Heart, GraduationCap, PartyPopper, Scissors } from 'lucide-react';
import Link from 'next/link';

interface CategoryHubProps {
  onCategorySelect?: () => void;
}

const categories = [
  { name: 'Hogar y Reparaciones', icon: Home, color: 'bg-blue-500', href: '/services?category=Hogar' },
  { name: 'Tecnología y Soporte', icon: Laptop, color: 'bg-green-500', href: '/services?category=Tecnología' },
  { name: 'Salud y Bienestar', icon: Heart, color: 'bg-red-500', href: '/services?category=Salud' },
  { name: 'Educación', icon: GraduationCap, color: 'bg-yellow-500', href: '/services?category=Educacion' },
  { name: 'Eventos', icon: PartyPopper, color: 'bg-purple-500', href: '/services?category=Eventos' },
  { name: 'Belleza', icon: Scissors, color: 'bg-pink-500', href: '/services?category=Belleza' },
];

export function CategoryHub({ onCategorySelect }: CategoryHubProps) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-8">Explora Categorías</h2>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link href={category.href} key={category.name} passHref>
            <div 
              onClick={onCategorySelect}
              className="flex flex-col items-center justify-center p-2 aspect-square rounded-full hover:scale-105 transition-all cursor-pointer group"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${category.color} shadow-lg`}>
                 <category.icon className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-center text-xs mt-2">{category.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
