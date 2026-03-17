import React from 'react';
import { motion } from 'framer-motion';

function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'rgba(255,255,255,0.07)', ...style }}
    />
  );
}

function CardSkeleton() {
  return (
    <div
      className="p-5 rounded-2xl flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Skeleton className="w-full h-36 rounded-xl" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-5/6 h-3" />
      <Skeleton className="w-1/2 h-3" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="p-6 rounded-2xl flex items-center gap-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Skeleton className="w-16 h-16 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2.5">
        <Skeleton className="w-40 h-4" />
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-4/5 h-3" />
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div
      className="p-6 rounded-2xl flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="w-16 h-8" />
      <Skeleton className="w-24 h-3" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Nav */}
      <div
        className="flex items-center gap-4 p-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <Skeleton className="w-32 h-4" />
        <div className="ml-auto flex gap-3">
          <Skeleton className="w-20 h-7 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
      {/* Body */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 p-4 flex flex-col gap-3" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className={`h-3 ${i === 0 ? 'w-20' : i === 1 ? 'w-16' : i === 2 ? 'w-24' : i === 3 ? 'w-18' : 'w-14'}`} />
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl flex flex-col gap-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Skeleton className="w-12 h-6" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
          </div>
          <Skeleton className="w-full h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4"
          style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        >
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-1/3' : 'w-2/5'}`} />
            <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-2/3' : 'w-1/2'}`} />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

function Section({ title, children, custom = 0 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={custom}
      variants={fadeUp}
      className="mb-12"
    >
      <h2 className="text-white font-bold text-xl mb-5 flex items-center gap-2">
        <div
          className="w-1.5 h-6 rounded-full"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
        />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function SkeletonPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            Design System
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Loading Skeletons</h1>
          <p className="text-white/50 text-lg">
            Animated placeholder skeletons for all UI patterns.
          </p>
        </motion.div>

        {/* Card Skeletons */}
        <Section title="Card Skeletons">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </Section>

        {/* Profile Skeleton */}
        <Section title="Profile Skeleton" custom={1}>
          <div className="max-w-xl">
            <ProfileSkeleton />
          </div>
        </Section>

        {/* Metric Skeletons */}
        <Section title="Metric Skeletons (4 boxes)" custom={2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <MetricSkeleton key={i} />
            ))}
          </div>
        </Section>

        {/* Dashboard Skeleton */}
        <Section title="Dashboard Skeleton" custom={3}>
          <DashboardSkeleton />
        </Section>

        {/* List Skeleton */}
        <Section title="List Skeleton" custom={4}>
          <div className="max-w-xl">
            <ListSkeleton />
          </div>
        </Section>
      </div>
    </div>
  );
}
