import React from 'react';
import { Card } from '../common/Card';

export const PhaseLogicGuideCard: React.FC = () => {
  const phaseLogicData = [
    {
      phase: 'Request',
      exit: 'Uma tarefa ou documento é criado.',
      indicators: 'Nº de tarefas, Nº de documentos',
    },
    {
      phase: 'Analysis',
      exit: 'Pelo menos um cenário BDD é criado.',
      indicators: 'Nº de cenários BDD',
    },
    {
      phase: 'Design',
      exit: 'Pelo menos um caso de teste é gerado.',
      indicators: 'Nº de casos de teste',
    },
    {
      phase: 'Analysis and Code',
      exit: 'Todas as tarefas (não-bugs) estão "Concluídas".',
      indicators: '% de tarefas concluídas',
    },
    {
      phase: 'Build',
      exit: 'Considerado automático após a fase anterior.',
      indicators: 'Status da fase anterior',
    },
    {
      phase: 'Test',
      exit: 'Todos os casos de teste foram executados.',
      indicators: '% de casos de teste executados',
    },
    {
      phase: 'Release',
      exit: 'Fase de Teste concluída e nenhum bug em aberto.',
      indicators: 'Nº de bugs abertos',
    },
    {
      phase: 'Deploy',
      exit: 'Considerado automático após a fase anterior.',
      indicators: 'Status da fase anterior',
    },
    {
      phase: 'Operate',
      exit: 'Considerado automático após a fase anterior.',
      indicators: 'Status da fase anterior',
    },
    { phase: 'Monitor', exit: 'Fase final, permanece em andamento.', indicators: 'N/A' },
  ];

  return (
    <Card className="mb-8">
      <h3 className="text-2xl font-bold text-white mb-4">Guia de Lógica de Transição de Fases</h3>
      <p className="text-gray-400 mb-6">
        O aplicativo atualiza a fase do projeto automaticamente com base nas seguintes regras. A
        progressão é linear e uma fase só começa quando a anterior é concluída.
      </p>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-600 text-gray-400">
            <tr>
              <th className="p-2">Fase</th>
              <th className="p-2">Condição para Sair (Tornar-se 'Concluído')</th>
              <th className="p-2">Indicadores Chave</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {phaseLogicData.map(row => (
              <tr key={row.phase}>
                <td className="p-2 font-semibold text-teal-400">{row.phase}</td>
                <td className="p-2">{row.exit}</td>
                <td className="p-2 text-gray-400">{row.indicators}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
