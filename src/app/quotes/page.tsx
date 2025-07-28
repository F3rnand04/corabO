
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
} from 'lucide-react';

function QuotesHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-semibold">Cotizar</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-full">
              <Users className="mr-2 h-4 w-4" />
              Grupo
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
      <Separator />
    </header>
  );
}

export default function QuotesPage() {
  return (
    <>
      <QuotesHeader />
      <main className="container py-6">
        <div className="mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="needs" className="text-base font-semibold">
                  QUÉ NECESITAS:
                </Label>
                <Input
                  id="needs"
                  placeholder="Ej: Repuesto para laptop, servicio de plomería..."
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
                  placeholder="Añade detalles, marcas, o la urgencia de tu solicitud..."
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
