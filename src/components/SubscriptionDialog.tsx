
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, CheckCircle, Star, Info } from 'lucide-react';
import { useCorabo } from "@/contexts/CoraboContext";
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface SubscriptionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const plans = {
  personal: {
    title: "Personal Plan",
    description: "Ideal for clients and basic providers looking to establish a solid foundation of trust and credibility.",
    price: 5,
    annualPrice: 40,
    annualDiscount: "save 33%",
    features: [
      "Rigorous Identity Verification",
      "Verified Profile Badge",
      "Build a solid reputation",
      "Priority Support",
    ],
  },
  professional: {
    title: "Professional Plan",
    description: "Aimed at professionals with a higher volume of work or who want greater visibility.",
    price: 12,
    annualPrice: 95,
    annualDiscount: "save 33%",
    features: [
      "All benefits of the Personal Plan",
      "Increased visibility in searches",
      "Access to priority business opportunities",
      "Basic performance statistics",
    ],
  },
  company: {
    title: "Business Plan",
    description: "Designed for companies and legal entities that need to project an image of maximum trust.",
    price: 25,
    annualPrice: 190,
    annualDiscount: "save 37.5%",
    features: [
      "All benefits of the Professional Plan",
      "Multi-User Management (Coming Soon)",
      "Advanced Profile Statistics",
      "Featured Promotion Options",
    ],
  }
};


export function SubscriptionDialog({ isOpen, onOpenChange }: SubscriptionDialogProps) {
  const { currentUser, transactions, subscribeUser, checkIfShouldBeEnterprise } = useCorabo();
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'annually'>('monthly');

  const getPlanKey = (): keyof typeof plans => {
    const professionalCategories = ['Salud y Bienestar', 'Educación', 'Automotriz y Repuestos', 'Alimentos y Restaurantes'];
    
    if (checkIfShouldBeEnterprise(currentUser.id)) {
      return 'company';
    }
    
    if (currentUser.type === 'client') {
      return 'personal';
    }

    if (currentUser.type === 'provider') {
      const completedJobs = transactions.filter(
        tx => tx.providerId === currentUser.id && (tx.status === 'Pagado' || tx.status === 'Resuelto')
      ).length;
      
      const primaryCategory = currentUser.profileSetupData?.primaryCategory || '';
      const offerType = currentUser.profileSetupData?.offerType;

      if (
        offerType === 'product' ||
        professionalCategories.includes(primaryCategory) ||
        completedJobs > 15
      ) {
        return 'professional';
      }
    }
    return 'personal';
  }

  const currentPlanKey = getPlanKey();
  const currentPlan = plans[currentPlanKey];

  const handleSubscribe = () => {
    const amount = paymentCycle === 'monthly' ? currentPlan.price : currentPlan.annualPrice;
    subscribeUser(currentUser.id, `Plan ${currentPlan.title} (${paymentCycle === 'monthly' ? 'Monthly' : 'Annual'})`, amount);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-yellow-500" />
            {currentPlan.title}
          </DialogTitle>
          <DialogDescription>
            {currentPlan.description}
          </DialogDescription>
        </DialogHeader>

        {currentUser.isSubscribed ? (
           <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 !text-green-800" />
                <AlertTitle>You are already subscribed!</AlertTitle>
                <AlertDescription>
                 You enjoy all the benefits of your current plan.
                </AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-4 py-4">
                <ul className="space-y-2 list-inside text-sm text-muted-foreground">
                    {currentPlan.features.map(feature => (
                       <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0"/> 
                        <span>{feature}</span>
                    </li>
                    ))}
                </ul>
                <div className="pt-2">
                    <RadioGroup value={paymentCycle} onValueChange={(value: 'monthly' | 'annually') => setPaymentCycle(value)}>
                      <div className={cn("flex items-center space-x-2 rounded-lg p-3 border-2 transition-all", paymentCycle === 'monthly' ? 'border-primary bg-primary/5' : 'border-border')}>
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly" className="flex-grow cursor-pointer">
                              <p className="font-bold text-base">{`$${currentPlan.price}`}<span className="font-normal text-sm"> / month</span></p>
                          </Label>
                      </div>
                      <div className={cn("flex items-center space-x-2 rounded-lg p-3 border-2 transition-all", paymentCycle === 'annually' ? 'border-primary bg-primary/5' : 'border-border')}>
                          <RadioGroupItem value="annually" id="annually" />
                          <Label htmlFor="annually" className="flex-grow cursor-pointer">
                             <p className="font-bold text-base">{`$${currentPlan.annualPrice}`}<span className="font-normal text-sm"> / year</span></p>
                             <p className="font-semibold text-green-600 text-xs">{currentPlan.annualDiscount}</p>
                          </Label>
                      </div>
                    </RadioGroup>
                </div>
            </div>
        )}
        
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Invest in your peace of mind!</AlertTitle>
            <AlertDescription>
                At CorabO, we always recommend transacting with verified users. The blue 'Verified' badge is your confirmation that this user has completed a rigorous validation process, providing an additional layer of security and trust in all your interactions.
            </AlertDescription>
        </Alert>

        <DialogFooter className="mt-auto pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {currentUser.isSubscribed ? 'Close' : 'Cancel'}
          </Button>
          {!currentUser.isSubscribed && (
            <Button onClick={handleSubscribe}>
                <Check className="mr-2 h-4 w-4" />
                Subscribe Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
