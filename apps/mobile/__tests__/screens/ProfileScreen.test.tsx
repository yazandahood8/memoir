import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush, back: jest.fn() })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  },
}));

const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (opts: any) => mockUseQuery(opts),
}));

jest.mock('@/lib/api', () => ({
  api: {
    account: {
      profile: jest.fn(),
      export: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue(undefined),
    },
    digests: { list: jest.fn() },
  },
}));

const freeProfile = {
  id: 'u1',
  email: 'user@example.com',
  plan: 'free',
  created_at: '2026-01-01T00:00:00Z',
  stats: { entries: 5, collections: 2 },
};

const premiumProfile = { ...freeProfile, plan: 'premium' };

const sampleDigests = [
  { id: 'd1', type: 'weekly', content: 'Week recap.', period_start: '2026-04-28', period_end: '2026-05-04' },
  { id: 'd2', type: 'monthly', content: 'Month recap.', period_start: '2026-04-01', period_end: '2026-04-30' },
];

function setupQueries(profile: typeof freeProfile | null, digests: typeof sampleDigests | []) {
  mockUseQuery.mockImplementation((opts: any) => {
    if (opts.queryKey[0] === 'account-profile') {
      return { data: profile, isLoading: false };
    }
    if (opts.queryKey[0] === 'digests') {
      return { data: digests, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfileScreen — free user', () => {
  it('shows email and free plan badge', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByText('user@example.com')).toBeTruthy();
    expect(screen.getByText('Free')).toBeTruthy();
  });

  it('shows entry and collection stats', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('shows upgrade button for free user', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByTestId('upgrade-button')).toBeTruthy();
  });

  it('navigates to paywall on upgrade tap', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId('upgrade-button'));
    expect(mockPush).toHaveBeenCalledWith('/paywall');
  });
});

describe('ProfileScreen — premium user', () => {
  it('shows premium badge instead of upgrade button', () => {
    setupQueries(premiumProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByText('✨ Premium')).toBeTruthy();
    expect(screen.queryByTestId('upgrade-button')).toBeNull();
  });
});

describe('ProfileScreen — digests section', () => {
  it('shows empty hint when no digests', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByText(/Weekly digests appear here every Friday/i)).toBeTruthy();
  });

  it('shows latest digest when available', () => {
    setupQueries(freeProfile, sampleDigests);
    render(<ProfileScreen />);
    expect(screen.getByTestId('view-digests-button')).toBeTruthy();
  });

  it('shows "View all" link when more than one digest', () => {
    setupQueries(freeProfile, sampleDigests);
    render(<ProfileScreen />);
    expect(screen.getByText(/View all 2 digests/i)).toBeTruthy();
  });

  it('navigates to digests on tap', () => {
    setupQueries(freeProfile, sampleDigests);
    render(<ProfileScreen />);
    fireEvent.press(screen.getByTestId('view-digests-button'));
    expect(mockPush).toHaveBeenCalledWith('/digests');
  });
});

describe('ProfileScreen — privacy & data', () => {
  it('renders export and delete buttons', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByTestId('export-data-button')).toBeTruthy();
    expect(screen.getByTestId('delete-account-button')).toBeTruthy();
  });

  it('renders sign-out button', () => {
    setupQueries(freeProfile, []);
    render(<ProfileScreen />);
    expect(screen.getByTestId('logout-button')).toBeTruthy();
  });
});

describe('ProfileScreen — loading state', () => {
  it('shows activity indicator while profile loads', () => {
    mockUseQuery.mockImplementation((opts: any) => {
      if (opts.queryKey[0] === 'account-profile') return { data: undefined, isLoading: true };
      return { data: undefined, isLoading: false };
    });
    render(<ProfileScreen />);
    expect(screen.queryByText('user@example.com')).toBeNull();
  });
});
