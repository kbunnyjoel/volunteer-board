export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  location: string;
  description: string;
  date: string;
  tags: string[];
  spotsRemaining: number;
};

export type OpportunityInput = {
  title: string;
  organization: string;
  location: string;
  description: string;
  date: string;
  tags: string[];
  spotsRemaining: number;
};

export type OpportunityUpdateInput = Partial<OpportunityInput>;

export type SignupPayload = {
  opportunityId: string;
  volunteerName: string;
  volunteerEmail: string;
  notes?: string;
};

export type SignupResponse = {
  success: boolean;
  message: string;
};

export type SignupRecord = {
  id: string;
  volunteerName: string;
  volunteerEmail: string;
  notes?: string;
  createdAt: string;
  opportunityId: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  nextPage: number | null;
};
