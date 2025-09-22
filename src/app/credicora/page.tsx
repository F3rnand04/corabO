
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck, TrendingUp, Gem, Star, Award, Zap, Percent, Building, User } from 'lucide-react';
import { credicoraLevels, credicoraCompanyLevels } from '@/lib/data/options';
import { Separator } from '@/components/ui/separator';

function CredicoraHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Star className="w-6 h-6 fill-current"/>
            <h1 className="text-xl">Credicora</h1>
          </div>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

const benefits = [
    {
        icon: ShieldCheck,
        title: "Seguridad para Todos",
        description: "Para el proveedor, es la garantía de pago. Para el cliente, es la confianza de que su dinero está protegido hasta que el servicio se complete satisfactoriamente."
    },
    {
        icon: TrendingUp,
        title: "Más Clientes, Más Ventas",
        description: "Al ofrecer flexibilidad, los proveedores atraen a un universo de clientes que de otra manera no podrían comprar. ¡Más opciones para ellos, más ingresos para ti!"
    },
    {
        icon: Gem,
        title: "Reputación que Brilla",
        description: "Cada transacción exitosa con Credicora es un paso más para construir una reputación de confianza, desbloqueando nuevos niveles y mayores límites de crédito."
    }
];

const LevelTable = ({ levels, title, icon }: { levels: any, title: string, icon: React.ElementType }) => {
    const Icon = icon;
    return (
        <section>
            <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <Icon className="w-6 h-6" />
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.values(levels).map((level: any) => (
                     <Card key={level.level} className="flex flex-col">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">{level.name}</CardTitle>
                            <CardDescription>Nivel {level.level}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3 text-sm">
                            <p>Límite de Crédito: <span className="font-bold">${level.creditLimit.toLocaleString()}</span></p>
                            <p>Pago Inicial Mínimo: <span className="font-bold">{level.initialPaymentPercentage * 100}%</span></p>
                            <p>Cuotas Flexibles: <span className="font-bold">{level.installments}</span></p>
                        </CardContent>
                        <div className="p-4 bg-muted/50 text-center text-xs font-semibold rounded-b-lg">
                           Requiere {level.transactionsForNextLevel} transacciones
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
};


export default function CredicoraPage() {
    const router = useRouter();
  return (
    <>
      <CredicoraHeader />
      <main className="container max-w-7xl mx-auto py-8 space-y-12">
        <section className="text-center">
            <h2 className="text-3xl font-bold">El Motor de Crecimiento y Confianza de Corabo</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Credicora no es solo un sistema de pago, es un ecosistema de confianza que te permite comprar con flexibilidad y vender con seguridad.
            </p>
        </section>

        <div className="grid md:grid-cols-3 gap-6">
            {benefits.map(benefit => (
                <Card key={benefit.title} className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <benefit.icon className="w-6 h-6"/>
                        </div>
                        <CardTitle>{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Separator />
        
        <div className="space-y-10">
            <LevelTable levels={credicoraLevels} title="Niveles para Personas y Profesionales" icon={User} />
            <LevelTable levels={credicoraCompanyLevels} title="Niveles para Empresas" icon={Building} />
        </div>
        
        <p className="text-center text-muted-foreground pt-4">Avanza a través de nuestros niveles completando transacciones y construyendo una reputación sólida. Cada nivel desbloquea mayores beneficios.</p>

        <Separator />

        <section className="grid md:grid-cols-2 gap-8 items-center">
            <div>
                <h2 className="text-2xl font-bold mb-4">Políticas de Uso y Comisiones</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p>Para mantener este ecosistema seguro y en crecimiento, Credicora opera con una pequeña comisión de servicio.</p>
                    <p>
                        <span className="font-bold text-primary">Para Proveedores:</span> Se aplica una comisión de servicio sobre el valor total de la venta (sin incluir delivery) al utilizar Credicora. Esta comisión nos permite cubrir los costos operativos y seguir desarrollando herramientas para tu éxito.
                    </p>
                     <ul className="list-disc pl-5 text-sm">
                        <li><span className="font-bold">8%</span> de comisión para pagos con Credicora.</li>
                        <li><span className="font-bold">5%</span> de comisión si el cliente que paga está suscrito (beneficio anula la tasa del 8%).</li>
                    </ul>
                    <p>
                        <span className="font-bold text-primary">Para Clientes:</span> ¡Usar Credicora es <span className="font-bold">totalmente gratis!</span> No hay costos ocultos. Solo pagas el precio del producto o servicio.
                    </p>
                </div>
            </div>
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="text-yellow-500 fill-yellow-500"/> Beneficios de Suscriptor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="flex items-center gap-2"><Percent className="w-4 h-4 text-primary"/> Comisión de Credicora reducida al <span className="font-bold">5%</span>.</p>
                    <p className="flex items-center gap-2"><Award className="w-4 h-4 text-primary"/> Progresión de nivel <span className="font-bold">más rápida.</span></p>
                    <p className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/> Acceso a herramientas de promoción avanzadas.</p>
                     <Button className="w-full mt-4" onClick={() => router.push('/contacts')}>
                        ¡Suscríbete Ahora!
                    </Button>
                </CardContent>
            </Card>
        </section>
      </main>
    </>
  );
}

  