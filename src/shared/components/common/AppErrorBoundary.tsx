import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Atrapa errores al dibujar cualquier parte de la app. Sin esto, un fallo en una
 * pantalla deja la aplicación en blanco.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error no controlado en la interfaz:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <ErrorFallback
          detalle={error.message}
          onReintentar={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
