import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado sempre (não só em dev)
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    // Log no console sempre para diagnóstico
    console.error('ErrorBoundary capturou um erro:', errorDetails);

    // Log estruturado usando logger
    logger.error('ErrorBoundary capturou um erro', 'ErrorBoundary', errorDetails);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleCopyError = () => {
    if (!this.state.error) return;

    const errorText = `
Erro: ${this.state.error.name}
Mensagem: ${this.state.error.message}
Stack: ${this.state.error.stack || 'N/A'}
${this.state.errorInfo ? `Component Stack: ${this.state.errorInfo.componentStack}` : ''}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Detalhes do erro copiados para a área de transferência!');
    }).catch(() => {
      // Fallback: criar elemento temporário
      const textarea = document.createElement('textarea');
      textarea.value = errorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Detalhes do erro copiados para a área de transferência!');
    });
  };

  getErrorType = (error: Error | null): string => {
    if (!error) return 'Desconhecido';
    
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
      return 'Erro de Rede';
    }
    if (message.includes('supabase') || message.includes('database')) {
      return 'Erro de Banco de Dados';
    }
    if (message.includes('timeout')) {
      return 'Timeout';
    }
    if (name.includes('typeerror')) {
      return 'Erro de Tipo';
    }
    if (name.includes('referenceerror')) {
      return 'Erro de Referência';
    }
    
    return 'Erro de Aplicação';
  };

  getErrorSuggestion = (error: Error | null): string => {
    if (!error) return '';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
      return 'Verifique sua conexão com a internet e tente novamente.';
    }
    if (message.includes('supabase') || message.includes('database')) {
      return 'Pode haver um problema com o banco de dados. Os dados locais ainda estão disponíveis.';
    }
    if (message.includes('timeout')) {
      return 'A operação demorou muito. Tente novamente.';
    }
    
    return 'Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const errorSuggestion = this.getErrorSuggestion(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-sm text-base-content/60 mb-4">
                {errorType}
              </p>
              <p className="text-text-secondary mb-6">
                {errorSuggestion || 'Ocorreu um erro inesperado. Por favor, tente recarregar a página.'}
              </p>
              
              {this.state.error && (
                <details className="text-left mb-6 bg-base-200 dark:bg-base-300 p-4 rounded-md">
                  <summary className="cursor-pointer text-text-primary font-semibold mb-2 flex items-center gap-2">
                    <span>Detalhes do erro</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        this.handleCopyError();
                      }}
                      className="btn btn-xs btn-ghost"
                      title="Copiar detalhes do erro"
                    >
                      📋 Copiar
                    </button>
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong className="text-text-primary">Tipo:</strong>
                      <span className="ml-2 text-text-secondary">{this.state.error.name}</span>
                    </div>
                    <div>
                      <strong className="text-text-primary">Mensagem:</strong>
                      <p className="ml-2 text-text-secondary text-sm break-words">{this.state.error.message}</p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong className="text-text-primary">Stack:</strong>
                        <pre className="mt-1 text-xs text-text-secondary overflow-auto max-h-40 bg-base-100 p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-text-primary">Component Stack:</strong>
                        <pre className="mt-1 text-xs text-text-secondary overflow-auto max-h-40 bg-base-100 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="btn btn-primary"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary"
                >
                  Recarregar Página
                </button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

