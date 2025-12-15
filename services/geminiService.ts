// Este arquivo mantém compatibilidade com código existente
// Redireciona para a nova arquitetura de serviços de IA

import { getAIService } from './ai/aiServiceFactory';
import type { AIService } from './ai/aiServiceInterface';

// Re-exporta todas as funções usando o serviço de IA configurado
export const generateTestCasesForTask = async (
  ...args: Parameters<AIService['generateTestCasesForTask']>
) => {
  return getAIService().generateTestCasesForTask(...args);
};

export const analyzeDocumentContent = async (
  ...args: Parameters<AIService['analyzeDocumentContent']>
) => {
  return getAIService().analyzeDocumentContent(...args);
};

export const generateTaskFromDocument = async (
  ...args: Parameters<AIService['generateTaskFromDocument']>
) => {
  return getAIService().generateTaskFromDocument(...args);
};

export const generateProjectLifecyclePlan = async (
  ...args: Parameters<AIService['generateProjectLifecyclePlan']>
) => {
  return getAIService().generateProjectLifecyclePlan(...args);
};

export const generateShiftLeftAnalysis = async (
  ...args: Parameters<AIService['generateShiftLeftAnalysis']>
) => {
  return getAIService().generateShiftLeftAnalysis(...args);
};

export const generateBddScenarios = async (
  ...args: Parameters<AIService['generateBddScenarios']>
) => {
  return getAIService().generateBddScenarios(...args);
};

export const generateTestPyramidAnalysis = async (
  ...args: Parameters<AIService['generateTestPyramidAnalysis']>
) => {
  return getAIService().generateTestPyramidAnalysis(...args);
};
