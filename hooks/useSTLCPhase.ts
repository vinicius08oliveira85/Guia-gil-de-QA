import { useMemo } from 'react';
import { Project, STLCPhaseName } from '../types';
import { detectCurrentSTLCPhase, getSTLCPhaseOrder } from '../utils/stlcPhaseDetector';

/**
 * Hook para gerenciar a fase STLC atual do projeto
 */
export function useSTLCPhase(project: Project) {
  const currentPhase = useMemo(() => {
    return detectCurrentSTLCPhase(project);
  }, [project]);

  const phaseOrder = useMemo(() => {
    return getSTLCPhaseOrder(currentPhase);
  }, [currentPhase]);

  const isPhase = (phase: STLCPhaseName): boolean => {
    return currentPhase === phase;
  };

  const isPhaseBefore = (phase: STLCPhaseName): boolean => {
    return getSTLCPhaseOrder(currentPhase) < getSTLCPhaseOrder(phase);
  };

  const isPhaseAfter = (phase: STLCPhaseName): boolean => {
    return getSTLCPhaseOrder(currentPhase) > getSTLCPhaseOrder(phase);
  };

  return {
    currentPhase,
    phaseOrder,
    isPhase,
    isPhaseBefore,
    isPhaseAfter,
  };
}
