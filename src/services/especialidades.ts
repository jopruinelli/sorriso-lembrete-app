export type CargoOption = { id: string; nome: string };
export type EspecialidadeOption = { id: string; nome: string };

import { supabase } from '@/integrations/supabase/client';

export async function getCargos(query?: string): Promise<CargoOption[]> {
  let req = supabase.from('cargos').select('id, nome').order('nome', { ascending: true });
  if (query) {
    req = req.ilike('nome', `%${query}%`);
  }
  const { data, error } = await req;
  if (error) throw error;
  return data ?? [];
}

export async function getEspecialidadesByCargoId(
  cargoId: string,
  query?: string
): Promise<EspecialidadeOption[]> {
  let req = supabase
    .from('especialidades')
    .select('id, nome')
    .eq('cargo_id', cargoId)
    .order('nome', { ascending: true });
  if (query) {
    req = req.ilike('nome', `%${query}%`);
  }
  const { data, error } = await req;
  if (error) throw error;
  return data ?? [];
}

export async function createEspecialidadeIfMissing(
  cargoId: string,
  nome: string
): Promise<EspecialidadeOption> {
  const { data, error } = await supabase
    .from('especialidades')
    .insert({ cargo_id: cargoId, nome })
    .select('id, nome')
    .single();
  if (error) throw error;
  return data as EspecialidadeOption;
}

