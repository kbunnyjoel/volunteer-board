import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../api/opportunities', () => ({
  fetchOpportunities: vi.fn(),
  submitSignup: vi.fn()
}));

import { fetchOpportunities, submitSignup } from '../api/opportunities';
const mockedFetchOpportunities = vi.mocked(fetchOpportunities);
const mockedSubmitSignup = vi.mocked(submitSignup);
import { VolunteerPage } from '../pages/VolunteerPage';

const mockOpportunities = [
  {
    id: 'op-001',
    title: 'Community Garden Volunteer',
    organization: 'Green Spaces Collective',
    location: 'Austin, TX',
    description: 'Support local garden beds.',
    date: '2024-03-07',
    tags: ['Outdoor'],
    spotsRemaining: 4
  }
];

describe('VolunteerPage', () => {
  beforeEach(() => {
    mockedFetchOpportunities.mockResolvedValue({
      items: mockOpportunities,
      page: 1,
      perPage: 12,
      totalItems: mockOpportunities.length,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    });
    mockedSubmitSignup.mockResolvedValue({
      success: true,
      message: 'Thanks!'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunities and submits signup', async () => {
    const user = userEvent.setup();
    const view = render(<VolunteerPage />);

    await screen.findByText('Community Garden Volunteer');
    expect(mockedFetchOpportunities).toHaveBeenCalledWith({
      page: 1,
      perPage: 12
    });

    await user.click(screen.getByRole('button', { name: /view & apply/i }));

    await user.type(screen.getByLabelText(/your name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/notes/i), 'Excited to help');

    await user.click(screen.getByRole('button', { name: /send my interest/i }));

    await waitFor(() => {
      expect(screen.getByText(/interest recorded/i)).toBeInTheDocument();
    });

    expect(mockedSubmitSignup).toHaveBeenCalledWith({
      opportunityId: 'op-001',
      volunteerName: 'Jane Doe',
      volunteerEmail: 'jane@example.com',
      notes: 'Excited to help'
    });

    view.unmount();
  });
});
