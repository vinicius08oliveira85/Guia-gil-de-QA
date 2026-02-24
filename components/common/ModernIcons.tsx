import React from 'react';
import {
  ClipboardList,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Filter,
  TestTube,
  FileText,
  Building2,
  Settings,
  Lightbulb,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Ícones modernos para KPIs e métricas usando lucide-react
 */
export const ModernIcons = {
  TotalTasks: React.memo<IconProps>(({ className = 'text-primary', size = 24 }) => (
    <ClipboardList className={className} size={size} strokeWidth={2} />
  )),

  InProgress: React.memo<IconProps>(({ className = 'text-warning', size = 24 }) => (
    <Zap className={className} size={size} strokeWidth={2} />
  )),

  Completed: React.memo<IconProps>(({ className = 'text-success', size = 24 }) => (
    <CheckCircle2 className={className} size={size} strokeWidth={2} />
  )),

  Bugs: React.memo<IconProps>(({ className = 'text-error', size = 24 }) => (
    <AlertTriangle className={className} size={size} strokeWidth={2} />
  )),

  TestExecution: React.memo<IconProps>(({ className = 'text-primary', size = 24 }) => (
    <ClipboardCheck className={className} size={size} strokeWidth={2} />
  )),

  Filter: React.memo<IconProps>(({ className = 'text-primary', size = 20 }) => (
    <Filter className={className} size={size} strokeWidth={2} />
  )),

  TestStrategy: React.memo<IconProps>(({ className = 'text-primary', size = 20 }) => (
    <TestTube className={className} size={size} strokeWidth={2} />
  )),

  TestStatus: React.memo<IconProps>(({ className = 'text-primary', size = 20 }) => (
    <CheckCircle2 className={className} size={size} strokeWidth={2} />
  )),

  Document: React.memo<IconProps>(({ className = 'text-base-content/70', size = 20 }) => (
    <FileText className={className} size={size} strokeWidth={2} />
  )),

  Architecture: React.memo<IconProps>(({ className = 'text-base-content/70', size = 20 }) => (
    <Building2 className={className} size={size} strokeWidth={2} />
  )),

  Settings: React.memo<IconProps>(({ className = 'text-base-content/70', size = 20 }) => (
    <Settings className={className} size={size} strokeWidth={2} />
  )),

  Suggestion: React.memo<IconProps>(({ className = 'text-primary', size = 20 }) => (
    <Lightbulb className={className} size={size} strokeWidth={2} />
  )),
};

ModernIcons.TotalTasks.displayName = 'TotalTasksIcon';
ModernIcons.InProgress.displayName = 'InProgressIcon';
ModernIcons.Completed.displayName = 'CompletedIcon';
ModernIcons.Bugs.displayName = 'BugsIcon';
ModernIcons.TestExecution.displayName = 'TestExecutionIcon';
ModernIcons.Filter.displayName = 'FilterIcon';
ModernIcons.TestStrategy.displayName = 'TestStrategyIcon';
ModernIcons.TestStatus.displayName = 'TestStatusIcon';
ModernIcons.Document.displayName = 'DocumentIcon';
ModernIcons.Architecture.displayName = 'ArchitectureIcon';
ModernIcons.Settings.displayName = 'SettingsIcon';
ModernIcons.Suggestion.displayName = 'SuggestionIcon';
