import React from 'react';
import { render } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders without crashing', () => {
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});