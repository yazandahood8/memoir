import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EntryCard } from '@/components/EntryCard';
import type { Entry } from '@memoir/shared';

const baseEntry: Entry = {
  id: '1',
  user_id: 'u1',
  input_type: 'voice',
  transcript: 'Had ramen at 8am. Best thing I have eaten in years.',
  emotions: { joy: 0.9, contentment: 0.7 },
  image_urls: [],
  people: [],
  topics: ['food'],
  processed: true,
  created_at: '2026-03-04T08:30:00Z',
};

describe('EntryCard', () => {
  it('renders transcript text', () => {
    render(<EntryCard entry={baseEntry} onPress={jest.fn()} />);
    expect(screen.getByText(/Had ramen at 8am/)).toBeTruthy();
  });

  it('shows voice badge for voice entries', () => {
    render(<EntryCard entry={baseEntry} onPress={jest.fn()} />);
    expect(screen.getByText(/Voice/i)).toBeTruthy();
  });

  it('shows text badge for text entries', () => {
    render(<EntryCard entry={{ ...baseEntry, input_type: 'text' }} onPress={jest.fn()} />);
    expect(screen.getByText(/Text/i)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<EntryCard entry={baseEntry} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('entry-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('shows photo count when images attached', () => {
    render(<EntryCard entry={{ ...baseEntry, image_urls: ['url1', 'url2'] }} onPress={jest.fn()} />);
    expect(screen.getByText('2 photos')).toBeTruthy();
  });

  it('shows processing indicator when not processed', () => {
    render(<EntryCard entry={{ ...baseEntry, processed: false }} onPress={jest.fn()} />);
    expect(screen.getByTestId('processing-indicator')).toBeTruthy();
  });
});
