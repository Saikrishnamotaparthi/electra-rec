import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  ClipboardList,
  FileDown,
  Mail,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard, ChartCard, LoadingSkeleton, EmptyState, StatusBadge } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import {
  computeStats,
  fetchAllForExport,
  listApplications,
} from '@/services/applicationsService';
import type { ApplicationDocument } from '@/types';
import {
  PORTFOLIO_ORDER,
  PORTFOLIO_SHORT_LABELS,
  STATUS_LABELS,
} from '@/constants';
import { formatDateTime } from '@/utils';
import { useAdminProfile } from '@/pages/admin/AdminAuth';

const PORTFOLIO_COLORS = ['#E9A134', '#F5C15C', '#7A9498', '#3D565B', '#D48A22', '#A8BBBE'];
const STATUS_COLORS: Record<string, string> = {
  submitted: '#E9A134',
  reviewed: '#38BDF8',
  shortlisted: '#34D399',
  rejected: '#FB7185',
};

export default function AdminDashboardPage() {
  const { push } = useToast();
  const profile = useAdminProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<ApplicationDocument[]>([]);
  const [recent, setRecent] = useState<ApplicationDocument[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchAllForExport();
      setApps(all);
      const recentPage = await listApplications({ pageSize: 8 });
      setRecent(recentPage.items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load applications from Firestore.';
      setError(message);
      push('error', 'Load failed', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => computeStats(apps), [apps]);

  const portfolioData = useMemo(
    () =>
      PORTFOLIO_ORDER.map((p) => ({
        name: PORTFOLIO_SHORT_LABELS[p],
        value: stats.byPortfolio[p] ?? 0,
      })).filter((d) => d.value > 0),
    [stats],
  );

  const roleData = useMemo(
    () => [
      { name: 'Member', value: stats.byRole.MEMBER ?? 0 },
      { name: 'Co-Lead', value: stats.byRole.CO_LEAD ?? 0 },
    ].filter((d) => d.value > 0),
    [stats],
  );

  const statusData = useMemo(
    () =>
      (Object.keys(stats.byStatus) as Array<keyof typeof stats.byStatus>).map((k) => ({
        name: STATUS_LABELS[k],
        value: stats.byStatus[k],
        key: k,
      })),
    [stats],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={2} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-shimmer rounded-2xl bg-ink-850" />
          ))}
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Could not load dashboard data"
        description={error}
        action={
          <Button type="button" onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Dashboard</h2>
          <p className="mt-1 text-sm text-mist-300">
            Welcome{profile ? `, ${profile.displayName.split(' ')[0]}` : ''}. Live recruitment
            snapshot from Firestore.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/applications">
            <Button type="button" variant="secondary" leftIcon={<ClipboardList className="h-4 w-4" />}>
              Review applications
            </Button>
          </Link>
          <Link to="/admin/exports">
            <Button type="button" variant="outline" leftIcon={<FileDown className="h-4 w-4" />}>
              Export Excel
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applications"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          tone="gold"
          hint="All non-archived submissions"
        />
        <StatCard
          label="Members"
          value={stats.members}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="white"
          hint={`Co-leads: ${stats.coLeads}`}
        />
        <StatCard
          label="Existing members"
          value={stats.existingMembers}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
          hint={`New applicants: ${stats.newApplicants}`}
        />
        <StatCard
          label="Email status"
          value={apps.filter((a) => a.emailStatus === 'sent').length}
          icon={<Mail className="h-5 w-5" />}
          tone="green"
          hint={`Failed: ${apps.filter((a) => a.emailStatus === 'failed').length}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Applications by portfolio" subtitle="Distribution across teams">
          {portfolioData.length === 0 ? (
            <EmptyState title="No data yet" description="Portfolio chart will appear after first submissions." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E4549" />
                <XAxis dataKey="name" tick={{ fill: '#A8BBBE', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#A8BBBE', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#101C1F',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {portfolioData.map((_, i) => (
                    <Cell key={i} fill={PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="By application status" subtitle="Pipeline health">
          {statusData.every((d) => d.value === 0) ? (
            <EmptyState title="No data yet" description="Status chart will appear after first submissions." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#E9A134'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: '#101C1F',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <section className="rounded-2xl border border-white/10 bg-ink-850/70 p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Recent applications</h3>
            <p className="text-sm text-mist-300">Latest submissions from Firestore</p>
          </div>
          <Link to="/admin/applications">
            <Button type="button" variant="ghost" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
              View all
            </Button>
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Applications submitted through /apply will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-mist-400">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Portfolio</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((app) => (
                  <tr key={app.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-gold-300">
                      <Link to={`/admin/applications/${app.id}`} className="hover:underline">
                        {app.applicationId}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-white">{app.personal.fullName}</td>
                    <td className="py-3 pr-4 text-mist-200">
                      {PORTFOLIO_SHORT_LABELS[app.application.portfolio]}
                    </td>
                    <td className="py-3 pr-4 text-mist-200">
                      {app.application.role === 'CO_LEAD' ? 'Co-Lead' : 'Member'}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={app.status} label={STATUS_LABELS[app.status]} />
                    </td>
                    <td className="py-3 text-mist-300">{formatDateTime(app.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {roleData.length > 0 ? (
        <ChartCard title="Role mix" subtitle="Member vs Co-Lead">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E4549" />
              <XAxis dataKey="name" tick={{ fill: '#A8BBBE', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#A8BBBE', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#101C1F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Bar dataKey="value" fill="#E9A134" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </div>
  );
}
