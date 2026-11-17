import { pickModel } from './chat.js';

export function GET() {
  const { mode, label } = pickModel(false);
  return Response.json({ mode, model: label });
}
