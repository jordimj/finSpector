import { Loader2, X } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { cn } from '../lib/utils';

export type FilterAutocompleteOption = {
  detail?: string;
  label: string;
  value: string;
};

type FilterAutocompleteProps = {
  disabled?: boolean;
  id: string;
  isLoading?: boolean;
  label: string;
  onClear: () => void;
  onSelect: (option: FilterAutocompleteOption) => void;
  options: FilterAutocompleteOption[];
  placeholder: string;
  selectedValue?: string;
};

export function FilterAutocomplete({
  disabled = false,
  id,
  isLoading = false,
  label,
  onClear,
  onSelect,
  options,
  placeholder,
  selectedValue,
}: FilterAutocompleteProps) {
  const wrapperRef = useRef<HTMLLabelElement>(null);
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const listboxId = `${id}-listbox`;
  const normalizedInput = inputValue.trim().toLocaleLowerCase();
  const visibleOptions = useMemo(() => {
    if (normalizedInput === '') {
      return options.slice(0, 8);
    }

    return options
      .filter((option) => {
        const searchable = `${option.label} ${option.detail ?? ''}`;

        return searchable.toLocaleLowerCase().includes(normalizedInput);
      })
      .slice(0, 8);
  }, [normalizedInput, options]);

  useEffect(() => {
    setInputValue(selectedOption?.label ?? '');
  }, [selectedOption?.label]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        wrapperRef.current !== null &&
        !wrapperRef.current.contains(target)
      ) {
        closeAndRestoreSelection();
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAndRestoreSelection();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedOption?.label]);

  function closeAndRestoreSelection() {
    setIsOpen(false);
    setInputValue(selectedOption?.label ?? '');
  }

  function handleInputChange(value: string) {
    setInputValue(value);
    setIsOpen(true);

    if (value.trim() === '' && selectedValue !== undefined) {
      onClear();
    }
  }

  function handleSelect(option: FilterAutocompleteOption) {
    onSelect(option);
    setInputValue(option.label);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const firstOption = visibleOptions[0];

    if (event.key === 'Enter' && isOpen && firstOption !== undefined) {
      event.preventDefault();
      handleSelect(firstOption);
      return;
    }

    if (event.key === 'ArrowDown') {
      setIsOpen(true);
    }
  }

  return (
    <label
      ref={wrapperRef}
      className={cn(
        'relative grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong',
        disabled && 'opacity-60',
      )}
    >
      {label}
      <span className='relative'>
        <input
          id={id}
          type='text'
          autoComplete='off'
          role='combobox'
          aria-autocomplete='list'
          aria-controls={listboxId}
          aria-expanded={isOpen}
          className='h-10 w-full rounded-md border border-line bg-canvas px-3 pr-10 text-sm font-medium normal-case tracking-normal text-ink outline-none transition placeholder:text-muted focus:border-accent-lavender disabled:cursor-not-allowed'
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={(event) => handleInputChange(event.currentTarget.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {isLoading ? (
          <Loader2
            className='pointer-events-none absolute right-3 top-3 size-4 animate-spin text-muted'
            aria-hidden='true'
          />
        ) : selectedValue !== undefined ? (
          <button
            type='button'
            className='absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md text-muted transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            aria-label={`Clear ${label.toLocaleLowerCase()} filter`}
            title={`Clear ${label.toLocaleLowerCase()} filter`}
            onClick={onClear}
          >
            <X className='size-4' aria-hidden='true' />
          </button>
        ) : null}
      </span>

      {isOpen && !disabled ? (
        <div
          id={listboxId}
          role='listbox'
          className='absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-lg border border-line bg-panel p-1.5 normal-case tracking-normal shadow-shell'
        >
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <button
                key={option.value}
                type='button'
                role='option'
                aria-selected={option.value === selectedValue}
                className={cn(
                  'flex min-h-10 w-full flex-col items-start justify-center rounded-md px-3 py-2 text-left text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
                  option.value === selectedValue &&
                    'bg-accent-lavender/12 text-accent-lavender',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
              >
                <span className='w-full truncate'>{option.label}</span>
                {option.detail !== undefined ? (
                  <span className='mt-0.5 w-full truncate text-xs font-medium text-muted'>
                    {option.detail}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className='px-3 py-3 text-sm font-medium text-muted'>
              No matches
            </p>
          )}
        </div>
      ) : null}
    </label>
  );
}
