"use client";

import { useSearchParams } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { ServiceCard } from '@/components/ServiceCard';

export default function ServicesPage() {
    const { services } = useCorabo();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');

    const filteredServices = category
        ? services.filter(s => s.category === category)
        : services;

    return (
        <main className="container py-8">
            <h1 className="text-3xl font-bold mb-2">
                {category ? `Servicios de ${category}` : 'Todos los Servicios'}
            </h1>
            <p className="text-muted-foreground mb-8">Encuentra el prestador de servicios ideal para ti.</p>
            
            {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(service => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No hay servicios en esta categoría.</p>
                </div>
            )}
        </main>
    );
}
