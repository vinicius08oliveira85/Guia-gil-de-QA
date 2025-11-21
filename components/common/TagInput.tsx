import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_TAGS, TAG_COLORS, getTagColor } from '../../utils/tagService';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
  allowNewTags?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  availableTags = [],
  allowNewTags = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const allAvailableTags = [...new Set([...DEFAULT_TAGS, ...availableTags])];
  const suggestions = allAvailableTags.filter(
    tag => tag.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(tag)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onChange([...tags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (allowNewTags || allAvailableTags.includes(inputValue.trim())) {
        handleAddTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap gap-2 p-2 bg-surface border border-surface-border rounded-md min-h-[42px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm text-white"
            style={{ backgroundColor: getTagColor(tag) }}
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Adicionar tags...' : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-text-primary placeholder-text-secondary"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-surface-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              className="w-full text-left px-3 py-2 hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-2 text-text-primary"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getTagColor(tag) }}
              />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

