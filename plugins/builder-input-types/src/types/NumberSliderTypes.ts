export interface NumberSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  helperText?: string;
}

export interface NumberSliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  helperText?: string;
}