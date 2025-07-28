
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '../ui/label';
import { Check, X, LoaderCircle } from 'lucide-react';
import { Switch } from '../ui/switch';

interface Step2_UsernameProps {
  onBack: () => void;
  onNext: () => void;
}

type ValidationState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

export default function Step2_Username({ onBack, onNext }: Step2_UsernameProps) {
  const [username, setUsername] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const forbiddenWords = ['admin', 'root', 'support', 'terrorist', 'crime']; // Simplified list

  useEffect(() => {
    if (!username) {
      setValidationState('idle');
      setError('');
      return;
    }

    // Client-side forbidden word check
    const hasForbiddenWord = forbiddenWords.some(word => username.toLowerCase().includes(word));
    if (hasForbiddenWord) {
      setValidationState('invalid');
      setError('El nombre de usuario contiene palabras no permitidas.');
      return;
    }
    setError('');

    const handler = setTimeout(() => {
      setValidationState('checking');
      // Simulate API call for availability
      setTimeout(() => {
        if (username.toLowerCase() === 'juanperez') {
          setValidationState('unavailable');
          setSuggestions([`${username}123`, `${username}_dev`, `jp_${username}`]);
        } else {
          setValidationState('available');
          setSuggestions([]);
        }
      }, 1000);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [username]);

  const renderFeedback = () => {
    switch (validationState) {
      case 'checking':
        return <p className="text-sm flex items-center text-muted-foreground"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Verificando disponibilidad...</p>;
      case 'available':
        return <p className="text-sm flex items-center text-green-600"><Check className="mr-2 h-4 w-4" /> ¡Nombre de usuario disponible!</p>;
      case 'unavailable':
        return <p className="text-sm flex items-center text-destructive"><X className="mr-2 h-4 w-4" /> Nombre de usuario no disponible.</p>;
      case 'invalid':
        return <p className="text-sm flex items-center text-destructive"><X className="mr-2 h-4 w-4" /> {error}</p>
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Paso 2: Elige tu nombre de usuario</h2>
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de Usuario</Label>
        <Input 
          id="username" 
          placeholder="Ej: juanperez_dev"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="h-5 mt-1">
            {renderFeedback()}
        </div>
      </div>

       <div className="flex items-center space-x-2 pt-2">
            <Switch id="show-username" defaultChecked />
            <Label htmlFor="show-username" className="text-muted-foreground">
                Usar este nombre en mi perfil público.
                <span className="block text-xs">Si se desactiva, se mostrará tu nombre completo en su lugar.</span>
            </Label>
        </div>

      {validationState === 'unavailable' && suggestions.length > 0 && (
        <div className="space-y-2">
            <p className="text-sm font-medium">Sugerencias:</p>
            <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                    <Button key={s} variant="outline" size="sm" onClick={() => setUsername(s)}>
                        {s}
                    </Button>
                ))}
            </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Atrás</Button>
        <Button onClick={onNext} disabled={validationState !== 'available'}>Continuar</Button>
      </div>
    </div>
  );
}
