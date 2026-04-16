export interface CargoHoras {
  id?: number;
  tipo: 'comunes' | 'investigacion' | 'mision_especial_primaria' | 'mision_especial' | 'mision_especial_secundaria' | 'regimen_27' | 'regimen_5';
  cantidadHoras: number;
}