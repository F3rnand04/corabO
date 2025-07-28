
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: { id: number; name: string }[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={cn('relative', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : '')}>
            {step.id < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background hover:border-gray-400">
                  <span className="sr-only">{step.name}</span>
                </div>
              </>
            )}
             <p className="absolute -bottom-7 w-max -left-2 text-center text-xs text-muted-foreground">{step.name}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
