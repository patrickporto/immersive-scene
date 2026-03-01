import { useState, useRef, useEffect, KeyboardEvent } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '../utils/cn';

interface InlineEditableProps {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}

/**
 * @description A premium inline editable text component inspired by Vercel/Apple design.
 * Toggles between display text and an input field.
 */
export function InlineEditable({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = 'Type here...',
  allowEmpty = false,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = async () => {
    const trimmedValue = tempValue.trim();
    if (!allowEmpty && trimmedValue === '') {
      setTempValue(value);
      setIsEditing(false);
      return;
    }

    if (trimmedValue !== value) {
      await onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className={cn('relative group inline-flex items-center', className)}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="w-full"
          >
            <input
              ref={inputRef}
              type="text"
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => void handleSave()}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'bg-white/5 border border-cyan-500/30 rounded px-1.5 py-0.5 w-full outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-inherit text-inherit',
                inputClassName
              )}
            />
          </motion.div>
        ) : (
          <motion.span
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(true)}
            className="cursor-text hover:bg-white/5 rounded px-1 -mx-1 transition-colors relative"
          >
            {value || <span className="text-gray-500 italic">{placeholder}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
