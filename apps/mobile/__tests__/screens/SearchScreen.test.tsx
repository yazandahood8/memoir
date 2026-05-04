import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SearchScreen from '@/app/(tabs)/search';

jest.mock('@/lib/api', () => ({
  api: {
    search: { query: jest.fn() },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('@/components/Paywall', () => ({
  Paywall: ({ feature }: { feature: string }) => {
    const mockReact = require('react');
    const { Text } = require('react-native');
    return mockReact.createElement(Text, { testID: 'paywall-modal' }, `paywall:${feature}`);
  },
}));

const { api } = require('@/lib/api');

describe('SearchScreen — initial state', () => {
  it('shows empty hint before searching', () => {
    render(<SearchScreen />);
    expect(screen.getByText(/Search your memories/i)).toBeTruthy();
    expect(screen.getByText(/natural language/i)).toBeTruthy();
  });

  it('renders the search input and Go button', () => {
    render(<SearchScreen />);
    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByText('Go')).toBeTruthy();
  });
});

describe('SearchScreen — free user', () => {
  it('shows paywall when search returns premium error', async () => {
    api.search.query.mockRejectedValueOnce(new Error('Semantic search requires Premium'));
    render(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'tokyo ramen');
    fireEvent.press(screen.getByText('Go'));

    await waitFor(() => {
      expect(screen.getByTestId('paywall-modal')).toBeTruthy();
    });
  });
});

describe('SearchScreen — premium user with results', () => {
  it('shows results after successful search', async () => {
    api.search.query.mockResolvedValueOnce({
      results: [
        {
          id: 'e1', input_type: 'text', transcript: 'Had ramen at 8am.',
          emotions: { joy: 0.9 }, image_urls: [], people: [], topics: ['food'],
          processed: true, created_at: '2026-05-01T08:00:00Z', user_id: 'u1',
          similarity: 0.92,
        },
      ],
    });

    render(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'best ramen');
    fireEvent.press(screen.getByText('Go'));

    await waitFor(() => {
      expect(screen.getByText(/Had ramen at 8am/i)).toBeTruthy();
    });
  });

  it('shows no results message when search returns empty', async () => {
    api.search.query.mockResolvedValueOnce({ results: [] });

    render(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'something obscure');
    fireEvent.press(screen.getByText('Go'));

    await waitFor(() => {
      expect(screen.getByText(/No memories found/i)).toBeTruthy();
    });
  });
});
