import React from 'react';

export interface HelloWorldProps {
  name?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

export const HelloWorld: React.FC<HelloWorldProps> = ({
  name = 'World',
  variant = 'primary',
  size = 'medium'
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white border-blue-600',
    secondary: 'bg-gray-500 text-white border-gray-600',
    success: 'bg-green-500 text-white border-green-600',
    warning: 'bg-yellow-500 text-black border-yellow-600'
  };

  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <div className={`
      inline-block rounded-lg border-2 font-semibold shadow-md transition-all duration-200 hover:shadow-lg
      ${variantClasses[variant]}
      ${sizeClasses[size]}
    `}>
      Hello, {name}!
    </div>
  );
};