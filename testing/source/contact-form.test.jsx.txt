// The contact form, used the way a visitor uses it: by label, by role, by what they read.
// /api/contact is mocked, so no email is ever sent.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ContactForm from '../src/ContactForm.jsx';

function mockApi(respond) {
  const fetchMock = vi.fn(async (url, init) => {
    if (url !== '/api/contact') throw new Error(`Unexpected network call in a test: ${url}`);
    return respond(JSON.parse(init.body));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fillIn(user, { name = 'Sam Lee', email = 'sam@example.com', message = 'Loved the agent demo, can we talk?' } = {}) {
  if (name) await user.type(screen.getByLabelText('Name'), name);
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (message) await user.type(screen.getByLabelText('Message'), message);
}

describe('ContactForm', () => {
  test('sends the message and thanks the visitor', async () => {
    const user = userEvent.setup();
    const api = mockApi(() => Response.json({ ok: true }));
    render(<ContactForm fallbackEmail="me@example.com" />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Message sent.');
    expect(api).toHaveBeenCalledOnce();
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual({
      name: 'Sam Lee', email: 'sam@example.com', message: 'Loved the agent demo, can we talk?', company: '',
    });
  });

  test('while sending, the fields and button are locked so it cannot be sent twice', async () => {
    const user = userEvent.setup();
    let finish;
    mockApi(() => new Promise((r) => { finish = () => r(Response.json({ ok: true })); }));
    render(<ContactForm />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Message')).toBeDisabled();
    finish();
    expect(await screen.findByText('Message sent.')).toBeInTheDocument();
  });

  test('server-side validation errors appear next to the right field and are announced with it', async () => {
    const user = userEvent.setup();
    mockApi(() => Response.json({
      ok: false,
      error: 'Please check the highlighted fields.',
      fields: { email: 'That email does not look right.', message: 'Please write at least a sentence (10 characters).' },
    }, { status: 422 }));
    render(<ContactForm />);

    await fillIn(user, { email: 'sam@nowhere', message: 'hi' });
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    const email = screen.getByLabelText('Email');
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription('That email does not look right.');
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Please write at least a sentence (10 characters).');
    expect(screen.getByLabelText('Name')).toBeValid();
    // what they typed is kept
    expect(email).toHaveValue('sam@nowhere');
  });

  test('fixing a field clears its error as soon as the visitor types', async () => {
    const user = userEvent.setup();
    mockApi(() => Response.json({ ok: false, error: 'Please check the highlighted fields.', fields: { name: 'Please add your name.' } }, { status: 422 }));
    render(<ContactForm />);

    await fillIn(user, { name: '' });
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    const name = screen.getByLabelText('Name');
    expect(await screen.findByText('Please add your name.')).toBeInTheDocument();
    expect(name).toBeInvalid();

    await user.type(name, 'S');
    expect(name).toBeValid();
    expect(screen.queryByText('Please add your name.')).not.toBeInTheDocument();
  });

  test('offline: explains what happened, keeps the message, and offers the email fallback', async () => {
    const user = userEvent.setup();
    mockApi(() => { throw new TypeError('Failed to fetch'); });
    render(<ContactForm fallbackEmail="me@example.com" />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('You seem to be offline.');
    expect(within(alert).getByRole('link', { name: 'me@example.com' })).toHaveAttribute('href', 'mailto:me@example.com');
    expect(screen.getByLabelText('Message')).toHaveValue('Loved the agent demo, can we talk?');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  });

  test('after sending, "Send another message" brings back an empty form', async () => {
    const user = userEvent.setup();
    mockApi(() => Response.json({ ok: true }));
    render(<ContactForm />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await user.click(await screen.findByRole('button', { name: 'Send another message' }));

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });
});
