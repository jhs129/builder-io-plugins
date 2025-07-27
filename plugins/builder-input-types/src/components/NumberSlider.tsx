import React, { useState, useEffect } from "react";

interface NumberSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  helperText?: string;
}

export const NumberSlider: React.FC<NumberSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  helperText
}) => {
  const [currentValue, setCurrentValue] = useState<number>(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setCurrentValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value) || 0;
    const clampedValue = Math.min(Math.max(newValue, min), max);
    setCurrentValue(clampedValue);
    if (onChange) {
      onChange(clampedValue);
    }
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    appearance: 'none',
    cursor: 'pointer',
    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
    outline: 'none'
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <style>
        {`
          .number-slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .number-slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: none;
          }
        `}
      </style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleSliderChange}
            className="number-slider"
            style={sliderStyle}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleInputChange}
            style={{
              width: '80px',
              padding: '4px 8px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {helperText && (
        <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default NumberSlider;