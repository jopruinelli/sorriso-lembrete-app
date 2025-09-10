export type CargoOption = { id: string; nome: string };
export type EspecialidadeOption = { id: string; nome: string };

// Temporário: stubs locais até termos tabelas dedicadas no banco
export async function getCargos(_query?: string): Promise<CargoOption[]> {
  return [];
}

export async function getEspecialidadesByCargoId(
  _cargoId: string,
  _query?: string
): Promise<EspecialidadeOption[]> {
  return [];
}

export async function createEspecialidadeIfMissing(
  _cargoId: string,
  nome: string
): Promise<EspecialidadeOption> {
  return { id: `${Date.now()}`, nome };
}

