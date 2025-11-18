import React from 'react';
import { Project } from '../types';

// Define a type for the metrics object passed as a prop, based on what's used.
type ReportMetrics = {
    testCoverage: number;
    tasksWithTestCases: number;
    totalTasks: number;
    testPassRate: number;
    passedTestCases: number;
    executedTestCases: number;
    automationRatio: number;
    automatedTestCases: number;
    totalTestCases: number;
    bugsBySeverity: Record<string, number>;
    openVsClosedBugs: { open: number };
};


export const PrintableReport: React.FC<{ project: Project; metrics: ReportMetrics }> = ({ project, metrics }) => {
    const today = new Date().toLocaleDateString('pt-BR');

    const bugSeverityData = [
        { label: 'Crítico', value: metrics.bugsBySeverity['Crítico'] || 0 },
        { label: 'Alto', value: metrics.bugsBySeverity['Alto'] || 0 },
        { label: 'Médio', value: metrics.bugsBySeverity['Médio'] || 0 },
        { label: 'Baixo', value: metrics.bugsBySeverity['Baixo'] || 0 }
    ];

    const tasksToReport = project.tasks.filter(task => task.type !== 'Bug');

    return (
        <div id="printable-report" style={{ fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff', padding: '20px' }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', margin: 0 }}>Relatório de QA do Projeto: {project.name}</h1>
                <p style={{ fontSize: '14px', margin: '5px 0 0' }}>Gerado em: {today}</p>
            </div>

            {/* Section: Test Coverage & Key Metrics */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '22px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Resumo das Métricas de Teste</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Cobertura de Testes:</td>
                            <td style={{ padding: '10px 8px', fontSize: '18px', fontWeight: 'bold' }}>{metrics.testCoverage}%</td>
                            <td style={{ padding: '10px 8px', color: '#555' }}>({metrics.tasksWithTestCases} de {metrics.totalTasks} tarefas cobertas)</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Taxa de Aprovação de Testes:</td>
                            <td style={{ padding: '10px 8px', fontSize: '18px', fontWeight: 'bold' }}>{metrics.testPassRate}%</td>
                            <td style={{ padding: '10px 8px', color: '#555' }}>({metrics.passedTestCases} de {metrics.executedTestCases} testes aprovados)</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Relação Automação vs. Manuais:</td>
                            <td style={{ padding: '10px 8px', fontSize: '18px', fontWeight: 'bold' }}>{metrics.automationRatio}%</td>
                            <td style={{ padding: '10px 8px', color: '#555' }}>({metrics.automatedTestCases} de {metrics.totalTestCases} testes automatizados)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section: Bug Trends */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '22px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Análise de Bugs Abertos</h2>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9f9f9' }}>
                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Severidade</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bugSeverityData.map(bug => (
                            <tr key={bug.label}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{bug.label}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{bug.value}</td>
                            </tr>
                        ))}
                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>Total de Bugs Abertos:</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{metrics.openVsClosedBugs.open}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section: Phase Completion */}
            <div style={{ pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '22px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Status de Conclusão das Fases</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                     <thead>
                        <tr style={{ backgroundColor: '#f9f9f9' }}>
                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', width: '20%' }}>Fase</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', width: '15%' }}>Status</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Resumo da IA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.phases.map(phase => (
                             <tr key={phase.name}>
                                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{phase.name}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{phase.status}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{phase.summary || 'Análise da IA pendente.'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Section: Tasks and Test Cases Details */}
            <div style={{ pageBreakBefore: 'always', paddingTop: '20px' }}>
                <h2 style={{ fontSize: '22px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>
                    Detalhes das Tarefas e Casos de Teste
                </h2>
                {tasksToReport.length > 0 ? (
                    tasksToReport.map(task => (
                        <div key={task.id} style={{ marginBottom: '20px', pageBreakInside: 'avoid', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', backgroundColor: '#f9f9f9', padding: '8px', borderBottom: '1px solid #ddd', margin: 0 }}>
                                {task.id}: {task.title} ({task.type})
                            </h3>
                            <div style={{ padding: '10px' }}>
                                {task.testCases && task.testCases.length > 0 ? (
                                    <div>
                                        <h4 style={{ fontSize: '14px', marginTop: '0', marginBottom: '10px', fontWeight: 'bold' }}>Casos de Teste:</h4>
                                        {task.testCases.map(tc => (
                                            <div key={tc.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', fontSize: '12px' }}>
                                                <p style={{ margin: 0, fontWeight: 'bold' }}>{tc.description}</p>
                                                <div style={{ marginTop: '5px' }}>
                                                    <strong style={{ display: 'block', marginBottom: '2px' }}>Passos:</strong>
                                                    <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'decimal' }}>
                                                        {tc.steps.map((step, i) => <li key={i}>{step}</li>)}
                                                    </ul>
                                                    <strong style={{ display: 'block', marginTop: '8px', marginBottom: '2px' }}>Resultado Esperado:</strong>
                                                    <p style={{ margin: 0 }}>{tc.expectedResult}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>Nenhum caso de teste associado.</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#777' }}>Nenhuma tarefa (História, Tarefa, Epic) encontrada neste projeto.</p>
                )}
            </div>
        </div>
    );
};
