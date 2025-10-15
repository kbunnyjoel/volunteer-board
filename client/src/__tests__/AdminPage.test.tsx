import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const mockedFetchSignups = vi.hoisted(() => vi.fn());
const mockedFetchOpportunities = vi.hoisted(() => vi.fn());

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn((callback: (event: string, session: any) => void) => {
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    };
  })
}));

vi.mock('../api/signups', () => ({
  fetchSignups: mockedFetchSignups
}));

vi.mock('../api/opportunities', () => ({
  fetchOpportunities: mockedFetchOpportunities
}));

vi.mock('../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: authMock
  }
}));

import { supabaseClient } from '../lib/supabaseClient';
const supabaseAuth = supabaseClient?.auth
  ? (supabaseClient.auth as unknown as typeof authMock)
  : authMock;
const { getSession, signInWithPassword, signOut, onAuthStateChange } = supabaseAuth;

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
    onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }));
    mockedFetchSignups.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 10,
      totalItems: 0,
      totalPages: 0,
      hasMore: false,
      nextPage: null
    });
    mockedFetchOpportunities.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 10,
      totalItems: 0,
      totalPages: 0,
      hasMore: false,
      nextPage: null
    });
  });

  it('shows login form when no session', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const view = render(<AdminPage />);

    await screen.findByText(/sign in to view recent signups/i);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    view.unmount();
  });

  it('loads signups when session exists', async () => {
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockedFetchSignups.mockResolvedValue({
      items: mockSignups,
      page: 1,
      perPage: 10,
      totalItems: mockSignups.length,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    });
    mockedFetchOpportunities.mockResolvedValue({
      items: mockOpportunities,
      page: 1,
      perPage: 10,
      totalItems: mockOpportunities.length,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    });

    const view = render(<AdminPage />);

    await waitFor(() =>
      expect(mockedFetchSignups).toHaveBeenCalledWith('test-token', {
        page: 1,
        perPage: 10
      })
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getAllByText(/community cleanup/i)[0]).toBeInTheDocument();

    view.unmount();
  });

  it('submits credentials when logging in', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    signInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });

    const user = userEvent.setup();
    const view = render(<AdminPage />);

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

    view.unmount();
  });
});
