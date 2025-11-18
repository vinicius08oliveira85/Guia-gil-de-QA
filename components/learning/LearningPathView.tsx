import React, { useState, useEffect } from 'react';
import { learningPath, LearningModule, Lesson, getCurrentModule, getLearningProgress } from '../../utils/learningPath';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const LearningPathView: React.FC = () => {
    const [completedModules, setCompletedModules] = useLocalStorage<string[]>('learning_completed_modules', []);
    const [completedLessons, setCompletedLessons] = useLocalStorage<string[]>('learning_completed_lessons', []);
    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [currentModule, setCurrentModule] = useState<LearningModule | null>(null);

    useEffect(() => {
        setCurrentModule(getCurrentModule(completedModules));
    }, [completedModules]);

    const progress = getLearningProgress(completedModules, completedLessons);

    const handleLessonClick = (module: LearningModule, lesson: Lesson) => {
        setSelectedModule(module);
        setSelectedLesson(lesson);
        setShowLessonModal(true);
    };

    const handleCompleteLesson = (moduleId: string, lessonId: string) => {
        if (!completedLessons.includes(lessonId)) {
            setCompletedLessons([...completedLessons, lessonId]);
        }
        
        // Verifica se todas as lições do módulo foram completadas
        const module = learningPath.find(m => m.id === moduleId);
        if (module) {
            const allLessonsCompleted = module.lessons.every(l => 
                completedLessons.includes(l.id) || l.id === lessonId
            );
            
            if (allLessonsCompleted && !completedModules.includes(moduleId)) {
                setCompletedModules([...completedModules, moduleId]);
            }
        }
    };

    const canAccessModule = (module: LearningModule): boolean => {
        if (!module.prerequisites || module.prerequisites.length === 0) {
            return true;
        }
        return module.prerequisites.every(prereq => completedModules.includes(prereq));
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Iniciante': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Intermediário': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Avançado': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                    🎓 Trilha de Aprendizado QA
                </h1>
                <p className="text-text-secondary mb-6">
                    Aprenda Quality Assurance de forma prática e progressiva. Complete módulos e lições para avançar.
                </p>

                {/* Progresso Geral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-text-secondary font-semibold">Progresso de Módulos</span>
                                <span className="text-text-primary font-bold">
                                    {progress.completedModules}/{progress.totalModules}
                                </span>
                            </div>
                            <ProgressIndicator
                                value={progress.completedModules}
                                max={progress.totalModules}
                                color="blue"
                                size="lg"
                            />
                            <p className="text-xs text-text-secondary mt-2">
                                {Math.round(progress.modulesProgress)}% completo
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-text-secondary font-semibold">Progresso de Lições</span>
                                <span className="text-text-primary font-bold">
                                    {progress.completedLessons}/{progress.totalLessons}
                                </span>
                            </div>
                            <ProgressIndicator
                                value={progress.completedLessons}
                                max={progress.totalLessons}
                                color="green"
                                size="lg"
                            />
                            <p className="text-xs text-text-secondary mt-2">
                                {Math.round(progress.lessonsProgress)}% completo
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Módulo Atual */}
                {currentModule && (
                    <Card className="mb-6 border-2 border-accent">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                                        {currentModule.icon} {currentModule.title}
                                    </h2>
                                    <p className="text-text-secondary">{currentModule.description}</p>
                                </div>
                                <Badge variant="info" size="lg">
                                    Próximo Módulo
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className={getLevelColor(currentModule.level)}>
                                    {currentModule.level}
                                </Badge>
                                <Badge variant="default">
                                    ⏱️ {currentModule.estimatedTime}
                                </Badge>
                            </div>
                            <button
                                onClick={() => handleLessonClick(currentModule, currentModule.lessons[0])}
                                className="btn btn-primary"
                            >
                                Começar Módulo
                            </button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Lista de Módulos */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Todos os Módulos</h2>
                {learningPath.map((module, moduleIndex) => {
                    const isCompleted = completedModules.includes(module.id);
                    const canAccess = canAccessModule(module);
                    const moduleLessonsCompleted = module.lessons.filter(l => 
                        completedLessons.includes(l.id)
                    ).length;

                    return (
                        <Card
                            key={module.id}
                            className={!canAccess ? 'opacity-50' : ''}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-3xl">{module.icon}</span>
                                            <div>
                                                <h3 className="text-xl font-bold text-text-primary">
                                                    {module.title}
                                                </h3>
                                                <p className="text-text-secondary text-sm">
                                                    {module.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <Badge className={getLevelColor(module.level)}>
                                                {module.level}
                                            </Badge>
                                            <Badge variant="default">
                                                ⏱️ {module.estimatedTime}
                                            </Badge>
                                            {isCompleted && (
                                                <Badge variant="success">
                                                    ✅ Completo
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Progresso do Módulo */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-text-secondary">
                                            Lições: {moduleLessonsCompleted}/{module.lessons.length}
                                        </span>
                                    </div>
                                    <ProgressIndicator
                                        value={moduleLessonsCompleted}
                                        max={module.lessons.length}
                                        color={isCompleted ? 'green' : 'blue'}
                                        size="sm"
                                    />
                                </div>

                                {/* Lista de Lições */}
                                <div className="space-y-2">
                                    {module.lessons.map((lesson, lessonIndex) => {
                                        const isLessonCompleted = completedLessons.includes(lesson.id);
                                        const isLocked = !canAccess && lessonIndex > 0;

                                        return (
                                            <div
                                                key={lesson.id}
                                                className={`p-3 rounded-lg border ${
                                                    isLessonCompleted
                                                        ? 'bg-green-500/10 border-green-500/30'
                                                        : isLocked
                                                        ? 'bg-gray-500/10 border-gray-500/30 opacity-50'
                                                        : 'bg-surface border-surface-border hover:border-accent cursor-pointer'
                                                } transition-all`}
                                                onClick={() => !isLocked && handleLessonClick(module, lesson)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isLessonCompleted ? (
                                                            <span className="text-green-400">✅</span>
                                                        ) : isLocked ? (
                                                            <span className="text-gray-500">🔒</span>
                                                        ) : (
                                                            <span className="text-accent">
                                                                {lesson.type === 'teoria' ? '📖' : lesson.type === 'pratica' ? '🛠️' : '📝'}
                                                            </span>
                                                        )}
                                                        <div>
                                                            <h4 className="font-semibold text-text-primary">
                                                                {lesson.title}
                                                            </h4>
                                                            <p className="text-sm text-text-secondary">
                                                                {lesson.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!isLocked && (
                                                        <button className="text-accent hover:text-accent-hover">
                                                            →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal de Lição */}
            {selectedModule && selectedLesson && (
                <Modal
                    isOpen={showLessonModal}
                    onClose={() => setShowLessonModal(false)}
                    title={`${selectedModule.icon} ${selectedLesson.title}`}
                    size="lg"
                    maxHeight="90vh"
                >
                    <div className="space-y-6">
                        <div>
                            <p className="text-text-secondary mb-4">{selectedLesson.description}</p>
                        </div>

                        {/* Conteúdo da Lição */}
                        {selectedLesson.content.sections.map((section, index) => (
                            <div key={index} className="border-l-4 border-accent pl-4">
                                <h3 className="text-lg font-bold text-text-primary mb-2">
                                    {section.title}
                                </h3>
                                <div className="text-text-secondary whitespace-pre-line mb-4">
                                    {section.content}
                                </div>
                                {section.codeExample && (
                                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4">
                                        <code className="text-sm text-gray-300">{section.codeExample}</code>
                                    </pre>
                                )}
                            </div>
                        ))}

                        {/* Pontos-chave */}
                        {selectedLesson.content.keyPoints && selectedLesson.content.keyPoints.length > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <h4 className="font-bold text-blue-400 mb-2">💡 Pontos-chave:</h4>
                                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                    {selectedLesson.content.keyPoints.map((point, index) => (
                                        <li key={index}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Exemplos */}
                        {selectedLesson.content.examples && selectedLesson.content.examples.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-bold text-text-primary">📚 Exemplos:</h4>
                                {selectedLesson.content.examples.map((example, index) => (
                                    <div key={index} className="bg-surface border border-surface-border rounded-lg p-4">
                                        <h5 className="font-semibold text-text-primary mb-2">{example.title}</h5>
                                        <p className="text-text-secondary mb-2">{example.description}</p>
                                        <div className="bg-gray-900 p-3 rounded mb-2">
                                            <p className="text-sm text-gray-300"><strong>Cenário:</strong> {example.scenario}</p>
                                        </div>
                                        <div className="bg-green-900/30 p-3 rounded">
                                            <p className="text-sm text-green-300"><strong>Solução:</strong> {example.solution}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tarefa Prática */}
                        {selectedLesson.practicalTask && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <h4 className="font-bold text-yellow-400 mb-2">🛠️ Tarefa Prática:</h4>
                                <h5 className="font-semibold text-text-primary mb-2">
                                    {selectedLesson.practicalTask.title}
                                </h5>
                                <p className="text-text-secondary mb-4">{selectedLesson.practicalTask.description}</p>
                                
                                <div className="mb-4">
                                    <h6 className="font-semibold text-text-primary mb-2">Instruções:</h6>
                                    <ol className="list-decimal list-inside space-y-1 text-text-secondary">
                                        {selectedLesson.practicalTask.instructions.map((instruction, index) => (
                                            <li key={index}>{instruction}</li>
                                        ))}
                                    </ol>
                                </div>

                                {selectedLesson.practicalTask.hints && selectedLesson.practicalTask.hints.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="font-semibold text-text-primary mb-2">💡 Dicas:</h6>
                                        <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                            {selectedLesson.practicalTask.hints.map((hint, index) => (
                                                <li key={index}>{hint}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-green-900/30 p-3 rounded mb-4">
                                    <p className="text-sm text-green-300">
                                        <strong>Resultado Esperado:</strong> {selectedLesson.practicalTask.expectedOutcome}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botão de Completar */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                            <button
                                onClick={() => setShowLessonModal(false)}
                                className="btn btn-secondary"
                            >
                                Fechar
                            </button>
                            {!completedLessons.includes(selectedLesson.id) && (
                                <button
                                    onClick={() => {
                                        handleCompleteLesson(selectedModule.id, selectedLesson.id);
                                        setShowLessonModal(false);
                                    }}
                                    className="btn btn-primary"
                                >
                                    ✅ Marcar como Completo
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

