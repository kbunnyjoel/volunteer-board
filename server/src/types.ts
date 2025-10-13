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

export type SignupPayload = {
  opportunityId: string;
  volunteerName: string;
  volunteerEmail: string;
  notes?: string;
};

export type CreateOpportunityPayload = Omit<Opportunity, "id">;

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;
