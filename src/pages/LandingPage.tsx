import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Cpu, Sparkles, Users } from 'lucide-react';
import { CLUB_NAME, CLUB_TAGLINE, DEPARTMENT, HERO, LOGO_ALT, LOGO_PATH, UNIVERSITY } from '@/constants';
import { cn } from '@/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={LOGO_PATH}
        alt={LOGO_ALT}
        className="h-12 w-12 rounded-full object-contain shadow-gold-sm sm:h-14 sm:w-14"
        width={56}
        height={56}
      />
      <div>
        <p className="font-display text-base font-bold tracking-[0.18em] text-gold-400 sm:text-lg">
          {CLUB_NAME}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mist-200">
          {CLUB_TAGLINE}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 40]);
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0.35]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-ink-900 font-body text-white">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400" aria-label={`${CLUB_NAME} home`}>
            <BrandLockup />
          </Link>
          <Link
            to="/apply"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold-linear px-4 text-sm font-semibold text-ink-900 shadow-gold-sm transition hover:brightness-105"
          >
            Apply Now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero — full viewport */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-hero-radial" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Recruitment {new Date().getFullYear()} · Open Now
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {HERO.headline.split(' ')[0]}{' '}
              <span className="bg-gold-linear bg-clip-text text-transparent">
                TEAM {CLUB_NAME}
              </span>
            </h1>
            <p className="mt-4 text-lg font-medium text-gold-200">{HERO.supporting}</p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mist-200">{HERO.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mist-300">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gold-400" aria-hidden="true" /> {DEPARTMENT}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-gold-400" aria-hidden="true" /> {UNIVERSITY}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/apply"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-linear px-7 text-base font-bold text-ink-900 shadow-glow transition hover:brightness-105 active:scale-[0.98]"
                style={{ height: '52px' }}
              >
                START APPLICATION
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-gold-500/20 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850/80 p-6 shadow-card sm:p-8">
              <img
                src={LOGO_PATH}
                alt={LOGO_ALT}
                className="mx-auto h-40 w-40 rounded-full object-contain shadow-glow sm:h-48 sm:w-48"
                width={192}
                height={192}
              />
              <p className="mt-5 text-center font-display text-2xl font-bold tracking-[0.22em] text-gold-400">
                {CLUB_NAME}
              </p>
              <p className="mt-1 text-center text-sm font-medium uppercase tracking-[0.18em] text-mist-100">
                {CLUB_TAGLINE}
              </p>
              <p className="mt-4 text-center text-xs leading-relaxed text-mist-300">
                {DEPARTMENT}
                <br />
                {UNIVERSITY}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
