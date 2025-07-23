
"use client";

import { Home, Laptop, Heart, GraduationCap, PartyPopper, Scissors } from 'lucide-react';
import Link from 'next/link';

interface CategoryHubProps {
  onCategorySelect?: () => void;
}

const categories = [
  { name: 'Hogar', icon: Home, color: 'text-blue-500', href: '/services?category=Hogar' },
  { name: 'Tecnología', icon: Laptop, color: 'text-green-500', href: '/services?category=Tecnología' },
  { name: 'Salud', icon: Heart, color: 'text-red-500', href: '/services?category=Salud' },
  { name: 'Educación', icon: GraduationCap, color: 'text-yellow-500', href: '/services?category=Educacion' },
  { name: 'Eventos', icon: PartyPopper, color: 'text-purple-500', href: '/services?category=Eventos' },
  { name: 'Belleza', icon: Scissors, color: 'text-pink-500', href: '/services?category=Belleza' },
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
              className="flex flex-col items-center justify-center p-4 aspect-square bg-muted/50 rounded-2xl hover:bg-muted transition-all cursor-pointer group"
            >
              <category.icon className={`w-10 h-10 ${category.color} mb-2 transition-transform group-hover:scale-110`} />
              <p className="font-semibold text-center text-sm">{category.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
