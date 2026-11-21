/** Respuesta paginada del backend (`Pagina[T]`): una página de filas y el total que cumple el filtro. */
export interface Pagina<T> {
  items: T[];
  total: number;
}
