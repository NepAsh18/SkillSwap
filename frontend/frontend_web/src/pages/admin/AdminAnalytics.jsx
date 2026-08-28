import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import useAdminAnalytics from '../../hooks/useAdminAnalytics';

const CHART_COLORS = [
  '#16a34a',
  '#22c55e',
  '#34d399',
  '#14b8a6',
  '#84cc16',
  '#10b981',
];

const AdminAnalytics = () => {
  const {
    analytics,
    isLoading,
    error,
    refetch,
  } = useAdminAnalytics();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (analytics) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4faf6] px-5 sm:px-8 py-8">
        <div className="max-w-[1500px] mx-auto">

          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-4 w-28 bg-emerald-100 rounded-full animate-pulse mb-4" />
            <div className="h-9 w-52 bg-slate-200 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 bg-white border border-emerald-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-3 h-[450px] bg-white border border-emerald-100 rounded-2xl animate-pulse" />
            <div className="xl:col-span-2 h-[450px] bg-white border border-emerald-100 rounded-2xl animate-pulse" />
          </div>

        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center px-6">

        <div className="w-full max-w-md bg-white border border-red-100 rounded-3xl p-8 text-center shadow-sm">

          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
            <span className="text-red-500 text-xl font-bold">
              !
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            Analytics unavailable
          </h2>

          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {error}
          </p>

          <button
            onClick={refetch}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const {
    totalUsers = 0,
    totalBadges = 0,
    totalProficientSkills = 0,
    roleDistribution = [],
    badgeDistribution = [],
    topProficientSkills = [],
    topSkillsToLearn = [],
    badgeLevelDistribution = [],
  } = analytics;

  return (
    <div className="min-h-screen bg-[#f4faf6] text-slate-900">

      {/* Very subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute top-[45%] -left-40 w-80 h-80 rounded-full bg-green-100/30 blur-3xl" />
      </div>

      <div
        className={`relative max-w-[1500px] mx-auto px-5 sm:px-8 py-7 sm:py-9 transition-all duration-700 ${
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3'
        }`}
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">

              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>

              <span className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
                Platform overview
              </span>

            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Analytics
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-xl">
              Understand your community through users, skills,
              badges, and learning activity.
            </p>

          </div>

          <button
            onClick={refetch}
            className="group self-start lg:self-auto inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 rounded-xl text-sm font-medium text-slate-700 transition-all duration-200 shadow-sm hover:shadow"
          >
            <svg
              className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-transform duration-500 group-hover:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M5.6 9A7 7 0 0117.8 6.2L20 9M18.4 15A7 7 0 016.2 17.8L4 15"
              />
            </svg>

            Refresh data
          </button>

        </div>


        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">

          <StatCard
            label="Total users"
            value={totalUsers}
            description="Registered accounts"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                />
              </svg>
            }
          />

          <StatCard
            label="Total badges"
            value={totalBadges}
            description="Achievements earned"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l2.5 5.1 5.5.8-4 4 1 5.5-5-2.6-5 2.6 1-5.5-4-4 5.5-.8L12 3z"
                />
              </svg>
            }
          />

          <StatCard
            label="Unique skills"
            value={totalProficientSkills}
            description="Skills users are proficient in"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"
                />
              </svg>
            }
          />

        </div>


        {/* =====================================================
            FIRST ROW
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mb-5">

          {/* TOP SKILLS */}

          <AnalyticsCard
            title="Top proficient skills"
            subtitle="Skills with the largest user base"
            className="xl:col-span-3"
          >
            <div className="h-[390px]">

              {topProficientSkills.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart
                    data={topProficientSkills}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 10,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      stroke="#edf4ef"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#94a3b8',
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={105}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#475569',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        fill: '#f0fdf4',
                      }}
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dcebe1',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                      }}
                      labelStyle={{
                        color: '#0f172a',
                        fontWeight: 600,
                      }}
                    />

                    <Bar
                      dataKey="count"
                      fill="#16a34a"
                      radius={[0, 7, 7, 0]}
                      barSize={23}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState text="No proficient skill data available." />

              )}

            </div>
          </AnalyticsCard>


          {/* BADGES */}

          <AnalyticsCard
            title="Badge ecosystem"
            subtitle="Distribution across badge tiers"
            className="xl:col-span-2"
          >

            <div className="h-[390px]">

              {badgeDistribution.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={badgeDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="43%"
                      innerRadius={78}
                      outerRadius={122}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >

                      {badgeDistribution.map((entry, index) => (
                        <Cell
                          key={`badge-${index}`}
                          fill={
                            CHART_COLORS[
                              index % CHART_COLORS.length
                            ]
                          }
                        />
                      ))}

                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dcebe1',
                        borderRadius: '12px',
                        boxShadow:
                          '0 10px 30px rgba(15, 23, 42, 0.08)',
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: '12px',
                        color: '#64748b',
                        paddingTop: '10px',
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState text="No badge data available." />

              )}

            </div>

          </AnalyticsCard>

        </div>


        {/* =====================================================
            SECOND ROW
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mb-5">

          {/* LEARNING DEMAND */}

          <AnalyticsCard
            title="Learning demand"
            subtitle="What users want to learn next"
            className="xl:col-span-3"
          >

            <div className="h-[360px]">

              {topSkillsToLearn.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart
                    data={topSkillsToLearn}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 50,
                    }}
                  >

                    <CartesianGrid
                      stroke="#edf4ef"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#64748b',
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#94a3b8',
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        fill: '#ecfdf5',
                      }}
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dcebe1',
                        borderRadius: '12px',
                        boxShadow:
                          '0 10px 30px rgba(15, 23, 42, 0.08)',
                      }}
                    />

                    <Bar
                      dataKey="count"
                      fill="#14b8a6"
                      radius={[7, 7, 0, 0]}
                      barSize={30}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState text="No learning demand data available." />

              )}

            </div>

          </AnalyticsCard>


          {/* ROLE DISTRIBUTION */}

          <AnalyticsCard
            title="Role distribution"
            subtitle="Platform access breakdown"
            className="xl:col-span-2"
          >

            <div className="h-[360px]">

              {roleDistribution.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={roleDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="43%"
                      outerRadius={110}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >

                      {roleDistribution.map((entry, index) => (
                        <Cell
                          key={`role-${index}`}
                          fill={
                            CHART_COLORS[
                              index % CHART_COLORS.length
                            ]
                          }
                        />
                      ))}

                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #dcebe1',
                        borderRadius: '12px',
                        boxShadow:
                          '0 10px 30px rgba(15, 23, 42, 0.08)',
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: '12px',
                        color: '#64748b',
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState text="No role data available." />

              )}

            </div>

          </AnalyticsCard>

        </div>


        {/* =====================================================
            BADGE PROGRESSION
        ====================================================== */}

        <AnalyticsCard
          title="Badge progression"
          subtitle="Distribution of users across badge levels"
          className="w-full"
        >

          <div className="h-[320px]">

            {badgeLevelDistribution.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                <BarChart
                  data={badgeLevelDistribution}
                  margin={{
                    top: 15,
                    right: 15,
                    left: -10,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    stroke="#edf4ef"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#64748b',
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill: '#f0fdf4',
                    }}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #dcebe1',
                      borderRadius: '12px',
                      boxShadow:
                        '0 10px 30px rgba(15, 23, 42, 0.08)',
                    }}
                  />

                  <Bar
                    dataKey="count"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                    barSize={48}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <EmptyState text="No badge progression data available." />

            )}

          </div>

        </AnalyticsCard>

      </div>

    </div>
  );
};


/* ============================================================
   STAT CARD
============================================================ */

const StatCard = ({
  label,
  value,
  description,
  icon,
}) => {
  return (
    <div className="group relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">

      {/* Soft accent */}
      <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100 transition-colors duration-300" />

      <div className="relative">

        <div className="flex items-center justify-between mb-5">

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </span>

          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-300">

            <div className="w-5 h-5">
              {icon}
            </div>

          </div>

        </div>

        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          {Number(value).toLocaleString()}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
};


/* ============================================================
   ANALYTICS CARD
============================================================ */

const AnalyticsCard = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <section
      className={`
        bg-white
        border border-slate-200/80
        rounded-2xl
        shadow-sm
        hover:shadow-md
        transition-shadow
        duration-300
        p-5 sm:p-6
        ${className}
      `}
    >

      <div className="mb-5">

        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>

      </div>

      {children}

    </section>
  );
};


/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({ text }) => {
  return (
    <div className="h-full flex items-center justify-center">

      <div className="text-center">

        <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
          <span className="text-lg">∅</span>
        </div>

        <p className="text-sm text-slate-400">
          {text}
        </p>

      </div>

    </div>
  );
};

export default AdminAnalytics;