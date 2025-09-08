import { Libro } from "./Libro";
import { Prestamo } from "./Prestamo";

/** Duracion en dias de un prestamo */
type Duracion = number;

export abstract class Socio {
  protected prestamos: Prestamo[] = [];

  constructor(
    private _id: number,
    private _nombre: string,
    private _apellido: string
  ) {}

  get id() {
    return this._id;
  }

  get nombre() {
    return this._nombre;
  }

  get apellido() {
    return this._apellido;
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }

  abstract getDuracionPrestamo(): Duracion;
  abstract getMaximoLibros(): number;

  agregarPrestamo(prestamo: Prestamo): void {
    this.prestamos.push(prestamo);
  }

  removerPrestamo(prestamo: Prestamo): void {
    const indice = this.prestamos.indexOf(prestamo);
    if (indice > -1) {
      this.prestamos.splice(indice, 1);
    }
  }

  tienePrestadoLibro(libro: Libro): Prestamo | null {
    return this.prestamos.find((p) => p.libro === libro) ?? null;
  }

  get librosEnPrestamo() {
    return this.prestamos.length;
  }

  puedeRetirar(libro: Libro): boolean {
    return this.prestamos.length < this.getMaximoLibros();
  }

  tieneLibrosVencidos(): boolean {
    return this.prestamos.some(prestamo => prestamo.estaVencido());
  }

  getLibrosVencidos(): Prestamo[] {
    return this.prestamos.filter(prestamo => prestamo.estaVencido());
  }

  getMultaTotal(): number {
    return this.prestamos.reduce((total, prestamo) => total + prestamo.calcularMulta(), 0);
  }

  getPrestamos(): Prestamo[] {
    return [...this.prestamos]; // Retorna una copia
  }
}

export class SocioRegular extends Socio {
  getDuracionPrestamo(): Duracion {
    return 14;
  }

  getMaximoLibros(): number {
    return 3;
  }
}

export class SocioVIP extends Socio {
  getDuracionPrestamo(): Duracion {
    return 21;
  }

  getMaximoLibros(): number {
    return 5;
  }

  // Los VIP no tienen multas
  getMultaTotal(): number {
    return 0;
  }
}

export class Empleado extends Socio {
  getDuracionPrestamo(): Duracion {
    return 30;
  }

  getMaximoLibros(): number {
    return Infinity;
  }

  // Los empleados pueden acceder a libros de referencia
  puedeAccederReferencia(): boolean {
    return true;
  }
}

export class Visitante extends Socio {
  puedeRetirar(libro: Libro): boolean {
    return false; // Solo puede consultar catálogo
  }

  getDuracionPrestamo(): Duracion {
    return 0;
  }

  getMaximoLibros(): number {
    return 0;
  }

  // Los visitantes pueden consultar catálogos pero no retirar
  puedeConsultarCatalogo(): boolean {
    return true;
  }
}

export enum TipoSocio {
  REGULAR = "regular",
  VIP = "vip",
  EMPLEADO = "empleado",
  VISITANTE = "visitante",
}

export class SocioFactory {
  static crearSocio(
    tipo: TipoSocio,
    id: number,
    nombre: string,
    apellido: string
  ): Socio {
    switch (tipo) {
      case TipoSocio.REGULAR:
        return new SocioRegular(id, nombre, apellido);
      case TipoSocio.VIP:
        return new SocioVIP(id, nombre, apellido);
      case TipoSocio.EMPLEADO:
        return new Empleado(id, nombre, apellido);
      case TipoSocio.VISITANTE:
        return new Visitante(id, nombre, apellido);
      default:
        throw new Error("Tipo de socio no valido");
    }
  }
}