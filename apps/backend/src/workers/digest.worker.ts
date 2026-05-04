import { Worker } from 'bullmq';
import { Resend } from 'resend';
import { connection } from '../lib/queue.js';
import { supabase } from '../lib/supabase.js';
import { writeDigest } from '../services/claude.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const digestWorker = new Worker(
  'digest',
  async (job) => {
    if (job.name === 'weekly-digest') {
      await runWeeklyDigests();
    } else if (job.name === 'monthly-digest') {
      await runMonthlyDigests();
    }
  },
  { connection }
);

async function runWeeklyDigests() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: users } = await supabase.from('users').select('id, email');
  if (!users) return;

  for (const user of users) {
    const { data: entries } = await supabase
      .from('entries')
      .select('transcript, created_at')
      .eq('user_id', user.id)
      .eq('processed', true)
      .gte('created_at', weekAgo);

    if (!entries || entries.length === 0) continue;

    const transcripts = entries.map((e) => `[${e.created_at}] ${e.transcript}`);
    const now = new Date();
    const period = `${new Date(weekAgo).toDateString()} – ${now.toDateString()}`;
    const content = await writeDigest(transcripts, period);

    await supabase.from('digests').insert({
      user_id: user.id,
      type: 'weekly',
      content,
      period_start: weekAgo,
      period_end: now.toISOString(),
    });

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Memoir <digest@getmemoir.com>',
        to: user.email,
        subject: 'Your weekly memoir digest',
        html: `<p>${content.replace(/\n/g, '<br>')}</p>`,
      });
    } else {
      console.log(`[digest] weekly digest saved for ${user.email} (email skipped — no RESEND_API_KEY)`);
    }
  }
}

async function runMonthlyDigests() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: premiumUsers } = await supabase
    .from('users')
    .select('id, email')
    .eq('plan', 'premium');

  if (!premiumUsers) return;

  for (const user of premiumUsers) {
    const { data: entries } = await supabase
      .from('entries')
      .select('transcript, created_at')
      .eq('user_id', user.id)
      .eq('processed', true)
      .gte('created_at', monthAgo);

    if (!entries || entries.length === 0) continue;

    const transcripts = entries.map((e) => `[${e.created_at}] ${e.transcript}`);
    const now = new Date();
    const period = `${new Date(monthAgo).toDateString()} – ${now.toDateString()}`;
    const content = await writeDigest(transcripts, period);

    await supabase.from('digests').insert({
      user_id: user.id,
      type: 'monthly',
      content,
      period_start: monthAgo,
      period_end: now.toISOString(),
    });

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Memoir <digest@getmemoir.com>',
        to: user.email,
        subject: 'Your monthly memoir digest',
        html: `<p>${content.replace(/\n/g, '<br>')}</p>`,
      });
    } else {
      console.log(`[digest] monthly digest saved for ${user.email} (email skipped — no RESEND_API_KEY)`);
    }
  }
}
