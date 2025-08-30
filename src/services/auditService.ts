import { supabase } from "@/integrations/supabase/client";

export interface SecurityEvent {
  event_type: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditService {
  static async logSecurityEvent(
    userId: string,
    organizationId: string,
    event: SecurityEvent
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          event_type: event.event_type,
          event_data: event.event_data,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      // Fail silently to prevent breaking main functionality
      console.error('Audit logging error:', error);
    }
  }

  static async getAuditLogs(organizationId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }
}