import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../../../lib/utils';
import { filterSuggestionOptions } from '../../utils/reviewRows';

export function EditableSuggestionInput({
  className,
  disabled,
  id,
  label,
  options,
  placeholder,
  value,
  onValueChange,
}: {
  className?: string;
  disabled: boolean;
  id: string;
  label: string;
  options: string[];
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const visibleOptions = useMemo(
    () => filterSuggestionOptions(options, value),
    [options, value],
  );
  const hasOptions = visibleOptions.length > 0;
  const showOptions = isOpen && !disabled && hasOptions;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [visibleOptions]);

  function selectOption(option: string) {
    onValueChange(option);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!hasOptions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        currentIndex + 1 >= visibleOptions.length ? 0 : currentIndex + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        currentIndex === 0 ? visibleOptions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const option = visibleOptions[highlightedIndex] ?? visibleOptions[0];

      if (option !== undefined) {
        selectOption(option);
      }

      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div className='relative'>
      <label className='sr-only' htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete='off'
        className={cn(
          'h-8 w-full rounded-md border border-line bg-panel-raised px-3 text-sm outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25 disabled:cursor-not-allowed disabled:opacity-70',
          className,
        )}
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        value={value}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {showOptions ? (
        <div className='absolute left-0 right-0 top-full z-40 mt-1 max-h-32 overflow-y-auto rounded-md border border-line bg-panel py-1 shadow-shell'>
          {visibleOptions.map((option, optionIndex) => (
            <button
              key={option}
              className={cn(
                'flex min-h-7 w-full items-center px-3 py-1 text-left text-xs font-semibold text-muted-strong outline-none transition hover:bg-accent-lavender/10 hover:text-ink',
                optionIndex === highlightedIndex &&
                  'bg-accent-lavender/10 text-ink',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
              type='button'
            >
              <span className='truncate'>{option}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
