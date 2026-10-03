import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { EmptyState, LoadingSkeleton, StatusBadge, Badge } from '@/components/ui/Misc';
import { useToast } from '@/components/shared/Toast';
import { listApplications } from '@/services/applicationsService';
import type {
  ApplicationDocument,
  ApplicationStatus,
  Portfolio,
  Role,
} from '@/types';
import {
  ACADEMIC_YEAR_LABELS,
  BRANCH_LABELS,
  PORTFOLIO_ORDER,
  PORTFOLIO_SHORT_LABELS,
  STATUS_LABELS,
} from '@/constants';
import { formatDateTime, truncate } from '@/utils';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type FilterKey = 'search' | 'portfolio' | 'role' | 'status' | 'academicYear' | 'branch';

const EMPTY_FILTERS: Record<FilterKey, string> = {
  search: '',
  portfolio: 'ALL',
  role: 'ALL',
  status: 'ALL',
  academicYear: 'ALL',
  branch: 'ALL',
};

export default function AdminApplicationsPage() {
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<Record<FilterKey, string>>(() => {
    return {
      search: searchParams.get('search') ?? '',
      portfolio: searchParams.get('portfolio') ?? 'ALL',
      role: searchParams.get('role') ?? 'ALL',
      status: searchParams.get('status') ?? 'ALL',
      academicYear: searchParams.get('academicYear') ?? 'ALL',
      branch: searchParams.get('branch') ?? 'ALL',
    };
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [items, setItems] = useState<ApplicationDocument[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = useCallback(
    (key: FilterKey, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === 'ALL') next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadPage = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listApplications({
          search: reset ? filters.search : undefined,
          portfolio: filters.portfolio as Portfolio | 'ALL',
          role: filters.role as Role | 'ALL',
          status: filters.status as ApplicationStatus | 'ALL',
          academicYear: filters.academicYear === 'ALL' ? undefined : filters.academicYear,
          branch: filters.branch === 'ALL' ? undefined : filters.branch,
          pageSize: 20,
          cursor: reset ? null : cursor,
        });
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
        setCursor(result.nextCursor);
        setHasMore(Boolean(result.nextCursor));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load applications from Firestore.';
        setError(message);
        push('error', 'Load failed', message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.search, filters.portfolio, filters.role, filters.status, filters.academicYear, filters.branch, cursor, refreshKey],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (filters.search !== searchInput) {
        updateFilter('search', searchInput);
        setRefreshKey((k) => k + 1);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters.search, updateFilter]);

  useEffect(() => {
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filters.portfolio, filters.role, filters.status, filters.academicYear, filters.branch]);

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(filters) as FilterKey[]).filter((k) => {
        const v = filters[k];
        return k === 'search' ? Boolean(v.trim()) : v !== 'ALL';
      }).length,
    [filters],
  );

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Applications</h2>
          <p className="mt-1 text-sm text-mist-300">
            Search, filter and review recruitment submissions stored in Firestore.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          leftIcon={<RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-850/70 p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, registration number, email, phone, application ID…"
              className="field-input pl-10"
              aria-label="Search applications"
            />
          </div>
          <Button
            type="button"
            variant={showFilters ? 'primary' : 'secondary'}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            <Select
              id="f-portfolio"
              label="Portfolio"
              value={filters.portfolio}
              onChange={(e) => {
                updateFilter('portfolio', e.target.value);
                setRefreshKey((k) => k + 1);
              }}
            >
              <option value="ALL">All portfolios</option>
              {PORTFOLIO_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PORTFOLIO_SHORT_LABELS[p]}
                </option>
              ))}
            </Select>
            <Select
              id="f-role"
              label="Role"
              value={filters.role}
              onChange={(e) => {
                updateFilter('role', e.target.value);
                setRefreshKey((k) => k + 1);
              }}
            >
              <option value="ALL">All roles</option>
              <option value="MEMBER">Member</option>
              <option value="CO_LEAD">Co-Lead</option>
            </Select>
            <Select
              id="f-status"
              label="Status"
              value={filters.status}
              onChange={(e) => {
                updateFilter('status', e.target.value);
                setRefreshKey((k) => k + 1);
              }}
            >
              <option value="ALL">All statuses</option>
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Select
              id="f-year"
              label="Academic year"
              value={filters.academicYear}
              onChange={(e) => {
                updateFilter('academicYear', e.target.value);
                setRefreshKey((k) => k + 1);
              }}
            >
              <option value="ALL">All years</option>
              {Object.entries(ACADEMIC_YEAR_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Select
              id="f-branch"
              label="Branch"
              value={filters.branch}
              onChange={(e) => {
                updateFilter('branch', e.target.value);
                setRefreshKey((k) => k + 1);
              }}
            >
              <option value="ALL">All branches</option>
              {Object.entries(BRANCH_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                leftIcon={<X className="h-4 w-4" />}
              >
                Clear all
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {error && !loading ? (
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="Could not load applications"
          description={error}
          action={
            <Button type="button" onClick={() => setRefreshKey((k) => k + 1)}>
              Retry
            </Button>
          }
        />
      ) : loading && items.length === 0 ? (
        <LoadingSkeleton rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No applications found"
          description="Adjust filters or wait for submissions through the public /apply form."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-850/70 shadow-card">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-ink-800/40 text-[11px] uppercase tracking-[0.12em] text-mist-400">
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Portfolio</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Year / Branch</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {items.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03] last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gold-300">{app.applicationId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{truncate(app.personal.fullName, 28)}</p>
                    <p className="text-xs text-mist-400">{app.personal.registrationNumber}</p>
                    <p className="text-xs text-mist-400">{app.personal.email}</p>
                  </td>
                  <td className="px-4 py-3 text-mist-200">
                    {PORTFOLIO_SHORT_LABELS[app.application.portfolio]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-white/5 text-mist-100 ring-white/10">
                      {app.application.role === 'CO_LEAD' ? 'Co-Lead' : 'Member'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-mist-300">
                    <p>{ACADEMIC_YEAR_LABELS[app.personal.academicYear]}</p>
                    <p className="text-xs text-mist-400">
                      {BRANCH_LABELS[app.personal.branch] ?? app.personal.branch}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} label={STATUS_LABELS[app.status]} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={app.emailStatus}
                      label={app.emailStatus.charAt(0).toUpperCase() + app.emailStatus.slice(1)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-mist-300">{formatDateTime(app.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500/15 px-2.5 py-1.5 text-xs font-semibold text-gold-200 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !loading && items.length > 0 ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadPage(false)}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Load more
          </Button>
        </div>
      ) : null}

      {!hasMore && items.length > 0 ? (
        <p className="text-center text-xs text-mist-500">
          Showing all loaded applications ({items.length}). Use Refresh for the latest data.
        </p>
      ) : null}

      {loading && items.length > 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-mist-300">
          <RefreshCw className="h-4 w-4 animate-spin text-gold-400" />
          Loading…
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs text-mist-500">
        <span>
          <ChevronLeft className="mr-1 inline h-3 w-3" aria-hidden="true" />
          Firestore query · 20 per page · client-side search across loaded page
        </span>
      </div>
    </div>
  );
}
