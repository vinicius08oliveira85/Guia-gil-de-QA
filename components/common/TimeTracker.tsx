import React, { useState, useEffect } from 'react';
import { JiraTask } from '../../types';
import { formatDuration } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface TimeTrackerProps {
  task: JiraTask;
  onUpdate: (task: JiraTask) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ task, onUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { handleSuccess } = useErrorHandler();

  useEffect(() => {
    if (!(isRunning && startTime)) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    handleSuccess('Tempo iniciado');
  };

  const handleStop = () => {
    if (startTime) {
      const totalMinutes = Math.floor((Date.now() - startTime) / 60000);
      const currentActual = task.actualHours || 0;
      const newActual = currentActual + totalMinutes / 60;

      onUpdate({
        ...task,
        actualHours: Math.round(newActual * 100) / 100,
      });

      setIsRunning(false);
      setStartTime(null);
      setElapsedTime(0);
      handleSuccess(`Tempo registrado: ${formatDuration(totalMinutes)}`);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const displayTime = isRunning && startTime ? Math.floor(elapsedTime / 1000) : 0;

  const hours = Math.floor(displayTime / 3600);
  const minutes = Math.floor((displayTime % 3600) / 60);
  const seconds = displayTime % 60;

  return (
    <div className="p-4 bg-surface border border-surface-border rounded-lg">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Rastreador de Tempo</h4>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-accent mb-2">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </div>
        {task.actualHours && (
          <div className="text-sm text-text-secondary">
            Total registrado: {task.actualHours.toFixed(2)}h
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors font-semibold"
          >
            ▶ Iniciar
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-semibold"
          >
            ⏸ Parar
          </button>
        )}
        {isRunning && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-surface-hover hover:bg-surface-border text-text-secondary rounded-md transition-colors"
          >
            ↺ Resetar
          </button>
        )}
      </div>
    </div>
  );
};
