// Este arquivo mantém compatibilidade com código existente
// Redireciona para a nova arquitetura de serviços de IA

import { getAIService } from './ai/aiServiceFactory';

// Re-exporta todas as funções usando o serviço de IA configurado
export const generateTestCasesForTask = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateTestCasesForTask']>) => {
  return getAIService().generateTestCasesForTask(...args);
};

export const analyzeDocumentContent = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['analyzeDocumentContent']>) => {
  return getAIService().analyzeDocumentContent(...args);
};

export const generateTaskFromDocument = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateTaskFromDocument']>) => {
  return getAIService().generateTaskFromDocument(...args);
};

export const generateProjectLifecyclePlan = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateProjectLifecyclePlan']>) => {
  return getAIService().generateProjectLifecyclePlan(...args);
};

export const generateShiftLeftAnalysis = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateShiftLeftAnalysis']>) => {
  return getAIService().generateShiftLeftAnalysis(...args);
};

export const generateBddScenarios = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateBddScenarios']>) => {
  return getAIService().generateBddScenarios(...args);
};

export const generateTestPyramidAnalysis = async (...args: Parameters<typeof import('./ai/aiServiceInterface').AIService['generateTestPyramidAnalysis']>) => {
  return getAIService().generateTestPyramidAnalysis(...args);
};
