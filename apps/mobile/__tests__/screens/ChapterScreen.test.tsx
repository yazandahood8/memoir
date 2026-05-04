import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import ChapterScreen from '@/app/collection/chapter';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'col1', plan: 'free' })),
  useRouter: jest.fn(() => ({ back: jest.fn(), push: jest.fn() })),
}));

jest.mock('@/lib/api', () => ({
  api: {
    chapters: { get: jest.fn(), regenerate: jest.fn() },
  },
}));

jest.mock('@/components/Paywall', () => ({
  Paywall: ({ feature }: { feature: string }) => {
    const mockReact = require('react');
    const { Text } = require('react-native');
    return mockReact.createElement(Text, { testID: 'paywall-modal' }, `paywall:${feature}`);
  },
}));

const { useQuery, useMutation } = require('@tanstack/react-query');
const { useLocalSearchParams } = require('expo-router');

const mockChapter = {
  id: 'chap1',
  content: 'There are moments that resist being named, quiet intersections of time and feeling.',
  generated_at: '2026-05-01T10:00:00Z',
  word_count: 520,
  style: 'warm',
};

function setupMutation(overrides: Record<string, any> = {}) {
  useMutation.mockReturnValue({ mutate: jest.fn(), isPending: false, ...overrides });
}

// ── Loading state ────────────────────────────────────────────────────────────

describe('ChapterScreen — loading state', () => {
  it('shows loading indicator while fetching', () => {
    useQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    setupMutation();

    render(<ChapterScreen />);
    expect(screen.getByText(/Loading your chapter/i)).toBeTruthy();
  });
});

// ── Generating (pending) state ───────────────────────────────────────────────

describe('ChapterScreen — generating state', () => {
  it('shows generating message when chapter is not yet ready', () => {
    useQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('404') });
    setupMutation();

    render(<ChapterScreen />);
    expect(screen.getByText(/Your chapter is being written/i)).toBeTruthy();
    expect(screen.getByText(/Claude is reading your entries/i)).toBeTruthy();
  });

  it('shows back link in generating state', () => {
    useQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('404') });
    setupMutation();

    render(<ChapterScreen />);
    expect(screen.getByText(/Back to collection/i)).toBeTruthy();
  });
});

// ── Chapter ready state ──────────────────────────────────────────────────────

describe('ChapterScreen — chapter ready', () => {
  beforeEach(() => {
    useQuery.mockReturnValue({ data: mockChapter, isLoading: false, error: null });
    setupMutation();
  });

  it('renders chapter prose', () => {
    render(<ChapterScreen />);
    expect(screen.getByText(/quiet intersections of time/i)).toBeTruthy();
  });

  it('shows word count', () => {
    render(<ChapterScreen />);
    expect(screen.getByText(/520/)).toBeTruthy();
  });

  it('renders all three style pills', () => {
    render(<ChapterScreen />);
    expect(screen.getByText('Warm')).toBeTruthy();
    expect(screen.getByText('Formal')).toBeTruthy();
    expect(screen.getByText('Narrative')).toBeTruthy();
  });

  it('shows the share button', () => {
    render(<ChapterScreen />);
    expect(screen.getByText(/Share chapter/i)).toBeTruthy();
  });

  it('shows paywall when free user taps regenerate', async () => {
    useLocalSearchParams.mockReturnValue({ id: 'col1', plan: 'free' });
    render(<ChapterScreen />);

    fireEvent.press(screen.getByTestId('regenerate-button'));
    await waitFor(() => {
      expect(screen.getByTestId('paywall-modal')).toBeTruthy();
    });
  });

  it('does NOT show paywall for premium user on regenerate', () => {
    useLocalSearchParams.mockReturnValue({ id: 'col1', plan: 'premium' });
    render(<ChapterScreen />);

    // Premium user tap triggers Alert (confirm dialog), not the paywall
    fireEvent.press(screen.getByTestId('regenerate-button'));
    expect(screen.queryByTestId('paywall-modal')).toBeNull();
  });

  it('calls Share.share when share button is pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
    render(<ChapterScreen />);

    fireEvent.press(screen.getByText(/Share chapter/i));
    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith({
        message: mockChapter.content,
        title: 'My Memoir Chapter',
      });
    });
    shareSpy.mockRestore();
  });

  it('shows lock icon on regenerate button for free user', () => {
    useLocalSearchParams.mockReturnValue({ id: 'col1', plan: 'free' });
    render(<ChapterScreen />);
    expect(screen.getByText(/🔒/)).toBeTruthy();
  });

  it('hides lock icon on regenerate button for premium user', () => {
    useLocalSearchParams.mockReturnValue({ id: 'col1', plan: 'premium' });
    render(<ChapterScreen />);
    expect(screen.queryByText(/🔒/)).toBeNull();
  });
});
