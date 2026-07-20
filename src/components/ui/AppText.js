import React from 'react';
import { Text } from 'react-native';
import { theme } from '../../theme';

const WEIGHT_BY_VARIANT = {
  display: 'medium',
  h1: 'medium',
  h2: 'medium',
  body: 'regular',
  label: 'regular',
  caption: 'regular',
  overline: 'medium',
};

const AppText = ({ variant = 'body', weight, onInk = false, color, style, children, ...rest }) => {
  const resolvedWeight = weight || WEIGHT_BY_VARIANT[variant] || 'regular';
  const resolvedColor = color ?? (onInk ? theme.color.white : theme.color.text.primary);
  const overlineStyle = variant === 'overline'
    ? { textTransform: 'uppercase', letterSpacing: 1.5 }
    : null;

  return (
    <Text
      style={[theme.textStyle(variant, { weight: resolvedWeight }), { color: resolvedColor }, overlineStyle, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default AppText;
