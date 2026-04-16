import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
}

const DecimalInput = ({ value, onChange, disabled, className, placeholder, min }: DecimalInputProps) => {
  const [displayValue, setDisplayValue] = useState(() =>
    value ? value.toString().replace('.', ',') : ''
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Allow only digits, comma, dot, minus
    raw = raw.replace(/[^0-9,.\-]/g, '');
    setDisplayValue(raw);
    const normalized = raw.replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && (min === undefined || num >= min)) {
      onChange(num);
    } else if (raw === '' || raw === '0') {
      onChange(0);
    }
  }, [onChange, min]);

  const handleBlur = useCallback(() => {
    // Format on blur
    if (value) {
      setDisplayValue(value.toString().replace('.', ','));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default DecimalInput;
