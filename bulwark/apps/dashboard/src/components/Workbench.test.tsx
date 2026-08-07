import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench } from '../components/Workbench.js';
import { App } from '../App.js';
import { SAMPLE_REPORT } from '../testing/sample-report.js';

describe('Workbench', () => {
  it('renders brand, verdict and both overlay images', () => {
    render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    expect(screen.getByText('Bulwark')).toBeInTheDocument();
    expect(screen.getByText('FAIL')).toBeInTheDocument();
    expect(screen.getByAltText('Design export')).toHaveAttribute(
      'src',
      expect.stringContaining('figma-screenshot.png'),
    );
    expect(screen.getByAltText('Live implementation')).toHaveAttribute(
      'src',
      expect.stringContaining('live-screenshot.png'),
    );
  });

  it('lists defects and highlights the selected one', async () => {
    const user = userEvent.setup();
    render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    const list = screen.getByLabelText('Defects');
    const item = within(list).getByRole('button', { name: /Extra vertical space/i });
    await user.click(item);

    expect(screen.getByRole('contentinfo')).toHaveTextContent('error · spacing');
    expect(item).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches into difference blend mode', async () => {
    const user = userEvent.setup();
    render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    await user.click(screen.getByRole('button', { name: /Difference/i }));
    expect(screen.getByAltText('Live implementation')).toHaveStyle({
      mixBlendMode: 'difference',
      opacity: '1',
    });
  });

  it('exposes a curtain seam when curtain mode is active', async () => {
    const user = userEvent.setup();
    const { container } = render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    await user.click(screen.getByRole('button', { name: /Curtain/i }));
    expect(container.querySelector('.curtain-seam')).not.toBeNull();
  });

  it('filters the defect list by severity', async () => {
    const user = userEvent.setup();
    render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    const severity = screen.getByLabelText('Severity');
    await user.selectOptions(severity, 'warning');

    const list = screen.getByLabelText('Defects');
    expect(within(list).queryByText(/Extra vertical space/i)).toBeNull();
    expect(within(list).getByText(/primary button/i)).toBeInTheDocument();
  });

  it('adjusts live opacity with the slider', async () => {
    const user = userEvent.setup();
    const { fireEvent } = await import('@testing-library/react');
    render(<Workbench report={SAMPLE_REPORT} artifactsBase="/artifacts/" />);

    await user.click(screen.getByRole('button', { name: /Opacity/i }));
    const opacitySlider = screen.getByRole('slider', { name: /Live opacity/i });
    fireEvent.change(opacitySlider, { target: { value: '20' } });

    expect(screen.getByAltText('Live implementation')).toHaveStyle({ opacity: '0.2' });
  });
});

describe('App loading', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(SAMPLE_REPORT), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the report and shows the workbench', async () => {
    render(<App />);
    expect(await screen.findByText('Visual QA workbench')).toBeInTheDocument();
    expect(screen.getByText('FAIL')).toBeInTheDocument();
  });

  it('shows a clear error when the report is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('missing', { status: 404 })),
    );
    render(<App />);
    expect(await screen.findByText(/Could not open this run/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
  });
});
