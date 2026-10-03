import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyState, LoadingSkeleton, StatCard } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { computeStats, fetchAllForExport } from '@/services/applicationsService';
import type { ApplicationDocument } from '@/types';
import {
  ACADEMIC_YEAR_LABELS,
  BRANCH_LABELS,
  PORTFOLIO_ORDER,
  PORTFOLIO_SHORT_LABELS,
  STATUS_LABELS,
} from '@/constants';

const COLORS = ['#E9A134', '#F5C15C', '#7A9498', '#3D565B', '#D48A22', '#A8BBBE'];
const STATUS_COLORS: Record<string, string> = {
  submitted: '#E9A134',
  reviewed: '#38BDF8',
  shortlisted: '#34D399',
  rejected: '#FB7185',
};

const tooltipStyle = {
  background: '#101C1F',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
};

export default function AdminAnalyticsPage() {
  const { push } = useToast();
  const [apps, setApps] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchAllForExport();
      setApps(all);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics data.';
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
      })),
    [stats],
  );

  const yearData = useMemo(
    () =>
      (Object.keys(ACADEMIC_YEAR_LABELS) as Array<keyof typeof ACADEMIC_YEAR_LABELS>).map((k) => ({
        name: ACADEMIC_YEAR_LABELS[k],
        value: stats.byAcademicYear[k] ?? 0,
      })),
    [stats],
  );

  const branchData = useMemo(
    () =>
      (Object.keys(BRANCH_LABELS) as Array<keyof typeof BRANCH_LABELS>)
        .map((k) => ({
          name: BRANCH_LABELS[k],
          value: stats.byBranch[k] ?? 0,
        }))
        .filter((d) => d.value > 0),
    [stats],
  );

  const statusData = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((k) => ({
        name: STATUS_LABELS[k],
        value: stats.byStatus[k],
        key: k,
      })),
    [stats],
  );

  const timelineData = useMemo(
    () => stats.byDate.map((d) => ({ ...d, name: d.date.slice(5) })),
    [stats],
  );

  if (loading) return <LoadingSkeleton rows={8} />;

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Analytics unavailable"
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
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Analytics</h2>
        <p className="mt-1 text-sm text-mist-300">
          Aggregated insights from all current recruitment applications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} tone="gold" />
        <StatCard label="Members" value={stats.members} tone="white" />
        <StatCard label="Co-leads" value={stats.coLeads} tone="blue" />
        <StatCard
          label="Shortlisted"
          value={stats.byStatus.shortlisted ?? 0}
          tone="green"
          hint={`Rejected: ${stats.byStatus.rejected ?? 0}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Portfolio distribution" subtitle="All six G-ELECTRA teams">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E4549" />
              <XAxis dataKey="name" tick={{ fill: '#A8BBBE', fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#A8BBBE', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {portfolioData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Academic year mix" subtitle="Year-wise applicant split">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={yearData} dataKey="value" nameKey="name" outerRadius={90}>
                {yearData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Branch distribution" subtitle="Top branches only shown">
          {branchData.length === 0 ? (
            <EmptyState title="No data" description="Branch chart will appear after submissions." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2E4549" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#A8BBBE', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#A8BBBE', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#E9A134" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Status pipeline" subtitle="submitted → reviewed → shortlisted / rejected">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#E9A134'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Submissions over time" subtitle="Daily application count">
        {timelineData.length === 0 ? (
          <EmptyState title="No timeline yet" description="The line chart appears after first submissions." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E4549" />
              <XAxis dataKey="name" tick={{ fill: '#A8BBBE', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#A8BBBE', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#E9A134" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
