import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../lib/usePlatform', () => ({
  usePlatform: vi.fn(),
}));

vi.mock('../NativeStatsCard', () => ({
  default: vi.fn(() => <div data-testid="native-stats">Native</div>),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
}));

import StatsCard from '../StatsCard';
import { usePlatform } from '../../lib/usePlatform';

function mockPlatform(overrides = {}) {
  usePlatform.mockReturnValue({
    isNative: false,
    isLoading: false,
    ...overrides,
  });
}

const sampleTrends = {
  averageGlucose: 7.2,
  estimatedA1C: 7.5,
  totalEntries: 100,
  inRangeCount: 60,
  borderlineCount: 20,
  highCount: 15,
  lowCount: 5,
};

describe('StatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlatform();
  });

  it('renders loading skeleton when loading', () => {
    mockPlatform({ isLoading: true });
    const { container } = render(<StatsCard trends={null} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('renders native component on native platform', () => {
    mockPlatform({ isNative: true });
    render(<StatsCard trends={sampleTrends} />);
    expect(screen.getByTestId('native-stats')).toBeInTheDocument();
  });

  it('displays average glucose', () => {
    render(<StatsCard trends={sampleTrends} />);
    expect(screen.getByText('7.2 mmol/L')).toBeInTheDocument();
  });

  it('displays dash when average glucose is missing', () => {
    render(<StatsCard trends={{}} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(2);
  });

  it('displays estimated A1C', () => {
    render(<StatsCard trends={sampleTrends} />);
    expect(screen.getByText('7.5%')).toBeInTheDocument();
  });

  it('applies correct A1C color for well-controlled (< 7)', () => {
    render(<StatsCard trends={{ ...sampleTrends, estimatedA1C: 6.5 }} />);
    const el = screen.getByText('6.5%');
    expect(el.className).toContain('emerald');
  });

  it('applies correct A1C color for moderate (7-8)', () => {
    render(<StatsCard trends={{ ...sampleTrends, estimatedA1C: 7.5 }} />);
    const el = screen.getByText('7.5%');
    expect(el.className).toContain('amber');
  });

  it('applies correct A1C color for elevated (> 8)', () => {
    render(<StatsCard trends={{ ...sampleTrends, estimatedA1C: 8.5 }} />);
    const el = screen.getByText('8.5%');
    expect(el.className).toContain('rose');
  });

  it('displays in-range count and percentage', () => {
    render(<StatsCard trends={sampleTrends} />);
    const sixties = screen.getAllByText('60');
    expect(sixties.length).toBe(2);
    expect(screen.getByText('(60%)')).toBeInTheDocument();
  });

  it('displays high count and percentage', () => {
    render(<StatsCard trends={sampleTrends} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('(15%)')).toBeInTheDocument();
  });

  it('displays warning when readings are outside safe range', () => {
    render(<StatsCard trends={sampleTrends} />);
    expect(screen.getByText(/20% of readings outside safe range/)).toBeInTheDocument();
  });

  it('shows all-clear message when all readings are in range', () => {
    render(
      <StatsCard
        trends={{
          averageGlucose: 5.5,
          estimatedA1C: 5.5,
          totalEntries: 10,
          inRangeCount: 10,
          borderlineCount: 0,
          highCount: 0,
          lowCount: 0,
        }}
      />
    );
    expect(screen.getByText(/All readings within safe range/)).toBeInTheDocument();
  });

  it('handles null trends gracefully', () => {
    render(<StatsCard trends={null} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty message when no entries exist', () => {
    render(
      <StatsCard
        trends={{
          totalEntries: 0,
          inRangeCount: 0,
          borderlineCount: 0,
          highCount: 0,
          lowCount: 0,
        }}
      />
    );
    expect(screen.getByText(/No recent entries/)).toBeInTheDocument();
  });
});
