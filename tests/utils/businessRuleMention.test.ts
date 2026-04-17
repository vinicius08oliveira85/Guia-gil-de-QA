import {
  appendMentionToDescription,
  mentionTokenForRule,
  removeMentionFromDescription,
  slugifyBusinessRuleTitleForMention,
} from '../../utils/businessRuleMention';
import type { BusinessRule } from '../../types';

describe('businessRuleMention', () => {
  it('slugifyBusinessRuleTitleForMention gera PascalCase sem espaços', () => {
    expect(slugifyBusinessRuleTitleForMention('login obrigatório')).toBe('LoginObrigatorio');
    expect(slugifyBusinessRuleTitleForMention('  a  b  ')).toBe('AB');
  });

  it('mentionTokenForRule usa @Pascal sem sufixo se título único', () => {
    const a: BusinessRule = {
      id: '1',
      title: 'Regra A',
      description: '',
      category: 'Geral',
      createdAt: 't',
    };
    const b: BusinessRule = {
      id: '2',
      title: 'Regra B',
      description: '',
      category: 'Geral',
      createdAt: 't',
    };
    expect(mentionTokenForRule(a, [a, b])).toBe('@RegraA');
  });

  it('mentionTokenForRule acrescenta sufixo se mesmo slug de título', () => {
    const a: BusinessRule = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Mesmo',
      description: '',
      category: 'Geral',
      createdAt: 't',
    };
    const b: BusinessRule = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'mesmo',
      description: '',
      category: 'Geral',
      createdAt: 't',
    };
    expect(mentionTokenForRule(a, [a, b])).toBe('@Mesmoaaaaaaaa');
    expect(mentionTokenForRule(b, [a, b])).toBe('@Mesmobbbbbbbb');
  });

  it('appendMentionToDescription não duplica', () => {
    const m = '@Foo';
    expect(appendMentionToDescription('texto', m)).toBe('texto @Foo');
    expect(appendMentionToDescription('texto @Foo', m)).toBe('texto @Foo');
  });

  it('removeMentionFromDescription remove token', () => {
    expect(removeMentionFromDescription('a @Foo b', '@Foo')).toBe('a b');
    expect(removeMentionFromDescription('@Foo', '@Foo')).toBe('');
  });
});
