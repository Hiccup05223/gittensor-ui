import React, { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  alpha,
  Button,
  Grid,
  keyframes,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import BoltIcon from '@mui/icons-material/Bolt';
import HubIcon from '@mui/icons-material/Hub';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Page } from '../components/layout';
import { SEO } from '../components';
import { useMonthlyRewards } from '../hooks/useMonthlyRewards';
import { useAllPrs } from '../api/PrsApi';
import { useAllMiners } from '../api/MinerApi';
import { useReposAndWeights } from '../api/DashboardApi';

/* ── Brand green (app's existing merged/success colour) ─────────────── */
const G = '#3fb950';
const G2 = '#7ee787';

/* ── keyframes ───────────────────────────────────────────────────────── */
const tickerScroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

const orbDrift = keyframes`
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(40px, -30px) scale(1.05); }
  66%  { transform: translate(-30px, 40px) scale(0.95); }
  100% { transform: translate(0, 0) scale(1); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ═══════════════════════════════════════════════════════════════════════ */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Typography
    sx={{
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: G,
      fontFamily: '"JetBrains Mono", monospace',
    }}
  >
    {children}
  </Typography>
);

/* ─── Live activity ticker (auto-scrolling marquee) ──────────────────── */
const LiveTicker: React.FC<{
  items: Array<{ repo: string; pr: number; title: string }>;
}> = ({ items }) => {
  if (!items.length) return null;
  // duplicate items for a seamless infinite loop
  const loop = [...items, ...items];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: 1,
        borderBottom: (t) => `1px solid ${t.palette.border.light}`,
        background: alpha('#000', 0.4),
        backdropFilter: 'blur(8px)',
        /* fade edges */
        maskImage:
          'linear-gradient(90deg, transparent 0, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0, black 8%, black 92%, transparent 100%)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{
          width: 'max-content',
          animation: `${tickerScroll} 60s linear infinite`,
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {loop.map((it, i) => (
          <Stack
            key={i}
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ flexShrink: 0, px: 1.5 }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                backgroundColor: G,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.7rem',
                color: G,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              MERGED
            </Typography>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.72rem',
                color: 'text.secondary',
              }}
            >
              {it.repo}#{it.pr}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: 'text.tertiary',
                maxWidth: 380,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {it.title}
            </Typography>
            <Typography sx={{ color: alpha('#fff', 0.18), fontSize: '0.7rem' }}>
              ◆
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════════════════ */

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const monthlyRewards = useMonthlyRewards();
  const { data: prs } = useAllPrs();
  const { data: miners } = useAllMiners();
  const { data: repos } = useReposAndWeights();

  /* ── derived stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const mergedPrs = (prs ?? []).filter((p) => p.mergedAt);
    const totalLines = mergedPrs.reduce(
      (s, p) => s + Number(p.additions || 0) + Number(p.deletions || 0),
      0,
    );
    return {
      mergedCount: mergedPrs.length,
      minerCount: miners?.length ?? 0,
      repoCount: repos?.length ?? 0,
      lineCount: totalLines,
    };
  }, [prs, miners, repos]);

  /* ── live ticker entries (latest 12 merged PRs) ─────────────────── */
  const tickerItems = useMemo(() => {
    if (!prs?.length) return [];
    return [...prs]
      .filter((p) => p.mergedAt)
      .sort(
        (a, b) =>
          new Date(b.mergedAt!).getTime() - new Date(a.mergedAt!).getTime(),
      )
      .slice(0, 12)
      .map((p) => ({
        repo: p.repository,
        pr: p.pullRequestNumber,
        title: p.pullRequestTitle || `PR #${p.pullRequestNumber}`,
      }));
  }, [prs]);

  /* ── recent merged PRs for live feed (latest 6) ─────────────────── */
  const recentMerged = useMemo(() => {
    if (!prs?.length) return [];
    return [...prs]
      .filter((p) => p.mergedAt)
      .sort(
        (a, b) =>
          new Date(b.mergedAt!).getTime() - new Date(a.mergedAt!).getTime(),
      )
      .slice(0, 6);
  }, [prs]);

  return (
    <Page title="Home">
      <SEO
        title="Autonomous Software Development"
        description="The workforce for open source. Compete for rewards by contributing quality code to open source repositories."
        type="website"
      />

      {/* ── 1. LIVE TICKER ─────────────────────────────────────────── */}
      <LiveTicker items={tickerItems} />

      {/* ── 2. HERO ────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100vh - 110px)', md: 'calc(100vh - 64px)' },
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          py: { xs: 7, md: 0 },
          overflow: 'hidden',

          /* fine grid */
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${alpha(G, 0.04)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha(G, 0.04)} 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 60% 50%, black 30%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 60% 50%, black 30%, transparent 100%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* drifting orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '-8%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(G, 0.16)} 0%, transparent 60%)`,
            filter: 'blur(20px)',
            animation: `${orbDrift} 18s ease-in-out infinite`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '20%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(G2, 0.08)} 0%, transparent 60%)`,
            filter: 'blur(20px)',
            animation: `${orbDrift} 22s ease-in-out infinite reverse`,
            pointerEvents: 'none',
          }}
        />

        <Grid
          container
          spacing={{ xs: 5, md: 8 }}
          alignItems="center"
          sx={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1240px',
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* LEFT */}
          <Grid item xs={12} md={7}>
            {/* Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: { xs: 3, md: 4 },
                px: 1.5,
                py: 0.6,
                borderRadius: '8px',
                border: `1px solid ${alpha(G, 0.3)}`,
                background: alpha(G, 0.07),
                animation: `${fadeUp} 0.6s ease-out`,
              }}
            >
              <BoltIcon sx={{ fontSize: '0.85rem', color: G }} />
              <Typography
                sx={{
                  color: G,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                Open Source · Decentralised · Autonomous
              </Typography>
            </Box>

            {/* Logo + headline */}
            <Stack
              direction="row"
              alignItems="center"
              gap={{ xs: 2, sm: 2.5, md: 3 }}
              sx={{
                mb: { xs: 2.5, md: 3 },
                animation: `${fadeUp} 0.7s ease-out 0.05s both`,
              }}
            >
              <Box
                component="img"
                src="/gt-logo.svg"
                alt="Gittensor"
                sx={{
                  height: { xs: '52px', sm: '72px', md: '88px' },
                  width: 'auto',
                  flexShrink: 0,
                  filter: `grayscale(100%) invert(1) drop-shadow(0 0 22px ${alpha(G, 0.55)})`,
                }}
              />
              <Typography
                component="h1"
                fontWeight={700}
                sx={{
                  fontSize: {
                    xs: '2.8rem',
                    sm: '4rem',
                    md: '5rem',
                    lg: '5.6rem',
                  },
                  letterSpacing: '-0.045em',
                  lineHeight: 0.95,
                  background:
                    'linear-gradient(160deg, #ffffff 18%, rgba(255,255,255,0.45) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GITTENSOR
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                color: 'text.primary',
                fontWeight: 500,
                mb: 2,
                maxWidth: '560px',
                lineHeight: 1.4,
                animation: `${fadeUp} 0.7s ease-out 0.1s both`,
              }}
            >
              The workforce for open source.
            </Typography>

            <Typography
              sx={(theme) => ({
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                color: theme.palette.text.tertiary,
                mb: { xs: 4, md: 5 },
                maxWidth: '480px',
                lineHeight: 1.75,
                animation: `${fadeUp} 0.7s ease-out 0.15s both`,
              })}
            >
              A decentralised network where contributors compete to ship quality
              code, discover bugs, and earn rewards from a programmatic emission
              schedule. No middlemen. No gatekeepers. Just merit.
            </Typography>

            {/* CTAs */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1.5, sm: 2 }}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                animation: `${fadeUp} 0.7s ease-out 0.2s both`,
              }}
            >
              <Button
                size="large"
                onClick={() => navigate('/bounties')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: { xs: 0, sm: 4 },
                  py: 1.5,
                  width: { xs: '100%', sm: 'auto' },
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  color: '#000',
                  backgroundColor: G,
                  boxShadow: `0 4px 22px ${alpha(G, 0.4)}`,
                  transition:
                    'transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease',
                  '&:hover': {
                    backgroundColor: '#4ec760',
                    boxShadow: `0 8px 32px ${alpha(G, 0.6)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Start Earning
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/onboard')}
                sx={(theme) => ({
                  px: { xs: 0, sm: 4 },
                  py: 1.5,
                  width: { xs: '100%', sm: 'auto' },
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  borderColor: alpha(theme.palette.text.primary, 0.18),
                  color: 'text.primary',
                  transition:
                    'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.primary, 0.4),
                    background: alpha(theme.palette.text.primary, 0.04),
                    transform: 'translateY(-2px)',
                  },
                })}
              >
                How it works
              </Button>
            </Stack>
          </Grid>

          {/* RIGHT — reward pool + small chart */}
          <Grid item xs={12} md={5}>
            <Stack
              gap={2}
              sx={{ animation: `${fadeUp} 0.8s ease-out 0.15s both` }}
            >
              <Box
                sx={(theme) => ({
                  p: { xs: 3, sm: 3.5 },
                  borderRadius: '20px',
                  border: `1px solid ${alpha(G, 0.32)}`,
                  background: `linear-gradient(145deg, ${alpha(G, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 60%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                  backdropFilter: 'blur(24px)',
                  boxShadow: [
                    `0 0 0 1px ${alpha(G, 0.08)}`,
                    `0 12px 48px ${alpha('#000', 0.55)}`,
                    `0 0 80px ${alpha(G, 0.1)}`,
                  ].join(', '),
                  position: 'relative',
                  overflow: 'hidden',
                })}
              >
                {/* corner spark */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    background: `radial-gradient(circle, ${alpha(G, 0.4)} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                  }}
                />

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2, position: 'relative' }}
                >
                  <SectionLabel>Monthly Reward Pool</SectionLabel>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6,
                      px: 1,
                      py: 0.3,
                      borderRadius: '6px',
                      border: `1px solid ${alpha(G, 0.3)}`,
                      background: alpha(G, 0.08),
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: G,
                        animation: `${orbDrift} 1.6s ease-in-out infinite`,
                      }}
                    />
                    <Typography
                      sx={{
                        color: G,
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontFamily: '"JetBrains Mono", monospace',
                        lineHeight: 1,
                      }}
                    >
                      Live
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.4rem' },
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: 'text.primary',
                    fontFamily: '"JetBrains Mono", monospace',
                    mb: 1.5,
                    position: 'relative',
                  }}
                >
                  {monthlyRewards !== undefined
                    ? `$${monthlyRewards.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`
                    : '—'}
                </Typography>

                <Typography
                  sx={(theme) => ({
                    fontSize: '0.78rem',
                    color: theme.palette.text.tertiary,
                    lineHeight: 1.55,
                    position: 'relative',
                  })}
                >
                  Distributed to contributors via the TAO &amp; Alpha emission
                  schedule.
                </Typography>

                {/* mini sparkline */}
                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2,
                    borderTop: (t) =>
                      `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 0.5,
                    height: 48,
                  }}
                >
                  {[
                    0.3, 0.45, 0.4, 0.55, 0.6, 0.5, 0.7, 0.65, 0.75, 0.7, 0.85,
                    0.9, 0.95, 1,
                  ].map((h, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: `${h * 100}%`,
                        background: `linear-gradient(180deg, ${alpha(G, 0.85)} 0%, ${alpha(G, 0.2)} 100%)`,
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Quick shortcut tile */}
              <Box
                onClick={() => navigate('/dashboard')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
                sx={(theme) => ({
                  p: 2.25,
                  borderRadius: '14px',
                  border: `1px solid ${theme.palette.border.light}`,
                  background: alpha(theme.palette.background.paper, 0.5),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition:
                    'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
                  '&:hover': {
                    borderColor: alpha(G, 0.45),
                    background: alpha(G, 0.04),
                    transform: 'translateY(-2px)',
                    '& .arrow': { transform: 'translate(2px,-2px)' },
                  },
                })}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    border: `1px solid ${alpha(G, 0.3)}`,
                    background: alpha(G, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUpIcon sx={{ color: G, fontSize: '1.1rem' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontWeight={600}
                    sx={{ fontSize: '0.88rem', lineHeight: 1.2 }}
                  >
                    Open the network dashboard
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: 'text.secondary',
                      mt: 0.25,
                    }}
                  >
                    Real-time stats &amp; contributor leaderboard
                  </Typography>
                </Box>
                <ArrowOutwardIcon
                  className="arrow"
                  sx={{
                    color: alpha(G, 0.7),
                    fontSize: '1rem',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ── 3. STATS STRIP ─────────────────────────────────────────── */}
      <Box
        sx={(theme) => ({
          maxWidth: '1240px',
          mx: 'auto',
          width: '100%',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          py: { xs: 4, sm: 5 },
          borderTop: `1px solid ${theme.palette.border.light}`,
          borderBottom: `1px solid ${theme.palette.border.light}`,
        })}
      >
        <Grid container spacing={{ xs: 2, sm: 0 }}>
          {[
            {
              label: 'Merged PRs',
              value: stats.mergedCount,
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: 'Active Miners',
              value: stats.minerCount,
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: 'Repositories',
              value: stats.repoCount,
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: 'Lines Committed',
              value: stats.lineCount,
              format: (v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `${(v / 1_000).toFixed(1)}K`
                    : v.toLocaleString(),
            },
          ].map((s, i) => (
            <Grid
              item
              xs={6}
              sm={3}
              key={s.label}
              sx={{
                px: { xs: 0, sm: 2.5 },
                borderLeft:
                  i === 0
                    ? 'none'
                    : { sm: (t) => `1px solid ${t.palette.border.light}` },
                borderTop: {
                  xs:
                    i >= 2
                      ? (t: any) => `1px solid ${t.palette.border.light}`
                      : 'none',
                  sm: 'none',
                },
                pt: { xs: i >= 2 ? 2 : 0, sm: 0 },
              }}
            >
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontFamily: '"JetBrains Mono", monospace',
                  mb: 1,
                }}
              >
                {s.label}
              </Typography>
              <Typography
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1.7rem', sm: '2rem', md: '2.4rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {s.value > 0 ? s.format(s.value) : '—'}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── 4. HOW IT WORKS — numbered horizontal strips ──────────── */}
      <Box
        sx={{
          maxWidth: '1240px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          pt: { xs: 8, sm: 12 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <SectionLabel>How it works</SectionLabel>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.tertiary' }}>
            03 stages
          </Typography>
        </Stack>

        <Box>
          {[
            {
              title: 'Pick up a bounty',
              description:
                'Browse open issues across active repositories on the network. Each bounty lists scope, reward weight, and active competitors.',
            },
            {
              title: 'Ship quality code',
              description:
                'Submit a pull request to the repository. Validators score your contribution against test signals, code quality, and complexity.',
            },
            {
              title: 'Earn programmatically',
              description:
                'High-scoring merged PRs receive a share of the monthly TAO & Alpha emission. No invoices, no approvals — just merit.',
            },
          ].map((f, i) => (
            <Box
              key={f.title}
              sx={(theme) => ({
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2.5, sm: 4, md: 6 },
                py: { xs: 3, sm: 4 },
                borderTop: `1px solid ${theme.palette.border.light}`,
                transition: 'padding-left 0.2s ease',
                '&:hover': {
                  pl: { sm: 1.5 },
                  '& .feature-arrow': {
                    opacity: 1,
                    transform: 'translateX(0)',
                  },
                  '& .feature-num': { color: G },
                },
              })}
            >
              <Typography
                className="feature-num"
                sx={{
                  color: alpha(G, 0.45),
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  minWidth: { xs: 24, sm: 32 },
                  transition: 'color 0.18s ease',
                  mt: { xs: '3px', sm: 0 },
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Typography
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1rem', sm: '1.2rem', md: '1.35rem' },
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                  flexShrink: 0,
                  width: { xs: 'auto', sm: '210px', md: '260px' },
                }}
              >
                {f.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  flex: 1,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {f.description}
              </Typography>
              <ArrowForwardIcon
                className="feature-arrow"
                sx={{
                  color: G,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  opacity: 0,
                  transform: 'translateX(-6px)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  display: { xs: 'none', sm: 'block' },
                }}
              />
            </Box>
          ))}
          <Box
            sx={(theme) => ({
              borderTop: `1px solid ${theme.palette.border.light}`,
            })}
          />
        </Box>
      </Box>

      {/* ── 5. BENTO GRID FEATURES ──────────────────────────────── */}
      <Box
        sx={{
          maxWidth: '1240px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          pt: { xs: 8, sm: 10 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <SectionLabel>Built for builders</SectionLabel>
        <Typography
          sx={{
            mt: 2,
            mb: 5,
            fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.6rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            maxWidth: '800px',
          }}
        >
          A transparent, on-chain economy for
          <Box component="span" sx={{ color: G }}>
            {' '}
            open-source contributions
          </Box>
          .
        </Typography>

        <Grid container spacing={2}>
          {/* Large card */}
          <Grid item xs={12} md={8}>
            <Box
              sx={(theme) => ({
                position: 'relative',
                p: { xs: 3, sm: 4 },
                height: '100%',
                minHeight: 280,
                borderRadius: '18px',
                border: `1px solid ${alpha(G, 0.25)}`,
                background: `linear-gradient(135deg, ${alpha(G, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                backdropFilter: 'blur(14px)',
                overflow: 'hidden',
                transition: 'border-color 0.25s ease, transform 0.25s ease',
                '&:hover': {
                  borderColor: alpha(G, 0.5),
                  transform: 'translateY(-3px)',
                },
              })}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 220,
                  height: 220,
                  background: `radial-gradient(circle, ${alpha(G, 0.25)} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
              />
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    border: `1px solid ${alpha(G, 0.35)}`,
                    background: alpha(G, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: G, fontSize: '1.3rem' }} />
                </Box>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                    mb: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Programmatic Rewards
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                    maxWidth: 460,
                    lineHeight: 1.65,
                    mb: 3,
                  }}
                >
                  Every merged PR is scored by a network of validators. The
                  monthly emission is split proportionally — measured in TAO,
                  paid in Alpha, redeemable for USD.
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {['TAO', 'Alpha', 'USD', 'Validator-scored'].map((tag) => (
                    <Box
                      key={tag}
                      sx={(theme) => ({
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 999,
                        border: `1px solid ${theme.palette.border.light}`,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.66rem',
                        color: 'text.secondary',
                      })}
                    >
                      {tag}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Grid>

          {/* Tall card */}
          <Grid item xs={12} md={4}>
            <Box
              sx={(theme) => ({
                p: { xs: 3, sm: 3.5 },
                height: '100%',
                minHeight: 280,
                borderRadius: '18px',
                border: `1px solid ${theme.palette.border.light}`,
                background: alpha(theme.palette.background.paper, 0.45),
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.25s ease, transform 0.25s ease',
                '&:hover': {
                  borderColor: alpha(G, 0.4),
                  transform: 'translateY(-3px)',
                },
              })}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(G, 0.3)}`,
                  background: alpha(G, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <VerifiedIcon sx={{ color: G, fontSize: '1.3rem' }} />
              </Box>
              <Typography
                fontWeight={700}
                sx={{ fontSize: '1.15rem', mb: 1, letterSpacing: '-0.01em' }}
              >
                Reputation that compounds
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  lineHeight: 1.65,
                  mb: 3,
                }}
              >
                Credibility scores reward consistency. The longer you ship
                quality work, the more weight your PRs carry.
              </Typography>

              {/* mini progression bars */}
              <Stack gap={1.25} sx={{ mt: 'auto' }}>
                {[
                  { label: 'Excellent', pct: 92, c: G },
                  { label: 'Good', pct: 75, c: G2 },
                  { label: 'Moderate', pct: 55, c: '#facc15' },
                ].map((p) => (
                  <Box key={p.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.4 }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          color: 'text.tertiary',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {p.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          color: p.c,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 700,
                        }}
                      >
                        {p.pct}%
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 4,
                        borderRadius: 999,
                        background: alpha('#fff', 0.05),
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${p.pct}%`,
                          background: `linear-gradient(90deg, ${alpha(p.c, 0.4)}, ${p.c})`,
                          borderRadius: 999,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Three small cards */}
          {[
            {
              icon: <HubIcon sx={{ color: G, fontSize: '1.2rem' }} />,
              title: 'Decentralised network',
              description:
                'Built on Bittensor — no single party controls scoring or distribution.',
            },
            {
              icon: <TrendingUpIcon sx={{ color: G, fontSize: '1.2rem' }} />,
              title: 'Real-time leaderboard',
              description:
                'Track your rank, score, and earnings against every other miner — live.',
            },
            {
              icon: <BoltIcon sx={{ color: G, fontSize: '1.2rem' }} />,
              title: 'Frictionless onboarding',
              description:
                'Connect a GitHub account, point at a bounty, ship code. No KYC.',
            },
          ].map((c) => (
            <Grid item xs={12} sm={4} key={c.title}>
              <Box
                sx={(theme) => ({
                  p: { xs: 2.5, sm: 3 },
                  height: '100%',
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.border.light}`,
                  background: alpha(theme.palette.background.paper, 0.4),
                  backdropFilter: 'blur(10px)',
                  transition:
                    'border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
                  '&:hover': {
                    borderColor: alpha(G, 0.38),
                    transform: 'translateY(-3px)',
                    boxShadow: `0 14px 40px ${alpha('#000', 0.5)}`,
                  },
                })}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    border: `1px solid ${alpha(G, 0.28)}`,
                    background: alpha(G, 0.07),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {c.icon}
                </Box>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: '0.95rem',
                    mb: 0.75,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {c.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    lineHeight: 1.6,
                  }}
                >
                  {c.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── 6. LIVE NETWORK FEED ───────────────────────────────── */}
      <Box
        sx={{
          maxWidth: '1240px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          pt: { xs: 8, sm: 10 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <SectionLabel>Latest activity</SectionLabel>
            <Typography
              sx={{
                mt: 1.5,
                fontSize: { xs: '1.4rem', sm: '1.8rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Live commits from the network
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/dashboard')}
            endIcon={
              <ArrowOutwardIcon sx={{ fontSize: '0.9rem !important' }} />
            }
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: G,
              borderRadius: '8px',
              '&:hover': { background: alpha(G, 0.06) },
            }}
          >
            View dashboard
          </Button>
        </Stack>

        {recentMerged.length === 0 ? (
          <Box
            sx={(theme) => ({
              p: 4,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.border.light}`,
              background: alpha(theme.palette.background.paper, 0.3),
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.85rem',
            })}
          >
            Waiting for activity…
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {recentMerged.map((pr, i) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={`${pr.repository}-${pr.pullRequestNumber}-${i}`}
              >
                <Box
                  onClick={() =>
                    navigate(
                      `/miners/pr?repo=${encodeURIComponent(pr.repository)}&number=${pr.pullRequestNumber}`,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.border.light}`,
                    background: alpha(theme.palette.background.paper, 0.35),
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition:
                      'border-color 0.18s ease, transform 0.18s ease, background 0.18s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: 2,
                      background: G,
                      opacity: 0.6,
                    },
                    '&:hover': {
                      borderColor: alpha(G, 0.35),
                      background: alpha(G, 0.04),
                      transform: 'translateX(4px)',
                    },
                  })}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.75 }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          px: 0.7,
                          py: 0.15,
                          borderRadius: '4px',
                          background: alpha(G, 0.12),
                          border: `1px solid ${alpha(G, 0.3)}`,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: G,
                          letterSpacing: '0.06em',
                        }}
                      >
                        MERGED
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 240,
                        }}
                      >
                        {pr.repository}#{pr.pullRequestNumber}
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.tertiary',
                        flexShrink: 0,
                      }}
                    >
                      {pr.mergedAt
                        ? formatDistanceToNow(new Date(pr.mergedAt), {
                            addSuffix: true,
                          })
                        : '—'}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      color: 'text.primary',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {pr.pullRequestTitle || `PR #${pr.pullRequestNumber}`}
                  </Typography>
                  <Stack direction="row" gap={2} sx={{ mt: 0.5 }}>
                    <Typography
                      sx={{ fontSize: '0.7rem', color: 'text.tertiary' }}
                    >
                      by{' '}
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {pr.author || 'unknown'}
                      </Box>
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: G,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 600,
                      }}
                    >
                      +{Number(pr.additions || 0).toLocaleString()}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: '#ef4444',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 600,
                      }}
                    >
                      −{Number(pr.deletions || 0).toLocaleString()}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── 7. MANIFESTO / QUOTE ──────────────────────────────── */}
      <Box
        sx={{
          maxWidth: '1240px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          pt: { xs: 10, sm: 14 },
          pb: { xs: 10, sm: 14 },
          textAlign: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            height: '60%',
            background: `radial-gradient(ellipse, ${alpha(G, 0.05)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Typography
            sx={{
              fontSize: { xs: '3rem', sm: '4.5rem' },
              color: alpha(G, 0.3),
              fontWeight: 700,
              lineHeight: 1,
              mb: 1,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            ❝
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.6rem', sm: '2.4rem', md: '3rem' },
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              maxWidth: '900px',
              mx: 'auto',
              background:
                'linear-gradient(160deg, #ffffff 25%, rgba(255,255,255,0.55) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Open source has always run on{' '}
            <Box component="span" sx={{ color: G, WebkitTextFillColor: G }}>
              volunteer labour
            </Box>
            .
            <br />
            We think it should run on{' '}
            <Box component="span" sx={{ color: G, WebkitTextFillColor: G }}>
              incentives
            </Box>
            .
          </Typography>

          <Typography
            sx={{
              mt: 5,
              fontSize: '0.78rem',
              fontFamily: '"JetBrains Mono", monospace',
              color: 'text.tertiary',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            — The Gittensor manifesto
          </Typography>
        </Box>
      </Box>

      {/* ── 8. FINAL CTA ─────────────────────────────────────── */}
      <Box
        sx={{
          maxWidth: '1240px',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Box
          sx={(theme) => ({
            position: 'relative',
            p: { xs: 4, sm: 6, md: 8 },
            borderRadius: '24px',
            border: `1px solid ${alpha(G, 0.32)}`,
            background: `linear-gradient(135deg, ${alpha(G, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
            textAlign: 'center',
          })}
        >
          {/* glow */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 100%, ${alpha(G, 0.18)} 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.8rem', sm: '2.6rem', md: '3.2rem' },
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                mb: 2,
              }}
            >
              Start contributing.
              <br />
              <Box component="span" sx={{ color: G }}>
                Start earning.
              </Box>
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                maxWidth: '540px',
                mx: 'auto',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              Pick a bounty, ship code, get paid. The whole loop runs on-chain
              and pays out monthly.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={1.5}
              justifyContent="center"
            >
              <Button
                size="large"
                onClick={() => navigate('/bounties')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  color: '#000',
                  backgroundColor: G,
                  boxShadow: `0 4px 22px ${alpha(G, 0.4)}`,
                  '&:hover': {
                    backgroundColor: '#4ec760',
                    boxShadow: `0 8px 32px ${alpha(G, 0.6)}`,
                  },
                }}
              >
                Browse Bounties
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/repositories')}
                sx={(theme) => ({
                  px: 4,
                  py: 1.5,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRadius: '10px',
                  borderColor: alpha(theme.palette.text.primary, 0.18),
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.primary, 0.4),
                    background: alpha(theme.palette.text.primary, 0.04),
                  },
                })}
              >
                Browse Repositories
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ── 9. FOOTER ───────────────────────────────────────── */}
      <Box
        sx={(theme) => ({
          borderTop: `1px solid ${theme.palette.border.light}`,
          mt: 4,
          py: { xs: 5, sm: 6 },
          px: { xs: 2, sm: 3, md: 5, lg: 7 },
        })}
      >
        <Box sx={{ maxWidth: '1240px', mx: 'auto' }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Stack
                direction="row"
                alignItems="center"
                gap={1.5}
                sx={{ mb: 2 }}
              >
                <Box
                  component="img"
                  src="/gt-logo.svg"
                  alt="Gittensor"
                  sx={{
                    height: '32px',
                    width: 'auto',
                    filter: `grayscale(100%) invert(1) drop-shadow(0 0 8px ${alpha(G, 0.5)})`,
                  }}
                />
                <Typography
                  fontWeight={700}
                  sx={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}
                >
                  GITTENSOR
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  maxWidth: 340,
                }}
              >
                A decentralised network for open-source contributions. Built on
                Bittensor. Powered by merit.
              </Typography>
            </Grid>

            {[
              {
                title: 'Network',
                links: [
                  { label: 'Bounties', path: '/bounties' },
                  { label: 'Repositories', path: '/repositories' },
                  { label: 'Top Miners', path: '/top-miners' },
                  { label: 'Dashboard', path: '/dashboard' },
                ],
              },
              {
                title: 'Discover',
                links: [
                  { label: 'Discoveries', path: '/discoveries' },
                  { label: 'Watchlist', path: '/watchlist' },
                  { label: 'Search', path: '/search' },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'About', path: '/about' },
                  { label: 'FAQ', path: '/faq' },
                  { label: 'Onboarding', path: '/onboard' },
                ],
              },
            ].map((col) => (
              <Grid item xs={6} sm={4} md={2.66} key={col.title}>
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'text.tertiary',
                    mb: 1.75,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {col.title}
                </Typography>
                <Stack gap={1.25}>
                  {col.links.map((l) => (
                    <Typography
                      key={l.label}
                      onClick={() => navigate(l.path)}
                      sx={{
                        fontSize: '0.85rem',
                        color: 'text.secondary',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: G },
                      }}
                    >
                      {l.label}
                    </Typography>
                  ))}
                </Stack>
              </Grid>
            ))}
          </Grid>

          <Box
            sx={(theme) => ({
              mt: 5,
              pt: 3,
              borderTop: `1px solid ${theme.palette.border.light}`,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
            })}
          >
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: 'text.tertiary',
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              © {new Date().getFullYear()} Gittensor · The workforce for open
              source
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: G,
                  animation: `${orbDrift} 1.8s ease-in-out infinite`,
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  color: G,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.1em',
                }}
              >
                NETWORK ONLINE
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default HomePage;
