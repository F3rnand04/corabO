
"use client";

import { Home, Laptop, Heart, GraduationCap, PartyPopper, Scissors, Car, Truck, UtensilsCrossed } from 'lucide-react';

interface CategoryHubProps {
  onCategorySelect?: (categoryName: string) => void;
}

const categories = [
  { name: 'Hogar y Reparaciones', icon: Home },
  { name: 'Tecnología y Soporte', icon: Laptop },
  { name: 'Automotriz y Repuestos', icon: Car },
  { name: 'Alimentos y Restaurantes', icon: UtensilsCrossed },
  { name: 'Salud y Bienestar', icon: Heart },
  { name: 'Educación', icon: GraduationCap },
  { name: 'Eventos', icon: PartyPopper },
  { name: 'Belleza', icon: Scissors },
  { name: 'Fletes y Delivery', icon: Truck },
];

export function CategoryHub({ onCategorySelect }: CategoryHubProps) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-8">Explora Categorías</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        {categories.map((category) => (
            <div 
              key={category.name}
              onClick={() => onCategorySelect?.(category.name)}
              className="flex flex-col items-center justify-center p-2 aspect-square rounded-2xl hover:bg-muted transition-all cursor-pointer group border"
            >
              <category.icon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-semibold text-center text-sm mt-3 text-foreground">{category.name}</p>
            </div>
        ))}
      </div>
    </div>
  );
}
