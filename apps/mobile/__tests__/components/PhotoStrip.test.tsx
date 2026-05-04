import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PhotoStrip } from '@/components/PhotoStrip';

describe('PhotoStrip', () => {
  it('shows the add button when no photos', () => {
    render(<PhotoStrip uris={[]} onRemove={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByTestId('add-photo-button')).toBeTruthy();
  });

  it('shows counter text on the add button', () => {
    render(<PhotoStrip uris={['uri1', 'uri2']} onRemove={jest.fn()} onAdd={jest.fn()} maxPhotos={5} />);
    expect(screen.getByText('2/5')).toBeTruthy();
  });

  it('hides the add button when at max photos', () => {
    const uris = ['u1', 'u2', 'u3'];
    render(<PhotoStrip uris={uris} onRemove={jest.fn()} onAdd={jest.fn()} maxPhotos={3} />);
    expect(screen.queryByTestId('add-photo-button')).toBeNull();
  });

  it('calls onAdd when add button is pressed', () => {
    const onAdd = jest.fn();
    render(<PhotoStrip uris={[]} onRemove={jest.fn()} onAdd={onAdd} />);
    fireEvent.press(screen.getByTestId('add-photo-button'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove with the correct index', () => {
    const onRemove = jest.fn();
    render(<PhotoStrip uris={['u0', 'u1', 'u2']} onRemove={onRemove} onAdd={jest.fn()} />);
    const removeButtons = screen.getAllByText('×');
    fireEvent.press(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('shows a remove button for each photo', () => {
    render(<PhotoStrip uris={['u1', 'u2', 'u3']} onRemove={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getAllByText('×')).toHaveLength(3);
  });

  it('uses default maxPhotos of 5', () => {
    const uris = ['u1', 'u2', 'u3', 'u4', 'u5'];
    render(<PhotoStrip uris={uris} onRemove={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.queryByTestId('add-photo-button')).toBeNull();
  });

  it('still shows add button when one below max', () => {
    const uris = ['u1', 'u2', 'u3', 'u4'];
    render(<PhotoStrip uris={uris} onRemove={jest.fn()} onAdd={jest.fn()} maxPhotos={5} />);
    expect(screen.getByTestId('add-photo-button')).toBeTruthy();
  });
});
