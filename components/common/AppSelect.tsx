import React, { useMemo } from 'react';
import { NeuSelect, type NeuSelectOption } from './NeuSelect';

export interface AppSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  placeholder?: string;
  title?: string;
}

function optionsFromChildren(children: React.ReactNode): NeuSelectOption[] {
  const options: NeuSelectOption[] = [];
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type !== 'option') return;
    const props = child.props as {
      value?: string | number;
      disabled?: boolean;
      children?: React.ReactNode;
    };
    options.push({
      value: String(props.value ?? ''),
      label: String(props.children ?? props.value ?? ''),
      disabled: props.disabled,
    });
  });
  return options;
}

/**
 * Select com lista neumórfica customizada (substitui `<select>` nativo).
 * Aceita `<option>` como children para compatibilidade com o markup existente.
 */
export const AppSelect: React.FC<AppSelectProps> = ({
  children,
  onChange,
  ...rest
}) => {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  return <NeuSelect {...rest} options={options} onChange={onChange} />;
};
