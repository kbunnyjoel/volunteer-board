import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const mockedFetchSignups = vi.fn();
const mockedFetchOpportunities = vi.fn();

vi.mock('../api/signups', () => ({
  fetchSignups: mockedFetchSignups
}));

vi.mock('../api/opportunities', () => ({
  fetchOpportunities: mockedFetchOpportunities
}));

const authMock = {
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn((callback: (event: string, session: any) => void) => ({
    data: {
      subscription: {
        unsubscribe: vi.fn()
      }
    }
  }))
};

vi.mock('../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: authMock
  }
}));

import { supabaseClient } from '../lib/supabaseClient';
const mockedSupabase = supabaseClient as unknown as { auth: typeof authMock };
const { getSession, signInWithPassword, signOut, onAuthStateChange } = mockedSupabase.auth;

import { AdminPage } from '../pages/AdminPage';

const mockSession = {
  access_token: 'test-token',
  user: { email: 'admin@example.com' }
};

const mockSignups = [
  {
    id: 'sign-1',
    volunteerName: 'Jane Doe',
    volunteerEmail: 'jane@example.com',
    notes: 'Happy to help',
    createdAt: '2024-03-10T00:00:00Z',
    opportunityId: 'op-1'
  }
];

const mockOpportunities = [
  {
    id: 'op-1',
    title: 'Community Cleanup',
    organization: 'City Team',
    location: 'Austin, TX',
    description: '',
    date: '2024-03-12',
    tags: [],
    spotsRemaining: 1
  }
];

describe('AdminPage', () => {
  beforeEach(() => {
    mockedFetchSignups.mockReset();
    mockedFetchOpportunities.mockReset();
    signInWithPassword.mockReset();
    signOut.mockReset();
    getSession.mockReset();
    onAuthStateChange.mockReset();
    mockedFetchSignups.mockResolvedValue([]);
    mockedFetchOpportunities.mockResolvedValue([]);
  });

  it('shows login form when no session', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(<AdminPage />);

    await screen.findByText(/sign in to view recent signups/i);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('loads signups when session exists', async () => {
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockedFetchSignups.mockResolvedValue(mockSignups);
    mockedFetchOpportunities.mockResolvedValue(mockOpportunities);

    render(<AdminPage />);

    await waitFor(() => expect(mockedFetchSignups).toHaveBeenCalledWith('test-token'));

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/community cleanup/i)).toBeInTheDocument();
  });

  it('submits credentials when logging in', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    signInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });

    const user = userEvent.setup();
    render(<AdminPage />);

    await screen.findByText(/sign in to view recent signups/i);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
    });
  });
});
