import { Region } from "./Region.interface";

export interface Departamento {
    id: number;
    nombre: string;
    region?: Region;
}