import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Paywall } from '@/components/Paywall';

describe('Paywall', () => {
  it('shows upgrade prompt for free users', () => {
    render(<Paywall feature="photos" plan="free" onUpgrade={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText(/Upgrade to Premium/i)).toBeTruthy();
  });

  it('calls onUpgrade when button pressed', () => {
    const onUpgrade = jest.fn();
    render(<Paywall feature="photos" plan="free" onUpgrade={onUpgrade} onDismiss={jest.fn()} />);
    fireEvent.press(screen.getByText(/Start 14-day Free Trial/i));
    expect(onUpgrade).toHaveBeenCalled();
  });

  it('renders nothing for premium users', () => {
    const { toJSON } = render(
      <Paywall feature="photos" plan="premium" onUpgrade={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });
});
