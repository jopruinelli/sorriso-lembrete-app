
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Settings, LogOut, User } from 'lucide-react';
import { UserProfile } from '@/types/organization';

interface UserAvatarProps {
  userProfile: UserProfile | null;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userProfile,
  onSettingsClick,
  onSignOut
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-dental-primary text-white">
          {userProfile?.name ? getInitials(userProfile.name) : <User className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
          <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'} className="w-fit">
            {userProfile?.role === 'admin' ? 'Admin' : 'Usuário'}
          </Badge>
        </div>
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
