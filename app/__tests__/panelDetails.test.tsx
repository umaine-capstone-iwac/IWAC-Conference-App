import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PanelDetail from '@/app/panelDetails';
import { supabase } from '@/lib/supabase';

// Mock Supabase so no real network requests are made
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

// Mock ThemedText with a real Text component so getByText can find its content
jest.mock('@/components/themedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});
// Mock ThemedView with a real View component
jest.mock('@/components/themedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
  };
});
// Mock Input with a real TextInput so the component can render
jest.mock('@/components/input', () => {
  const { TextInput } = require('react-native');
  return {
    Input: ({ value, onChangeText, ...props }: any) => (
      <TextInput value={value} onChangeText={onChangeText} {...props} />
    ),
  };
});
jest.mock('@/components/profilePicture', () => ({
  ProfilePicture: () => null,
}));
jest.mock('@/components/ui/icon-symbol', () => ({ IconSymbol: () => null }));

// Sample panel used across all tests
const mockPanel = {
  id: 1,
  title: 'AI in Aviation',
  location: 'Hall A',
  speaker: 'Jane Doe',
  date: 'Day 1',
  session: 'Monday 9:00–10:00 AM',
  tag: 'Technology',
  abstract: null,
  materials_title: null,
  materials_link: null,
};

// Builds a chainable Supabase query mock that resolves to { data, error }
const makeChain = (data: any, error: any = null) => {
  const chain: any = {};
  ['select', 'eq', 'in', 'order', 'insert', 'delete'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) => resolve({ data, error });
  return chain;
};

// Reset mocks between tests to avoid bleed-over
beforeEach(() => jest.clearAllMocks());

// Checks that the empty state message appears when Supabase returns no comments
test('shows empty state when there are no comments', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain([]));
  const { getByText } = render(
    <PanelDetail panel={mockPanel} userID="u1" onBack={jest.fn()} />,
  );
  await waitFor(() => expect(getByText('No comments yet')).toBeTruthy(), {
    timeout: 10000,
  });
});

// Checks that the Post button cannot be pressed before the user has typed anything
test('disables Post button when input is empty', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain([]));
  const { getByText } = render(
    <PanelDetail panel={mockPanel} userID="u1" onBack={jest.fn()} />,
  );
  await waitFor(
    () => {
      const btn = getByText('Post').parent?.parent;
      expect(btn?.props.accessibilityState?.disabled).toBeTruthy();
    },
    { timeout: 10000 },
  );
}, 15000);

// Checks that pressing the back button fires the onBack callback exactly once
test('calls onBack when back button is pressed', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain([]));
  const onBack = jest.fn();
  const { getByText } = render(
    <PanelDetail panel={mockPanel} userID="u1" onBack={onBack} />,
  );
  fireEvent.press(getByText('← Back'));
  expect(onBack).toHaveBeenCalledTimes(1);
});
