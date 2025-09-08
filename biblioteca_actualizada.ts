import { Libro } from "./Libro";
import { Socio, SocioFactory, TipoSocio } from "./Socio";
import { Prestamo, PrestamoFactory, TipoPrestamo } from "./Prestamo";
import { IPoliticaPrestamo, PoliticaFactory, TipoPolitica } from "./PoliticasPrestamo";
import { 
  BuscadorUniversal, 
  CatalogoBiblioteca, 
  BibliotecaDigital, 
  ArchivoHistorico, 
  BaseConocimiento,
  RecursoDigital,
  DocumentoHistorico,
  ArticuloAcademico,
  ResultadoBusqueda
} from "./SistemasBusqueda";

export class Biblioteca {
  private inventario: Libro[] = [];
  private socios: Socio[] = [];
  private prestamosActivos: Prestamo[] = [];
  private politicaActual: IPoliticaPrestamo;
  private buscadorUniversal: BuscadorUniversal;

  // Sistemas de búsqueda
  private catalogoBiblioteca: CatalogoBiblioteca;
  private bibliotecaDigital: BibliotecaDigital;
  private archivoHistorico: ArchivoHistorico;
  private baseConocimiento: BaseConocimiento;

  constructor() {
    // Inicializar con política por defecto
    this.politicaActual = PoliticaFactory.crearPolitica(TipoPolitica.FLEXIBLE);
    
    // Inicializar sistemas de búsqueda
    this.catalogoBiblioteca = new CatalogoBiblioteca(this.inventario);
    this.bibliotecaDigital = new BibliotecaDigital([]);
    this.archivoHistorico = new ArchivoHistorico([]);
    this.baseConocimiento = new BaseConocimiento([]);
    
    // Configurar buscador universal
    this.buscadorUniversal = new BuscadorUniversal();
    this.configurarSistemasBusqueda();
  }

  private configurarSistemasBusqueda(): void {
    this.buscadorUniversal.agregarSistema("Catálogo Biblioteca", this.catalogoBiblioteca);
    this.buscadorUniversal.agregarSistema("Biblioteca Digital", this.bibliotecaDigital);
    this.buscadorUniversal.agregarSistema("Archivo Histórico", this.archivoHistorico);
    this.buscadorUniversal.agregarSistema("Base de Conocimiento", this.baseConocimiento);
  }

  // ===== GESTIÓN DE POLÍTICAS =====
  cambiarPolitica(tipoPolitica: TipoPolitica): void {
    this.politicaActual = PoliticaFactory.crearPolitica(tipoPolitica);
  }

  obtenerPoliticaActual(): IPoliticaPrestamo {
    return this.politicaActual;
  }

  // ===== GESTIÓN DE LIBROS =====
  agregarLibro(titulo: string, autor: string, isbn: string): Libro {
    const libroCreado = new Libro(titulo, autor, isbn);
    this.inventario.push(libroCreado);
    // Actualizar catálogo de búsqueda
    this.catalogoBiblioteca = new CatalogoBiblioteca(this.inventario);
    this.buscadorUniversal.agregarSistema("Catálogo Biblioteca", this.catalogoBiblioteca);
    return libroCreado;
  }

  buscarLibro(isbn: string): Libro | null {
    return this.inventario.find(libro => libro.isbn === isbn) ?? null;
  }

  // ===== GESTIÓN DE SOCIOS =====
  registrarSocio(tipo: TipoSocio, id: number, nombre: string, apellido: string): Socio {
    const socioCreado = SocioFactory.crearSocio(tipo, id, nombre, apellido);
    this.socios.push(socioCreado);
    return socioCreado;
  }

  buscarSocio(id: number): Socio | null {
    return this.socios.find(socio => socio.id === id) ?? null;
  }

  // ===== GESTIÓN DE PRÉSTAMOS =====
  crearPrestamo(socioId: number, libroISBN: string, tipoPrestamo: TipoPrestamo): void {
    const socio = this.buscarSocio(socioId);
    const libro = this.buscarLibro(libroISBN);

    if (!socio || !libro) {
      throw new Error("Socio o libro no encontrado");
    }

    // Verificar disponibilidad del libro
    if (this.estaLibroPrestado(libro)) {
      throw new Error("Libro no está disponible");
    }

    // Verificar permisos según la política actual
    if (!this.politicaActual.puedeRetirar(socio, libro)) {
      throw new Error("No se puede realizar el préstamo según la política actual");
    }

    // Crear el préstamo
    const prestamo = PrestamoFactory.crearPrestamo(tipoPrestamo, libro, socioId);
    
    // Para préstamos de referencia, verificar que no se intente retirar
    if (tipoPrestamo === TipoPrestamo.REFERENCIA && prestamo instanceof import("./Prestamo").PrestamoReferencia) {
      if (!prestamo.puedeRetirar()) {
        throw new Error("Los libros de referencia solo pueden consultarse en biblioteca");
      }
    }

    // Agregar a las listas
    this.prestamosActivos.push(prestamo);
    socio.agregarPrestamo(prestamo);
  }

  devolverLibro(socioId: number, libroISBN: string): void {
    const socio = this.buscarSocio(socioId);
    const libro = this.buscarLibro(libroISBN);

    if (!socio || !libro) {
      throw new Error("Socio o libro no encontrado");
    }

    const prestamo = socio.tienePrestadoLibro(libro);
    if (!prestamo) {
      throw new Error("El socio no tiene este libro prestado");
    }

    // Calcular multa si corresponde
    const multa = prestamo.calcularMulta();
    if (multa > 0) {
      console.log(`Multa generada: $${multa}`);
    }

    // Remover de las listas
    socio.removerPrestamo(prestamo);
    const indicePrestamo = this.prestamosActivos.indexOf(prestamo);
    if (indicePrestamo > -1) {
      this.prestamosActivos.splice(indicePrestamo, 1);
    }
  }

  renovarPrestamo(socioId: number, libroISBN: string): void {
    const socio = this.buscarSocio(socioId);
    const libro = this.buscarLibro(libroISBN);

    if (!socio || !libro) {
      throw new Error("Socio o libro no encontrado");
    }

    const prestamo = socio.tienePrestadoLibro(libro);
    if (!prestamo) {
      throw new Error("El socio no tiene este libro prestado");
    }

    // Verificar si la política permite renovación
    if (!this.politicaActual.permiteRenovacion(socio, prestamo)) {
      throw new Error("No se puede renovar el préstamo según la política actual");
    }

    // Crear nuevo vencimiento (renovar)
    const nuevaDuracion = this.politicaActual.calcularDuracion(socio, socio.getDuracionPrestamo());
    const nuevoVencimiento = new Date();
    nuevoVencimiento.setDate(nuevoVencimiento.getDate() + nuevaDuracion);
    
    // En una implementación real, actualizaríamos el préstamo existente
    console.log(`Préstamo renovado hasta: ${nuevoVencimiento.toDateString()}`);
  }

  // ===== UTILIDADES DE PRÉSTAMOS =====
  private estaLibroPrestado(libro: Libro): boolean {
    return this.prestamosActivos.some(prestamo => prestamo.libro === libro);
  }

  obtenerPrestamosVencidos(): Prestamo[] {
    return this.prestamosActivos.filter(prestamo => prestamo.estaVencido());
  }

  obtenerPrestamosPorSocio(socioId: number): Prestamo[] {
    return this.prestamosActivos.filter(prestamo => prestamo.socioId === socioId);
  }

  // ===== SISTEMAS DE BÚSQUEDA =====
  buscarEnTodosLosSistemas(criterio: string): ResultadoBusqueda[] {
    return this.buscadorUniversal.buscarEnTodos(criterio);
  }

  buscarEnSistemaEspecifico(sistema: string, criterio: string): any[] {
    return this.buscadorUniversal.buscarEnSistema(sistema, criterio);
  }

  // ===== GESTIÓN DE RECURSOS DIGITALES =====
  agregarRecursoDigital(titulo: string, url: string, tipo: 'pdf' | 'video' | 'audio' | 'articulo'): void {
    const recurso = new RecursoDigital(titulo, url, tipo, new Date());
    // En una implementación real, esto se haría a través de un método del sistema
    (this.bibliotecaDigital as any).recursos.push(recurso);
  }

  // ===== GESTIÓN DE DOCUMENTOS HISTÓRICOS =====
  agregarDocumentoHistorico(
    titulo: string, 
    fechaCreacion: Date, 
    autor: string, 
    categoria: string, 
    estado: 'bueno' | 'regular' | 'deteriorado'
  ): void {
    const documento = new DocumentoHistorico(titulo, fechaCreacion, autor, categoria, estado);
    (this.archivoHistorico as any).documentos.push(documento);
  }

  // ===== GESTIÓN DE ARTÍCULOS ACADÉMICOS =====
  agregarArticuloAcademico(
    titulo: string,
    autores: string[],
    revista: string,
    año: number,
    palabrasClave: string[],
    abstract: string
  ): void {
    const articulo = new ArticuloAcademico(titulo, autores, revista, año, palabrasClave, abstract);
    (this.baseConocimiento as any).articulos.push(articulo);
  }

  // ===== REPORTES Y ESTADÍSTICAS =====
  generarReporteMultas(): { socioId: number, nombreCompleto: string, multa: number }[] {
    return this.socios
      .map(socio => ({
        socioId: socio.id,
        nombreCompleto: socio.nombreCompleto,
        multa: socio.getMultaTotal()
      }))
      .filter(reporte => reporte.multa > 0)
      .sort((a, b) => b.multa - a.multa);
  }

  generarReporteLibrosPopulares(): { libro: Libro, vecesPrestado: number }[] {
    const contadores = new Map<string, number>();
    
    this.prestamosActivos.forEach(prestamo => {
      const isbn = prestamo.libro.isbn;
      contadores.set(isbn, (contadores.get(isbn) || 0) + 1);
    });

    return Array.from(contadores.entries())
      .map(([isbn, veces]) => ({
        libro: this.buscarLibro(isbn)!,
        vecesPrestado: veces
      }))
      .sort((a, b) => b.vecesPrestado - a.vecesPrestado);
  }

  // ===== GETTERS PARA INFORMACIÓN DEL SISTEMA =====
  get totalLibros(): number {
    return this.inventario.length;
  }

  get totalSocios(): number {
    return this.socios.length;
  }

  get prestamosActuales(): number {
    return this.prestamosActivos.length;
  }

  get prestamosVencidos(): number {
    return this.obtenerPrestamosVencidos().length;
  }

  getSistemasDisponibles(): string[] {
    return this.buscadorUniversal.obtenerSistemasDisponibles();
  }
}

export const biblioteca = new Biblioteca();
export type { Biblioteca };