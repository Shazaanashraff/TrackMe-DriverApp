import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PayoutRequestForm from '../PayoutRequestForm';

const baseProps = {
  visible: true,
  earningAmount: 500,
  isSubmitting: false,
  error: null,
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
};

describe('PayoutRequestForm', () => {
  it('shows field errors and does not submit when fields are blank', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<PayoutRequestForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.press(getByText('Submit'));

    expect(getByText('Account number is required')).toBeTruthy();
    expect(getByText('Bank name is required')).toBeTruthy();
    expect(getByText('IFSC code is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed bank account when all fields are filled', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, getByText } = render(<PayoutRequestForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.changeText(getByPlaceholderText('1234567890'), ' 100200300 ');
    fireEvent.changeText(getByPlaceholderText('Bank of Example'), ' Example Bank ');
    fireEvent.changeText(getByPlaceholderText('ABCD0123456'), ' ABCD0123456 ');

    fireEvent.press(getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      accountNumber: '100200300',
      bankName: 'Example Bank',
      ifscCode: 'ABCD0123456',
    });
  });

  it('disables actions and shows a submitting label while isSubmitting', () => {
    const { getByText } = render(<PayoutRequestForm {...baseProps} isSubmitting />);
    expect(getByText('Submitting…')).toBeTruthy();
  });

  it('calls onCancel when Cancel is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(<PayoutRequestForm {...baseProps} onCancel={onCancel} />);
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
