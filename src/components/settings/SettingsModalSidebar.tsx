import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, MessageSquare, FileSpreadsheet, Trash2, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SettingsModalSidebarProps {
  isAdmin: boolean;
}

export const SettingsModalSidebar: React.FC<SettingsModalSidebarProps> = ({ isAdmin }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile 
        ? 'w-full border-b pb-2 mb-4' 
        : 'flex flex-col w-16 hover:w-48 transition-all duration-300 ease-in-out border-r bg-muted/30 group'
      }
      flex-shrink-0
    `}>
      <TabsList className={`
        ${isMobile 
          ? 'grid grid-cols-5 w-full h-auto bg-muted/50 p-1 gap-1' 
          : 'flex flex-col h-full w-full bg-transparent p-1 gap-1'
        }
      `}>
        <TabsTrigger 
          value="organization" 
          className={`
            ${isMobile 
              ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
              : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
            }
          `}
          title="Organização"
        >
          <Building2 className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
          {isMobile ? (
            <span className="text-xs leading-tight">Org</span>
          ) : (
            <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Organização
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="profile" 
          className={`
            ${isMobile 
              ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
              : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
            }
          `}
          title="Perfil"
        >
          <User className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
          {isMobile ? (
            <span className="text-xs leading-tight">Perfil</span>
          ) : (
            <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Perfil
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="whatsapp" 
          className={`
            ${isMobile 
              ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
              : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
            }
          `}
          title="WhatsApp"
        >
          <MessageSquare className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
          {isMobile ? (
            <span className="text-xs leading-tight">Zap</span>
          ) : (
            <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              WhatsApp
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="import" 
          className={`
            ${isMobile 
              ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
              : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
            }
          `}
          title="Importar"
        >
          <FileSpreadsheet className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
          {isMobile ? (
            <span className="text-xs leading-tight">Import</span>
          ) : (
            <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Importar
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger 
          value="removal" 
          className={`
            ${isMobile 
              ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
              : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
            }
          `}
          title="Remover"
        >
          <Trash2 className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
          {isMobile ? (
            <span className="text-xs leading-tight">Remove</span>
          ) : (
            <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Remover
            </span>
          )}
        </TabsTrigger>
        
        {isAdmin && (
          <TabsTrigger 
            value="users" 
            className={`
              ${isMobile 
                ? 'flex flex-col items-center justify-center p-2 h-16 text-xs' 
                : 'flex items-center justify-start p-3 h-12 w-full overflow-hidden hover:bg-accent/50 data-[state=active]:bg-accent'
              }
            `}
            title="Usuários"
          >
            <Users className={isMobile ? "w-4 h-4 mb-1" : "w-5 h-5 flex-shrink-0"} />
            {isMobile ? (
              <span className="text-xs leading-tight">Users</span>
            ) : (
              <span className="ml-3 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Usuários
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>
    </div>
  );
};