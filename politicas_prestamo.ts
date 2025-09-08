import { Socio } from "./Socio";
import { Libro } from "./Libro";
import { Prestamo } from "./Prestamo";

export interface IPoliticaPrestamo {
  puedeRetirar(socio: Socio, libro: Libro): boolean;
  calcularDuracion(socio: Socio, duracionBase: number): number;
  permiteRenovacion(socio: Socio, prestamo: Prestamo): boolean;
}

export class PoliticaEstricta implements IPoliticaPrestamo {
  puedeRetirar(socio: Socio, libro: Libro): boolean {
    // No permite préstamos si hay libros vencidos
    return !socio.tieneLibrosVencidos();
  }

  calcularDuracion(socio: Socio, duracionBase: number): number {
    return duracionBase;
  }

  permiteRenovacion(socio: Socio, prestamo: Prestamo): boolean {
    return !socio.tieneLibrosVencidos() && !prestamo.estaVencido();
  }
}

export class PoliticaFlexible implements IPoliticaPrestamo {
  puedeRetirar(socio: Socio, libro: Libro): boolean {
    // Siempre permite préstamos
    return true;
  }

  calcularDuracion(socio: Socio, duracionBase: number): number {
    // Si tiene libros vencidos, reduce el período a la mitad
    if (socio.tieneLibrosVencidos()) {
      return Math.floor(duracionBase / 2);
    }
    return duracionBase;
  }

  permiteRenovacion(socio: Socio, prestamo: Prestamo): boolean {
    // Permite renovación si no está muy vencido (más de 7 días)
    return prestamo.diasVencido() <= 7;
  }
}

export class PoliticaEstudiante implements IPoliticaPrestamo {
  private static readonly MESES_EXAMENES = [5, 6, 11, 12]; // Junio, Julio, Diciembre, Enero

  puedeRetirar(socio: Socio, libro: Libro): boolean {
    return true;
  }

  calcularDuracion(socio: Socio, duracionBase: number): number {
    const mesActual = new Date().getMonth();
    
    // Período extendido durante épocas de exámenes
    if (PoliticaEstudiante.MESES_EXAMENES.includes(mesActual)) {
      return duracionBase * 2;
    }
    return duracionBase;
  }

  permiteRenovacion(socio: Socio, prestamo: Prestamo): boolean {
    const mesActual = new Date().getMonth();
    
    // Renovaciones más flexibles durante exámenes
    if (PoliticaEstudiante.MESES_EXAMENES.includes(mesActual)) {
      return true;
    }
    return !prestamo.estaVencido();
  }
}

export class PoliticaDocente implements IPoliticaPrestamo {
  private static readonly DURACION_EXTENDIDA = 60; // 2 meses
  private static readonly MAX_RENOVACIONES = 5;

  puedeRetirar(socio: Socio, libro: Libro): boolean {
    return true;
  }

  calcularDuracion(socio: Socio, duracionBase: number): number {
    // Préstamos de larga duración para docentes
    return PoliticaDocente.DURACION_EXTENDIDA;
  }

  permiteRenovacion(socio: Socio, prestamo: Prestamo): boolean {
    // Múltiples renovaciones permitidas
    const renovacionesActuales = this.contarRenovaciones(prestamo);
    return renovacionesActuales < PoliticaDocente.MAX_RENOVACIONES;
  }

  private contarRenovaciones(prestamo: Prestamo): number {
    // En una implementación real, esto se tracking en la base de datos
    // Por simplicidad, retornamos 0
    return 0;
  }
}

export enum TipoPolitica {
  ESTRICTA = "estricta",
  FLEXIBLE = "flexible",
  ESTUDIANTE = "estudiante",
  DOCENTE = "docente"
}

export class PoliticaFactory {
  static crearPolitica(tipo: TipoPolitica): IPoliticaPrestamo {
    switch (tipo) {
      case TipoPolitica.ESTRICTA:
        return new PoliticaEstricta();
      case TipoPolitica.FLEXIBLE:
        return new PoliticaFlexible();
      case TipoPolitica.ESTUDIANTE:
        return new PoliticaEstudiante();
      case TipoPolitica.DOCENTE:
        return new PoliticaDocente();
      default:
        throw new Error("Tipo de política no válido");
    }
  }
}