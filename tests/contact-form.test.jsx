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

    expect(screen.getByRole('button', { name: 'Sending…' })).toHaveAttribute('aria-disabled', 'true'); // FE-10: stays focusable
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

    // Valid in the browser, rejected by the server (e.g. a rule only the server knows): the server's errors still land.
    await fillIn(user, { email: 'sam@nowhere.example', message: 'Hello there, hi!' });
    const api = vi.mocked(fetch);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    const email = screen.getByLabelText('Email');
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription('That email does not look right.');
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription('Please write at least a sentence (10 characters).');
    expect(screen.getByLabelText('Name')).toBeValid();
    // what they typed is kept
    expect(email).toHaveValue('sam@nowhere.example');
    expect(api).toHaveBeenCalledOnce();
    expect(email).toHaveFocus();
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

  // Week 9 "Break Your Own Site": found by trying to break the live form.
  test('an empty form is caught in the browser: no request, field errors, focus on the first problem', async () => {
    const user = userEvent.setup();
    const api = mockApi(() => Response.json({ ok: true }));
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(api).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Please add your name.');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Please add your email so I can reply.');
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  test('offline with an empty form: says what to fix, not "you are offline"', async () => {
    const user = userEvent.setup();
    mockApi(() => { throw new TypeError('Failed to fetch'); });
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    expect(screen.getByRole('alert')).not.toHaveTextContent('offline');
  });

  test('spaces only and a broken email are caught before sending', async () => {
    const user = userEvent.setup();
    const api = mockApi(() => Response.json({ ok: true }));
    render(<ContactForm />);

    await fillIn(user, { name: '   ', email: 'a@b', message: '          ' });
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(api).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('That email does not look right.');
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  test('a long message shows a character counter instead of being cut off silently', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByLabelText('Message'));
    await user.paste('a'.repeat(4900));

    expect(screen.getByText('4,900 / 5,000 characters')).toBeInTheDocument();
  });
});
