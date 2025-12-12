import React from 'react';

/**
 * Landing Page principal do QA Agile Guide
 * Container que agrupa todas as seções da landing page
 */
export const LandingPage: React.FC = () => {
  // Versão mínima para debug - sem dependências
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: '#1a1a1a', 
          marginBottom: '1rem' 
        }}>
          QA Agile Guide
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#666666', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Se você está vendo esta mensagem, o componente LandingPage está funcionando corretamente!
        </p>
        <div style={{
          padding: '2rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginTop: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
            Próximos passos:
          </h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '2rem', color: '#666666' }}>
            <li>Verificar se o servidor está rodando na porta 5173</li>
            <li>Verificar o console do navegador para erros</li>
            <li>Adicionar componentes filhos gradualmente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
