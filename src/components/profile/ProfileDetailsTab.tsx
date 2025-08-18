'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function ProfileDetailsTab() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Detalles del Perfil</CardTitle>
        <CardDescription>
          Añade o modifica tu horario, especialidad, información de contacto y otros detalles específicos de tu categoría profesional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => router.push('/profile/details')}>
            <Edit className="mr-2 h-4 w-4" />
            Ir a la página de edición
        </Button>
      </CardContent>
    </Card>
  );
}
