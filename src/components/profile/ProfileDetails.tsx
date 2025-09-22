
'use client';

import { Button } from '@/components/ui/button';
import { EditableAvatar } from '@/components/EditableAvatar';
import { ProfileStats } from '@/components/ProfileStats';
import { useAuth } from '@/hooks/use-auth-provider';
import type { User } from '@/lib/types';
import { Building, CheckCircle, Edit, MapPin, MoreHorizontal, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';

interface ProfileDetailsProps {
  provider: User;
  isSelfProfile: boolean;
  onContact: () => void;
}

const DetailBadge = ({ value }: { value: string }) => (
    <Badge variant="secondary" className="font-normal">{value}</Badge>
);

export function ProfileDetails({ provider, isSelfProfile, onContact }: ProfileDetailsProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const displayName = provider.profileSetupData?.useUsername && provider.profileSetupData.username 
    ? provider.profileSetupData.username 
    : provider.name;
  
  const specialty = provider.profileSetupData?.specialty || "Sin especialidad definida";
  const isCompany = provider.profileSetupData?.providerType === 'company';

  const allSpecializedSkills = [
      ...(provider.profileSetupData?.specializedData?.mainTrades || []), 
      ...(provider.profileSetupData?.specializedData?.mainServices || []),
      ...(provider.profileSetupData?.specializedData?.beautyTrades || []), 
      ...(provider.profileSetupData?.specializedData?.specialties || []),
      ...(provider.profileSetupData?.specializedData?.specificSkills || []), 
      ...(provider.profileSetupData?.specializedData?.keySkills || []),
  ];

  const handleEditProfile = () => {
    const setupPath = isCompany ? '/profile-setup/company' : '/profile-setup/personal';
    router.push(setupPath);
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-4 px-4 pb-3 border-b">
        <div className="flex items-center space-x-4">
          {isSelfProfile && currentUser ? (
             <EditableAvatar user={{ id: currentUser.id, name: currentUser.name, profileImage: currentUser.profileImage }} />
          ) : (
            <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage src={provider.profileImage} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
         
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground truncate">{displayName}</h1>
              {provider.isSubscribed && <CheckCircle className="w-5 h-5 text-blue-500" />}
              {isCompany && <Building className="w-4 h-4 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">{specialty}</p>
            <ProfileStats user={provider} isSelf={isSelfProfile} />
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {isSelfProfile ? (
              <Button variant="outline" size="sm" onClick={handleEditProfile}>
                <Settings className="w-4 h-4 mr-2"/>
                Ajustes
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={onContact}>
                Contactar
              </Button>
            )}
            <div className="flex items-center gap-2">
                <MapPin className={cn("h-5 w-5", provider.isGpsActive ? "text-green-500" : "text-muted-foreground")} />
            </div>
          </div>
        </div>
        
        {allSpecializedSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3">
                {allSpecializedSkills.slice(0, 3).map(skill => <DetailBadge key={skill} value={skill}/>)}
                {allSpecializedSkills.length > 3 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-1 text-xs p-1 h-auto text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                            <div className="space-y-2 text-sm">
                                <h4 className="font-bold mb-2">Todas las Habilidades</h4>
                                <div className="flex flex-wrap gap-1">{allSpecializedSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        )}
    </div>
  );
}
