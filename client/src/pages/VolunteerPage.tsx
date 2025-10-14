import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOpportunities, submitSignup } from "../api/opportunities";
import type { Opportunity, SignupPayload } from "../types";

type ModalState =
  | { status: "closed" }
  | { status: "viewing"; opportunity: Opportunity }
  | { status: "success"; opportunity: Opportunity; message: string };

const initialModalState: ModalState = { status: "closed" };

export function VolunteerPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    volunteerName: "",
    volunteerEmail: "",
    notes: ""
  });

  const [opportunityMeta, setOpportunityMeta] = useState<{
    page: number;
    perPage: number;
    hasMore: boolean;
    nextPage: number | null;
  }>({
    page: 0,
    perPage: 12,
    hasMore: false,
    nextPage: null
  });

  const OPPORTUNITY_PAGE_SIZE = 12;

  const loadOpportunities = useCallback(
    async (page = 1, append = false) => {
      if (page === 1 && !append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await fetchOpportunities({
          page,
          perPage: OPPORTUNITY_PAGE_SIZE
        });
        setOpportunities((prev) =>
          append ? [...prev, ...result.items] : result.items
        );
        setOpportunityMeta({
          page: result.page,
          perPage: result.perPage,
          hasMore: result.hasMore,
          nextPage: result.nextPage
        });
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load opportunities right now.";
        setError(message);
        if (!append) {
          setOpportunities([]);
        }
      } finally {
        if (page === 1 && !append) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  const openOpportunity = (opportunity: Opportunity) => {
    setModalState({ status: "viewing", opportunity });
    setFormError(null);
    setSubmitting(false);
    setFormValues({
      volunteerName: "",
      volunteerEmail: "",
      notes: ""
    });
  };

  const closeModal = () => {
    setModalState(initialModalState);
    setFormError(null);
    setSubmitting(false);
  };

  const visibleOpportunities = useMemo(() => {
    return opportunities.filter((opp) => opp.spotsRemaining > 0);
  }, [opportunities]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modalState.status !== "viewing") return;

    const payload: SignupPayload = {
      opportunityId: modalState.opportunity.id,
      volunteerName: formValues.volunteerName,
      volunteerEmail: formValues.volunteerEmail,
      notes: formValues.notes || undefined
    };

    try {
      setSubmitting(true);
      setFormError(null);
      const response = await submitSignup(payload);
      setModalState({
        status: "success",
        opportunity: modalState.opportunity,
        message: response.message
      });
      await loadOpportunities(1, false);
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Could not submit your interest. Try again soon.";
      setFormError(message);
    }
    setSubmitting(false);
  };

  const handleLoadMoreOpportunities = useCallback(() => {
    if (!opportunityMeta.hasMore || loadingMore) return;
    const nextPage = opportunityMeta.nextPage ?? opportunityMeta.page + 1;
    void loadOpportunities(nextPage, true);
  }, [opportunityMeta, loadingMore, loadOpportunities]);

  return (
    <>
      <header className="app-header">
        <h1>Volunteer Board</h1>
        <p>
          Discover upcoming volunteer opportunities curated by local organizers.
          Click an opportunity to learn more and let the team know you&apos;re
          interested.
        </p>
      </header>

      {loading && <p>Loading opportunities…</p>}
      {error && <p>{error}</p>}

      {!loading && !error && (
        <section className="opportunity-grid">
          {visibleOpportunities.map((opportunity) => (
            <article key={opportunity.id} className="opportunity-card">
              <div>
                <h3>{opportunity.title}</h3>
                <p>{opportunity.organization}</p>
                <p>{opportunity.location}</p>
              </div>

              <p>{opportunity.description}</p>

              <div className="tag-line">
                {opportunity.tags.map((tag) => (
                  <span key={`${opportunity.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="card-footer">
                <span>
                  {new Date(opportunity.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                  })}
                </span>
                <span>{opportunity.spotsRemaining} spots left</span>
                <button
                  className="primary-btn"
                  onClick={() => openOpportunity(opportunity)}
                >
                  View & Apply
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && opportunityMeta.hasMore && (
        <div className="load-more-row">
          <button
            className="secondary-btn"
            type="button"
            onClick={handleLoadMoreOpportunities}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more…" : "Load more opportunities"}
          </button>
        </div>
      )}

      {modalState.status !== "closed" && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="drawer">
            <div className="drawer-header">
              <h2>
                {modalState.opportunity.title} ·{" "}
                {modalState.opportunity.organization}
              </h2>
              <button className="drawer-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <p>{modalState.opportunity.description}</p>

            <section>
              <strong>Location:</strong> {modalState.opportunity.location}
            </section>
            <section>
              <strong>Event date:</strong>{" "}
              {new Date(modalState.opportunity.date).toLocaleString()}
            </section>

            {modalState.status === "success" ? (
              <div className="success-banner">
                <strong>Interest recorded.</strong>
                <p>{modalState.message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {formError && (
                  <p role="alert" className="form-error">
                    {formError}
                  </p>
                )}
                <label>
                  Your name
                  <input
                    required
                    name="volunteerName"
                    value={formValues.volunteerName}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    name="volunteerEmail"
                    value={formValues.volunteerEmail}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Notes (optional)
                  <textarea
                    name="notes"
                    rows={3}
                    value={formValues.notes}
                    onChange={handleChange}
                  />
                </label>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send my interest"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
