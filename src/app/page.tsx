import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, Car, HeartPulse, Home as HomeIcon, Laptop, Search, Wrench } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  const categories = [
    { name: 'Hogar', icon: HomeIcon, href: '/services?category=Hogar' },
    { name: 'Tecnología', icon: Laptop, href: '/products?category=Tecnología' },
    { name: 'Salud', icon: HeartPulse, href: '/services?category=Salud' },
    { name: 'Reparaciones', icon: Wrench, href: '/services?category=Reparaciones' },
    { name: 'Automotriz', icon: Car, href: '/services?category=Automotriz' },
    { name: 'Profesional', icon: Briefcase, href: '/services?category=Profesional' },
  ];

  return (
    <main className="flex flex-col items-center">
      <section className="w-full py-20 md:py-32 bg-primary/10">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Confianza en cada transacción
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl mb-8">
            Encuentra productos y servicios de prestadores verificados. Todo el proceso, desde la cotización hasta el pago, queda registrado de forma transparente.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar servicios o productos..."
              className="w-full pl-10 h-12 text-base rounded-full shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10">Explora por Categoría</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link href={category.href} key={category.name}>
                <Card className="text-center hover:shadow-lg hover:-translate-y-1 transition-transform duration-200 cursor-pointer group">
                  <CardHeader>
                    <category.icon className="h-10 w-10 mx-auto text-primary group-hover:scale-110 transition-transform" />
                    <CardTitle className="mt-4 text-lg">{category.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
       <section className="w-full py-20 bg-muted/50">
        <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">¿Eres un prestador de servicios?</h2>
            <p className="max-w-xl mx-auto text-muted-foreground mb-8">
                Únete a Corabo para llegar a más clientes, gestionar tus servicios y construir una reputación sólida.
            </p>
            <Button size="lg">Regístrate como Óbiamigo</Button>
        </div>
      </section>

    </main>
  );
}
