
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Search,
  Upload,
  PlusCircle,
  Users,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function QuotesHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <p className="font-semibold">Solicitar Cotización</p>
          </div>
          <Button variant="ghost" size="icon">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}

const serviceGroups = [
    { name: 'Hogar y Reparaciones' },
    { name: 'Tecnología y Soporte' },
    { name: 'Salud y Bienestar' },
    { name: 'Educación y Capacitación' },
    { name: 'Eventos y Entretenimiento' },
    { name: 'Belleza y Cuidado Personal' },
];

export default function QuotesPage() {
  return (
    <>
      <QuotesHeader />
      <main className="container py-6">
        <div className="mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                 <Select>
                    <SelectTrigger className="w-[150px]">
                      <Users className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="GRUPOS" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceGroups.map((group) => (
                        <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar servicio o producto..." className="pl-10" />
                 </div>
              </div>
              
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="needs" className="text-base font-semibold">
                  QUÉ NECESITAS:
                </Label>
                <Input
                  id="needs"
                  placeholder="Ej: Título breve y claro de tu solicitud..."
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Descripción:
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe con detalle lo que necesitas. Incluye marcas, modelos, medidas, urgencia o cualquier otro dato que ayude a los proveedores a darte una cotización precisa."
                  rows={6}
                  className="text-base"
                />
              </div>

              <div className="flex justify-between items-center">
                <Button variant="link" className="p-0 text-green-600 h-auto">
                  Enviar
                </Button>
                <Button variant="ghost" size="icon">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6">
            <Button variant="ghost" className="w-full justify-start">
              <PlusCircle className="mr-2 h-5 w-5" />
              Búsqueda Avanzada
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
