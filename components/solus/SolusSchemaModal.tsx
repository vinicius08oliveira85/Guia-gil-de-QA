import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { solusSchema, ApiTableSchema, SolusTableName } from '../../utils/solusSchema';

interface SolusSchemaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getDefaultTable = (): SolusTableName => solusSchema[0]?.table ?? 'patients';

export const SolusSchemaModal: React.FC<SolusSchemaModalProps> = ({ isOpen, onClose }) => {
    const [activeTable, setActiveTable] = useState<SolusTableName>(getDefaultTable());
    const [fieldQuery, setFieldQuery] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setActiveTable(getDefaultTable());
        setFieldQuery('');
    }, [isOpen]);

    const currentSchema: ApiTableSchema | undefined = useMemo(
        () => solusSchema.find(schema => schema.table === activeTable),
        [activeTable]
    );

    const filteredFields = useMemo(() => {
        if (!currentSchema) {
            return [];
        }
        if (!fieldQuery.trim()) {
            return currentSchema.fields;
        }
        const needle = fieldQuery.toLowerCase();
        return currentSchema.fields.filter(field =>
            field.name.toLowerCase().includes(needle) ||
            field.type.toLowerCase().includes(needle) ||
            field.description.toLowerCase().includes(needle)
        );
    }, [currentSchema, fieldQuery]);

    if (!currentSchema) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Esquema da API Solus (Mapa de Internação)"
            size="xl"
            maxHeight="85vh"
        >
            <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
                <aside className="space-y-3 border border-surface-border rounded-2xl bg-surface-card p-4 h-fit sticky top-0">
                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        Tabelas disponíveis
                    </p>
                    <div className="flex flex-col gap-2" role="tablist" aria-label="Tabelas da API">
                        {solusSchema.map(schema => {
                            const isActive = schema.table === currentSchema.table;
                            return (
                                <button
                                    key={schema.table}
                                    onClick={() => setActiveTable(schema.table)}
                                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                                        isActive
                                            ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                                            : 'border-transparent bg-surface-hover text-text-secondary hover:text-text-primary'
                                    }`}
                                    role="tab"
                                    aria-selected={isActive}
                                >
                                    <span className="block text-sm">{schema.label}</span>
                                    <span className="text-xs text-text-tertiary">{schema.table}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="space-y-6">
                    <header className="space-y-3">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-text-tertiary mb-1">
                                {currentSchema.table}
                            </p>
                            <h3 className="text-2xl font-semibold text-text-primary">
                                {currentSchema.label}
                            </h3>
                        </div>
                        <p className="text-text-secondary leading-relaxed">{currentSchema.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                            {currentSchema.totalHint && (
                                <Badge size="sm">{currentSchema.totalHint}</Badge>
                            )}
                            {currentSchema.primaryKey && (
                                <Badge size="sm">PK: {currentSchema.primaryKey}</Badge>
                            )}
                            {currentSchema.relations && currentSchema.relations.length > 0 && (
                                <Badge size="sm">Relacionamentos: {currentSchema.relations.join(', ')}</Badge>
                            )}
                        </div>
                        {currentSchema.defaultFilters && (
                            <div className="bg-surface-hover border border-surface-border rounded-2xl p-3 text-sm flex flex-wrap gap-2">
                                <span className="font-semibold text-text-secondary">Filtros úteis:</span>
                                {currentSchema.defaultFilters.map(filter => (
                                    <code key={filter} className="bg-surface-card px-2 py-1 rounded-lg text-xs">
                                        {filter}
                                    </code>
                                ))}
                            </div>
                        )}
                        {currentSchema.statuses && (
                            <div className="bg-surface-hover border border-surface-border rounded-2xl p-3">
                                <p className="text-sm font-semibold text-text-secondary mb-2">Status aceitos</p>
                                <div className="flex flex-wrap gap-2">
                                    {currentSchema.statuses.map(status => (
                                        <Badge key={status} variant="info" size="sm" className="capitalize">{status}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {currentSchema.notes && (
                            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                                {currentSchema.notes.map(note => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        )}
                    </header>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-text-secondary" htmlFor="schema-field-search">
                            Buscar campos
                        </label>
                        <input
                            id="schema-field-search"
                            type="search"
                            value={fieldQuery}
                            onChange={event => setFieldQuery(event.target.value)}
                            placeholder="Digite parte do nome, tipo ou descrição"
                            className="w-full rounded-xl border border-surface-border bg-surface-card px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                        />
                    </div>

                    <div className="overflow-hidden border border-surface-border rounded-2xl bg-surface-card">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-surface-hover text-text-secondary">
                                    <tr>
                                        <th scope="col" className="text-left px-4 py-3 font-semibold">Campo</th>
                                        <th scope="col" className="text-left px-4 py-3 font-semibold">Tipo</th>
                                        <th scope="col" className="text-left px-4 py-3 font-semibold">Descrição</th>
                                        <th scope="col" className="text-left px-4 py-3 font-semibold">Exemplo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFields.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center px-4 py-6 text-text-tertiary">
                                                Nenhum campo encontrado com esse filtro.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredFields.map(field => (
                                        <tr key={field.name} className="border-t border-surface-border">
                                            <td className="px-4 py-3 font-mono text-sm text-text-primary">{field.name}</td>
                                            <td className="px-4 py-3 text-text-secondary">{field.type}</td>
                                            <td className="px-4 py-3 text-text-secondary">{field.description}</td>
                                            <td className="px-4 py-3 text-text-tertiary">
                                                {field.example ? (
                                                    <code className="text-xs bg-surface-hover px-2 py-1 rounded-lg">{field.example}</code>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
};
