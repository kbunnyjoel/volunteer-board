import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchSignups } from "../api/signups";
import {
  createOpportunity,
  deleteOpportunity,
  fetchOpportunities,
  updateOpportunity
} from "../api/opportunities";
import type {
  Opportunity,
  OpportunityInput,
  SignupRecord
} from "../types";
import { supabaseClient } from "../lib/supabaseClient";

export function AdminPage() {
  const [signups, setSignups] = useState<SignupRecord[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginValues, setLoginValues] = useState({ email: "", password: "" });
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [opportunityFormError, setOpportunityFormError] = useState<string | null>(null);
  const [opportunitySubmitting, setOpportunitySubmitting] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunityFormValues, setOpportunityFormValues] = useState({
    title: "",
    organization: "",
    location: "",
    description: "",
    date: "",
    tags: "",
    spotsRemaining: "1"
  });

  const supabase = supabaseClient;

  const opportunityLookup = useMemo(() => {
    return new Map(opportunities.map((opp) => [opp.id, opp]));
  }, [opportunities]);

  async function loadData(activeSession: Session) {
    if (!supabase) {
      setAuthError(
        "Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = activeSession.access_token;
      const [signupsData, opportunitiesData] = await Promise.all([
        fetchSignups(token),
        fetchOpportunities()
      ]);

      setSignups(signupsData);
      setOpportunities(opportunitiesData);
      setAuthError(null);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && (err as Error & { code?: string }).code === "UNAUTHORIZED") {
        setAuthError("Your admin session has expired. Sign in again.");
        await supabase.auth.signOut();
      } else {
        const message =
          err instanceof Error ? err.message : "Unable to load admin data.";
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setLoading(false);
      setAuthError(
        "Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error(error);
        setAuthError("Failed to fetch session. Sign in again.");
        setLoading(false);
        return;
      }

      if (data.session) {
        setSession(data.session);
        void loadData(data.session);
      } else {
        setLoading(false);
        setAuthError("Sign in to view recent signups.");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setAuthError(null);
          setRefreshing(true);
          void loadData(newSession);
        } else {
          setSignups([]);
          setAuthError("Sign in to view recent signups.");
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleRefresh = () => {
    if (!supabase) {
      setAuthError(
        "Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }
    if (!session) {
      setAuthError("Sign in to refresh signups.");
      return;
    }
    setRefreshing(true);
    void loadData(session);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setAuthError(
        "Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }
    setAuthError(null);
    setLoading(true);
    const { email, password } = loginValues;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Unable to sign in. Try again.";
      setAuthError(message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const openOpportunityModal = (opportunity?: Opportunity) => {
    if (opportunity) {
      setEditingOpportunity(opportunity);
      setOpportunityFormValues({
        title: opportunity.title,
        organization: opportunity.organization,
        location: opportunity.location,
        description: opportunity.description,
        date: opportunity.date.slice(0, 10),
        tags: opportunity.tags.join(", "),
        spotsRemaining: String(opportunity.spotsRemaining)
      });
    } else {
      setEditingOpportunity(null);
      setOpportunityFormValues({
        title: "",
        organization: "",
        location: "",
        description: "",
        date: "",
        tags: "",
        spotsRemaining: "1"
      });
    }
    setOpportunityFormError(null);
    setOpportunityModalOpen(true);
  };

  const closeOpportunityModal = () => {
    setOpportunityModalOpen(false);
    setOpportunitySubmitting(false);
  };

  const handleOpportunityInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setOpportunityFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpportunitySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      setOpportunityFormError("Sign in to manage opportunities.");
      return;
    }

    setOpportunitySubmitting(true);
    setOpportunityFormError(null);

    const payload: OpportunityInput = {
      title: opportunityFormValues.title.trim(),
      organization: opportunityFormValues.organization.trim(),
      location: opportunityFormValues.location.trim(),
      description: opportunityFormValues.description.trim(),
      date: opportunityFormValues.date,
      tags: opportunityFormValues.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      spotsRemaining: Number(opportunityFormValues.spotsRemaining) || 0
    };

    try {
      if (editingOpportunity) {
        await updateOpportunity(session.access_token, editingOpportunity.id, payload);
      } else {
        await createOpportunity(session.access_token, payload);
      }
      await loadData(session);
      closeOpportunityModal();
    } catch (err) {
      console.error(err);
      setOpportunityFormError(
        err instanceof Error ? err.message : "Unable to save opportunity"
      );
    }
    setOpportunitySubmitting(false);
  };

  const handleArchiveOpportunity = async (opportunity: Opportunity) => {
    if (!session) {
      setAuthError("Sign in to manage opportunities.");
      return;
    }
    const confirmed = window.confirm(
      `Archive “${opportunity.title}”? This removes it from the volunteer list.`
    );
    if (!confirmed) return;

    try {
      await deleteOpportunity(session.access_token, opportunity.id);
      await loadData(session);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to archive opportunity");
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-header">
        <div>
          <h1>Recent Signups</h1>
          <p>Monitor incoming volunteer submissions and their status.</p>
        </div>
        <div className="admin-actions">
          {session && (
            <button type="button" className="text-btn" onClick={handleLogout}>
              Log out
            </button>
          )}
          <button
            type="button"
            className="secondary-btn"
            onClick={handleRefresh}
            disabled={refreshing || !session}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {!session ? (
        <form className="admin-login-form" onSubmit={handleLogin}>
          {authError && (
            <p role="alert" className="form-error">
              {authError}
            </p>
          )}
          <label>
            Email
            <input
              type="email"
              value={loginValues.email}
              onChange={(event) =>
                setLoginValues((prev) => ({
                  ...prev,
                  email: event.target.value
                }))
              }
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginValues.password}
              onChange={(event) =>
                setLoginValues((prev) => ({
                  ...prev,
                  password: event.target.value
                }))
              }
              placeholder="••••••••"
              required
            />
          </label>
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
      ) : loading ? (
        <p>Loading signups…</p>
      ) : error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : signups.length === 0 ? (
        <p>No signups recorded yet.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Opportunity</th>
                <th>Contact</th>
                <th>Signed up</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => {
                const opportunity = signup.opportunityId
                  ? opportunityLookup.get(signup.opportunityId)
                  : undefined;

                return (
                  <tr key={signup.id}>
                    <td>
                      <strong>{signup.volunteerName}</strong>
                    </td>
                    <td>
                      {opportunity ? (
                        <>
                          <div>{opportunity.title}</div>
                          <small>
                            {opportunity.organization} ·{" "}
                            {opportunity.location}
                          </small>
                        </>
                      ) : (
                        <em>
                          Opportunity removed
                          {signup.opportunityId
                            ? ` (${signup.opportunityId})`
                            : ""}
                        </em>
                      )}
                    </td>
                    <td>{signup.volunteerEmail}</td>
                    <td>
                      {new Date(signup.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>{signup.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="admin-subpanel">
        <div className="admin-header">
          <div>
            <h2>Manage Opportunities</h2>
            <p>Create, edit, or archive active volunteer opportunities.</p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => openOpportunityModal()}
            disabled={!session}
          >
            New opportunity
          </button>
        </div>

        {opportunities.length === 0 ? (
          <p>No opportunities available. Create one to get started.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organization</th>
                  <th>Date</th>
                  <th>Spots</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td>{opportunity.title}</td>
                    <td>{opportunity.organization}</td>
                    <td>
                      {new Date(opportunity.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td>{opportunity.spotsRemaining}</td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openOpportunityModal(opportunity)}
                        disabled={!session}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleArchiveOpportunity(opportunity)}
                        disabled={!session}
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {opportunityModalOpen && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="drawer admin-drawer">
            <div className="drawer-header">
              <h2>{editingOpportunity ? "Edit opportunity" : "New opportunity"}</h2>
              <button className="drawer-close" onClick={closeOpportunityModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleOpportunitySubmit} className="admin-opportunity-form">
              {opportunityFormError && (
                <p role="alert" className="form-error">
                  {opportunityFormError}
                </p>
              )}
              <label>
                Title
                <input
                  name="title"
                  value={opportunityFormValues.title}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <label>
                Organization
                <input
                  name="organization"
                  value={opportunityFormValues.organization}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <label>
                Location
                <input
                  name="location"
                  value={opportunityFormValues.location}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <label>
                Event date
                <input
                  type="date"
                  name="date"
                  value={opportunityFormValues.date}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  rows={4}
                  value={opportunityFormValues.description}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <label>
                Tags (comma separated)
                <input
                  name="tags"
                  value={opportunityFormValues.tags}
                  onChange={handleOpportunityInputChange}
                />
              </label>
              <label>
                Spots remaining
                <input
                  type="number"
                  min={0}
                  name="spotsRemaining"
                  value={opportunityFormValues.spotsRemaining}
                  onChange={handleOpportunityInputChange}
                  required
                />
              </label>
              <div className="admin-form-actions">
                <button type="button" className="secondary-btn" onClick={closeOpportunityModal}>
                  Cancel
                </button>
                <button className="primary-btn" type="submit" disabled={opportunitySubmitting}>
                  {opportunitySubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
