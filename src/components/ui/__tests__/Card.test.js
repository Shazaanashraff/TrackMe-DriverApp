import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>Body content</Text>
      </Card>
    );
    expect(getByText('Body content')).toBeTruthy();
  });

  it('renders an optional title above the content', () => {
    const { getByText } = render(
      <Card title="Your vehicle">
        <Text>Body content</Text>
      </Card>
    );
    expect(getByText('Your vehicle')).toBeTruthy();
    expect(getByText('Body content')).toBeTruthy();
  });

  it('renders without a title', () => {
    const { queryByText } = render(
      <Card>
        <Text>Just content</Text>
      </Card>
    );
    expect(queryByText('Just content')).toBeTruthy();
  });
});
