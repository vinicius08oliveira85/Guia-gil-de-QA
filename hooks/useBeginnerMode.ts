import { useLocalStorage } from './useLocalStorage';

/**
 * Hook para gerenciar o modo "Iniciante"
 * Quando ativado, mostra explicações extras e dicas contextuais
 */
export const useBeginnerMode = () => {
    const [isBeginnerMode, setIsBeginnerMode] = useLocalStorage<boolean>(
        'beginner_mode_enabled',
        true // Por padrão, ativado para novos usuários
    );

    const toggleBeginnerMode = () => {
        setIsBeginnerMode(!isBeginnerMode);
    };

    return {
        isBeginnerMode,
        setIsBeginnerMode,
        toggleBeginnerMode
    };
};

