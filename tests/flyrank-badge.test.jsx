import { render, screen } from '@testing-library/react';
import { FlyrankBadge, VERIFY_URL } from '../src/FlyrankBadge.jsx';
import { describe, expect, it } from 'vitest';

describe('FlyRank graduate badge', () => {
  it('links to the public verification page for this credential, in a new tab', () => {
    render(<FlyrankBadge />);
    // FE-10: the name is the visible text (WCAG 2.5.3 label in name), plus a hidden note about the new tab.
    const link = screen.getByRole('link', { name: /^FlyRank AI Internship Verified credential FR-D1-T668H-R789R Verify \(opens the FlyRank verification page in a new tab\)$/i });
    expect(link).toHaveAttribute('href', VERIFY_URL);
    expect(VERIFY_URL).toBe('https://internship.flyrank.ai/verify?id=FR-D1-T668H-R789R&first_name=Ichrak%20Matrouh');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
