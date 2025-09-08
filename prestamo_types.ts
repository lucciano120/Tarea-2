import { Libro } from "./Libro";

export abstract class Prestamo {
  protected fechaPrestamo: Date;
  protected fechaVencimiento: Date;

  constructor(public libro: Libro, public socioId: number) {
    this.fechaPrestamo = new Date();
    this.fechaVencimiento = this.calcularVencimiento();
  }

  abstract calcularVencimiento(): Date;
  abstract calcularMulta(): number;

  get vencimiento(): Date {
    return this.fechaVencimiento;
  }

  get prestamo(): Date {
    return this.fechaPrestamo;
  }

  estaVencido(): boolean {
    return new Date() > this.fechaVencimiento;
  }

  diasVencido(): number {
    if (!this.estaVencido()) return 0;
    const hoy = new Date();
    const diferencia = hoy.getTime() - this.fechaVencimiento.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}

export class PrestamoRegular extends Prestamo {
  private static readonly DURACION_DIAS = 14;
  private static readonly MULTA_POR_DIA = 50;

  calcularVencimiento(): Date {
    const vencimiento = new Date(this.fechaPrestamo);
    vencimiento.setDate(vencimiento.getDate() + PrestamoRegular.DURACION_DIAS);
    return vencimiento;
  }

  calcularMulta(): number {
    return this.diasVencido() * PrestamoRegular.MULTA_POR_DIA;
  }
}

export class PrestamoCorto extends Prestamo {
  private static readonly DURACION_DIAS = 7;
  private static readonly MULTA_POR_DIA = 100; // Multa doble

  calcularVencimiento(): Date {
    const vencimiento = new Date(this.fechaPrestamo);
    vencimiento.setDate(vencimiento.getDate() + PrestamoCorto.DURACION_DIAS);
    return vencimiento;
  }

  calcularMulta(): number {
    return this.diasVencido() * PrestamoCorto.MULTA_POR_DIA;
  }
}

export class PrestamoReferencia extends Prestamo {
  calcularVencimiento(): Date {
    // Solo consulta en biblioteca, vence el mismo día
    return new Date(this.fechaPrestamo);
  }

  calcularMulta(): number {
    // No se puede llevar, no hay multa
    return 0;
  }

  puedeRetirar(): boolean {
    return false; // Solo consulta en biblioteca
  }
}

export class PrestamoDigital extends Prestamo {
  calcularVencimiento(): Date {
    // Sin límite de tiempo - vencimiento muy lejano
    const vencimiento = new Date(this.fechaPrestamo);
    vencimiento.setFullYear(vencimiento.getFullYear() + 100);
    return vencimiento;
  }

  calcularMulta(): number {
    // Sin multa para préstamos digitales
    return 0;
  }
}

export enum TipoPrestamo {
  REGULAR = "regular",
  CORTO = "corto",
  REFERENCIA = "referencia",
  DIGITAL = "digital"
}

export class PrestamoFactory {
  static crearPrestamo(tipo: TipoPrestamo, libro: Libro, socioId: number): Prestamo {
    switch (tipo) {
      case TipoPrestamo.REGULAR:
        return new PrestamoRegular(libro, socioId);
      case TipoPrestamo.CORTO:
        return new PrestamoCorto(libro, socioId);
      case TipoPrestamo.REFERENCIA:
        return new PrestamoReferencia(libro, socioId);
      case TipoPrestamo.DIGITAL:
        return new PrestamoDigital(libro, socioId);
      default:
        throw new Error("Tipo de préstamo no válido");
    }
  }
}