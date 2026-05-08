import { renderHook, act } from '@testing-library/react-native';
import { useSubscription } from '@/hooks/useSubscription';

// All mocks defined inside factories to avoid Jest hoisting issues
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(),
  },
}));

// Access the mocked module after mocks are set up
const { supabase } = require('@/lib/supabase');
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

function makeChain(plan: string | null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: plan ? { plan } : null, error: null }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe('useSubscription', () => {
  it('starts with loading true and plan free', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useSubscription());
    expect(result.current.loading).toBe(true);
    expect(result.current.plan).toBe('free');
    expect(result.current.isPremium).toBe(false);
  });

  it('resolves to free when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useSubscription());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.plan).toBe('free');
    expect(result.current.isPremium).toBe(false);
  });

  it('resolves to free plan from database', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    mockFrom.mockReturnValue(makeChain('free'));

    const { result } = renderHook(() => useSubscription());
    await act(async () => {});

    expect(result.current.plan).toBe('free');
    expect(result.current.isPremium).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('resolves to premium plan from database', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-premium' } } },
    });
    mockFrom.mockReturnValue(makeChain('premium'));

    const { result } = renderHook(() => useSubscription());
    await act(async () => {});

    expect(result.current.plan).toBe('premium');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('defaults to free when user row is missing', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'ghost' } } },
    });
    mockFrom.mockReturnValue(makeChain(null));

    const { result } = renderHook(() => useSubscription());
    await act(async () => {});

    expect(result.current.plan).toBe('free');
    expect(result.current.isPremium).toBe(false);
  });

  it('subscribes to auth state changes', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderHook(() => useSubscription());
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const unsubscribe = jest.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useSubscription());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
