import React from 'react';
import { render } from '@testing-library/react-native';
import InlineError from '../InlineError';

describe('InlineError', () => {
  it('renders nothing when there is no message', () => {
    const { toJSON } = render(<InlineError />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing for an empty string message', () => {
    const { toJSON } = render(<InlineError message="" />);
    expect(toJSON()).toBeNull();
  });

  it('renders the message when present', () => {
    const { getByText } = render(<InlineError message="Email is required" />);
    expect(getByText('Email is required')).toBeTruthy();
  });
});
