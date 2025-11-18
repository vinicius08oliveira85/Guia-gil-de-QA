
import React from 'react';
import { Card } from '../common/Card';

const glossaryData = {
    'Glossário de Termos de QA': [
        { term: 'BDD (Behavior-Driven Development)', definition: 'Técnica de desenvolvimento ágil que incentiva a colaboração entre desenvolvedores, QAs e pessoas não-técnicas. Cenários são escritos em linguagem natural (Gherkin) antes do código.' },
        { term: 'Bug Leakage', definition: 'Métrica que mede a quantidade de bugs que "escaparam" do processo de QA e foram encontrados em produção pelos usuários finais.' },
        { term: 'CI/CD (Continuous Integration/Continuous Delivery)', definition: 'Prática de automatizar as fases de build, teste e deploy do software, permitindo entregas mais rápidas e seguras.' },
        { term: 'Flaky Test', definition: 'Um teste automatizado que falha de forma intermitente sem uma mudança real no código, geralmente devido a problemas de concorrência, ambiente ou dependências externas.' },
        { term: 'QA (Quality Assurance)', definition: 'Garantia da Qualidade. Processo focado em prevenir defeitos e garantir que o produto atenda aos padrões de qualidade e requisitos.' },
        { term: 'QC (Quality Control)', definition: 'Controle de Qualidade. Processo focado em identificar e corrigir defeitos no produto final, através da execução de testes.' },
        { term: 'Regression Testing', definition: 'Teste de Regressão. Tipo de teste que visa garantir que novas alterações no código não introduziram novos bugs em funcionalidades que já existiam.' },
        { term: 'Shift Left Testing', definition: 'Abordagem que move as atividades de teste para o início do ciclo de vida de desenvolvimento (SDLC), em vez de esperar pelo final.' },
        { term: 'Smoke Test', definition: 'Teste rápido e superficial para verificar se as funcionalidades mais críticas de uma nova versão do software estão funcionando, antes de prosseguir com testes mais aprofundados.' },
        { term: 'UAT (User Acceptance Testing)', definition: 'Teste de Aceitação do Usuário. Fase final de teste onde os stakeholders ou clientes validam se o sistema atende às suas necessidades de negócio.' },
    ],
    'Lista de Boas Práticas': [
        'Comece a testar o mais cedo possível ("Shift Left"). Envolva-se nas discussões de requisitos.',
        'Casos de teste devem ser claros, concisos e independentes.',
        'Automatize os testes de regressão para garantir a estabilidade do produto a longo prazo.',
        'Use dados de teste realistas e variados, cobrindo cenários positivos e negativos.',
        'Comunicação é fundamental: colabore de forma construtiva com desenvolvedores e POs.',
        'Priorize os testes com base no risco e no impacto para o negócio.',
        'Documente os bugs de forma clara e detalhada, com passos para reprodução inequívocos.',
    ],
    'O Que Nunca Deve Ser Feito por um QA': [
        'Garantir que um software está "100% livre de bugs". O objetivo é mitigar riscos, não alcançar a perfeição.',
        'Aprovar uma funcionalidade que não foi devidamente testada.',
        'Reportar bugs de forma vaga ("Não funciona") ou acusatória.',
        'Testar apenas o "caminho feliz" e ignorar casos de borda e cenários de erro.',
        'Manter-se isolado. QA é um papel colaborativo, não um portão de pedágio no final do processo.',
        'Ter medo de fazer perguntas. Questionar é uma das principais ferramentas do QA.',
    ],
    'Principais Erros de Iniciantes': [
        'Focar apenas em encontrar bugs, em vez de focar em prevenir defeitos desde o início.',
        'Não entender o negócio e o valor que a funcionalidade entrega ao usuário final.',
        'Escrever casos de teste muito longos, complexos e difíceis de manter.',
        'Não gerenciar seu tempo de forma eficaz, gastando muito tempo em testes de baixo impacto.',
        'Falhar em comunicar os riscos de qualidade de forma clara para a equipe e stakeholders.',
    ],
    'Riscos Comuns em Projetos': [
        'Requisitos ambíguos ou em constante mudança.',
        'Prazos irreais que comprimem o tempo disponível para testes.',
        'Comunicação deficiente entre as equipes (Dev, QA, Produto).',
        'Ambiente de teste instável ou muito diferente do ambiente de produção.',
        'Falta de uma estratégia de automação de testes clara.',
        'Débito técnico acumulado que torna o sistema frágil e difícil de testar.',
    ]
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        {children}
    </Card>
);

export const GlossaryView: React.FC = () => {
    return (
        <div>
            <Section title="Glossário de Termos de QA">
                <div className="space-y-4">
                    {glossaryData['Glossário de Termos de QA'].map(item => (
                        <div key={item.term}>
                            <h4 className="font-bold text-teal-400">{item.term}</h4>
                            <p className="text-gray-300 ml-2">{item.definition}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Listas Complementares">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-lg font-bold text-teal-400 mb-3">Boas Práticas</h4>
                        <ul className="space-y-2">
                            {glossaryData['Lista de Boas Práticas'].map(item => (
                                <li key={item} className="flex items-start text-gray-300">
                                    <svg className="w-5 h-5 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-lg font-bold text-teal-400 mb-3">O Que Nunca Deve Ser Feito</h4>
                        <ul className="space-y-2">
                            {glossaryData['O Que Nunca Deve Ser Feito por um QA'].map(item => (
                                <li key={item} className="flex items-start text-gray-300">
                                     <svg className="w-5 h-5 mr-2 mt-0.5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-lg font-bold text-teal-400 mb-3">Principais Erros de Iniciantes</h4>
                        <ul className="space-y-2">
                            {glossaryData['Principais Erros de Iniciantes'].map(item => (
                                <li key={item} className="flex items-start text-gray-300">
                                    <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-lg font-bold text-teal-400 mb-3">Riscos Comuns em Projetos</h4>
                         <ul className="space-y-2">
                            {glossaryData['Riscos Comuns em Projetos'].map(item => (
                                <li key={item} className="flex items-start text-gray-300">
                                    <svg className="w-5 h-5 mr-2 mt-0.5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>
        </div>
    );
};
