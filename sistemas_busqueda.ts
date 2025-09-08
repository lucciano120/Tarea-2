import { Libro } from "./Libro";

export interface IBuscable {
  buscarPor(criterio: string): any[];
  filtrar(condicion: (item: any) => boolean): any[];
}

export interface ResultadoBusqueda {
  tipo: string;
  resultado: any;
  fuente: string;
}

// Implementaciones concretas
export class CatalogoBiblioteca implements IBuscable {
  constructor(private libros: Libro[]) {}

  buscarPor(criterio: string): Libro[] {
    const criterioLower = criterio.toLowerCase();
    return this.libros.filter(libro =>
      libro.titulo.toLowerCase().includes(criterioLower) ||
      libro.autor.toLowerCase().includes(criterioLower) ||
      libro.isbn.includes(criterio)
    );
  }

  filtrar(condicion: (libro: Libro) => boolean): Libro[] {
    return this.libros.filter(condicion);
  }

  buscarPorAutor(autor: string): Libro[] {
    return this.libros.filter(libro => 
      libro.autor.toLowerCase().includes(autor.toLowerCase())
    );
  }

  buscarPorISBN(isbn: string): Libro | null {
    return this.libros.find(libro => libro.isbn === isbn) || null;
  }
}

export class RecursoDigital {
  constructor(
    public titulo: string,
    public url: string,
    public tipo: 'pdf' | 'video' | 'audio' | 'articulo',
    public fechaPublicacion: Date
  ) {}
}

export class BibliotecaDigital implements IBuscable {
  constructor(private recursos: RecursoDigital[]) {}

  buscarPor(criterio: string): RecursoDigital[] {
    const criterioLower = criterio.toLowerCase();
    return this.recursos.filter(recurso =>
      recurso.titulo.toLowerCase().includes(criterioLower) ||
      recurso.url.toLowerCase().includes(criterioLower)
    );
  }

  filtrar(condicion: (recurso: RecursoDigital) => boolean): RecursoDigital[] {
    return this.recursos.filter(condicion);
  }

  buscarPorTipo(tipo: string): RecursoDigital[] {
    return this.recursos.filter(recurso => recurso.tipo === tipo);
  }
}

export class DocumentoHistorico {
  constructor(
    public titulo: string,
    public fechaCreacion: Date,
    public autor: string,
    public categoria: string,
    public estado: 'bueno' | 'regular' | 'deteriorado'
  ) {}
}

export class ArchivoHistorico implements IBuscable {
  constructor(private documentos: DocumentoHistorico[]) {}

  buscarPor(criterio: string): DocumentoHistorico[] {
    const criterioLower = criterio.toLowerCase();
    return this.documentos.filter(doc =>
      doc.titulo.toLowerCase().includes(criterioLower) ||
      doc.autor.toLowerCase().includes(criterioLower) ||
      doc.categoria.toLowerCase().includes(criterioLower)
    );
  }

  filtrar(condicion: (doc: DocumentoHistorico) => boolean): DocumentoHistorico[] {
    return this.documentos.filter(condicion);
  }

  buscarPorPeriodo(fechaInicio: Date, fechaFin: Date): DocumentoHistorico[] {
    return this.documentos.filter(doc =>
      doc.fechaCreacion >= fechaInicio && doc.fechaCreacion <= fechaFin
    );
  }
}

export class ArticuloAcademico {
  constructor(
    public titulo: string,
    public autores: string[],
    public revista: string,
    public año: number,
    public palabrasClave: string[],
    public abstract: string
  ) {}
}

export class BaseConocimiento implements IBuscable {
  constructor(private articulos: ArticuloAcademico[]) {}

  buscarPor(criterio: string): ArticuloAcademico[] {
    const criterioLower = criterio.toLowerCase();
    return this.articulos.filter(articulo =>
      articulo.titulo.toLowerCase().includes(criterioLower) ||
      articulo.autores.some(autor => autor.toLowerCase().includes(criterioLower)) ||
      articulo.revista.toLowerCase().includes(criterioLower) ||
      articulo.palabrasClave.some(palabra => palabra.toLowerCase().includes(criterioLower)) ||
      articulo.abstract.toLowerCase().includes(criterioLower)
    );
  }

  filtrar(condicion: (articulo: ArticuloAcademico) => boolean): ArticuloAcademico[] {
    return this.articulos.filter(condicion);
  }

  buscarPorPalabrasClave(palabras: string[]): ArticuloAcademico[] {
    return this.articulos.filter(articulo =>
      palabras.some(palabra =>
        articulo.palabrasClave.some(pc =>
          pc.toLowerCase().includes(palabra.toLowerCase())
        )
      )
    );
  }
}

export class BuscadorUniversal {
  private sistemas: Map<string, IBuscable> = new Map();

  agregarSistema(nombre: string, sistema: IBuscable): void {
    this.sistemas.set(nombre, sistema);
  }

  eliminarSistema(nombre: string): void {
    this.sistemas.delete(nombre);
  }

  buscarEnTodos(criterio: string): ResultadoBusqueda[] {
    const resultados: ResultadoBusqueda[] = [];

    for (const [nombre, sistema] of this.sistemas) {
      try {
        const resultadosSistema = sistema.buscarPor(criterio);
        resultadosSistema.forEach(resultado => {
          resultados.push({
            tipo: this.obtenerTipoResultado(resultado),
            resultado: resultado,
            fuente: nombre
          });
        });
      } catch (error) {
        console.warn(`Error buscando en ${nombre}:`, error);
      }
    }

    return resultados;
  }

  buscarEnSistema(nombreSistema: string, criterio: string): any[] {
    const sistema = this.sistemas.get(nombreSistema);
    if (!sistema) {
      throw new Error(`Sistema ${nombreSistema} no encontrado`);
    }

    return sistema.buscarPor(criterio);
  }

  filtrarEnTodos(condicion: (item: any) => boolean): ResultadoBusqueda[] {
    const resultados: ResultadoBusqueda[] = [];

    for (const [nombre, sistema] of this.sistemas) {
      try {
        const resultadosSistema = sistema.filtrar(condicion);
        resultadosSistema.forEach(resultado => {
          resultados.push({
            tipo: this.obtenerTipoResultado(resultado),
            resultado: resultado,
            fuente: nombre
          });
        });
      } catch (error) {
        console.warn(`Error filtrando en ${nombre}:`, error);
      }
    }

    return resultados;
  }

  private obtenerTipoResultado(resultado: any): string {
    if (resultado instanceof Libro) return 'Libro';
    if (resultado instanceof RecursoDigital) return 'Recurso Digital';
    if (resultado instanceof DocumentoHistorico) return 'Documento Histórico';
    if (resultado instanceof ArticuloAcademico) return 'Artículo Académico';
    return 'Desconocido';
  }

  obtenerSistemasDisponibles(): string[] {
    return Array.from(this.sistemas.keys());
  }
}