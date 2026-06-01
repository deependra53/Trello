import { Types } from 'mongoose';
import { Template } from '../models/template.model.js';
import { Board } from '../models/board.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { Label } from '../models/label.model.js';
import { NotFound } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

type SeedChecklistItem = { text: string; completed?: boolean };
type SeedChecklist = { title: string; items: SeedChecklistItem[] };
type SeedCard = {
  title: string;
  description?: string;
  labels?: string[];
  checklists?: SeedChecklist[];
};
type SeedList = { title: string; cards?: SeedCard[] };
type SeedLabel = { name: string; color: string };
type SeedStructure = { labels?: SeedLabel[]; lists: SeedList[] };

type DefaultTemplate = {
  name: string;
  description: string;
  category: string;
  background: { type: 'color' | 'gradient'; value: string };
  structure: SeedStructure;
  isPublic: boolean;
};

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Sprint Board',
    description: 'Plan, ship, and review a two-week engineering sprint.',
    category: 'engineering',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#795DFF,#9B7BFF)' },
    structure: {
      labels: [
        { name: 'Bug', color: '#EB5A46' },
        { name: 'Feature', color: '#61BD4F' },
        { name: 'Tech Debt', color: '#F2D600' },
        { name: 'High Priority', color: '#FF78CB' },
        { name: 'Design', color: '#00C2E0' },
      ],
      lists: [
        {
          title: 'Backlog',
          cards: [
            {
              title: 'How to use this board',
              description:
                'This Sprint Board template helps your team plan, execute, and ship work in two-week sprints.\n\n**Columns**\n- **Backlog** — refined tickets waiting to be scheduled.\n- **This Sprint** — committed scope for the active sprint.\n- **In Progress** — actively being built.\n- **In Review** — open PR, awaiting code review or QA.\n- **Done** — merged and deployed.\n\n**Labels** indicate work type (Bug / Feature / Tech Debt / Design) and urgency.\n\nDuplicate the "Ticket template" card whenever you create new work so every story has a consistent shape.',
            },
            {
              title: 'Ticket template — duplicate me',
              description:
                '## Context\n_Why does this work matter? Link the user problem or business goal._\n\n## Scope\n_What is in / out of scope?_\n\n## Acceptance Criteria\n- [ ] \n- [ ] \n- [ ] \n\n## Notes\n_Links to designs, RFC, related tickets._',
              labels: ['Feature'],
              checklists: [
                {
                  title: 'Definition of Ready',
                  items: [
                    { text: 'Acceptance criteria written' },
                    { text: 'Designs linked (if UI)' },
                    { text: 'Effort estimated' },
                    { text: 'Dependencies identified' },
                  ],
                },
              ],
            },
            {
              title: 'Add empty-state illustrations to dashboard',
              description: 'Designs are in the Figma file linked in #design-handoff.',
              labels: ['Feature', 'Design'],
            },
            {
              title: 'Investigate flaky e2e: checkout.spec.ts',
              description: 'Fails ~1 in 5 runs on CI. Probably a race on the cart hydration.',
              labels: ['Bug', 'Tech Debt'],
            },
            {
              title: 'Migrate auth middleware to v2 token format',
              labels: ['Tech Debt', 'High Priority'],
            },
          ],
        },
        {
          title: 'This Sprint',
          cards: [
            {
              title: 'Sprint kickoff — set goals',
              description:
                '**Sprint goal:** _One sentence that describes the outcome we want by the end of the sprint._\n\n**Capacity:** _Account for PTO, on-call, and meetings._',
              checklists: [
                {
                  title: 'Kickoff agenda',
                  items: [
                    { text: 'Review sprint goal' },
                    { text: 'Walk through committed tickets' },
                    { text: 'Confirm capacity & on-call rotation' },
                    { text: 'Identify risks and dependencies' },
                  ],
                },
              ],
            },
            {
              title: 'Add CSV export to the reports page',
              description: 'Spec: /docs/reports-export.md',
              labels: ['Feature'],
              checklists: [
                {
                  title: 'Acceptance Criteria',
                  items: [
                    { text: 'Export button shows on Reports page' },
                    { text: 'CSV matches the column order in the spec' },
                    { text: 'Empty result set produces a valid CSV with headers' },
                    { text: 'E2E test covers the happy path' },
                  ],
                },
              ],
            },
            {
              title: 'Fix double-charge bug on retried payments',
              labels: ['Bug', 'High Priority'],
            },
          ],
        },
        {
          title: 'In Progress',
          cards: [
            {
              title: 'Refactor billing webhook handler',
              description: 'Splitting the giant switch into per-event handlers.',
              labels: ['Tech Debt'],
            },
          ],
        },
        {
          title: 'In Review',
          cards: [
            {
              title: 'Add rate limiting to public API',
              description: 'PR #482 — waiting on review from @security.',
              labels: ['Feature', 'High Priority'],
            },
          ],
        },
        {
          title: 'Done',
          cards: [
            {
              title: 'Sprint retro — what went well / what to change',
              checklists: [
                {
                  title: 'Retro outcomes',
                  items: [
                    { text: 'Captured wins' },
                    { text: 'Captured blockers' },
                    { text: 'One action item assigned for next sprint' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Personal Kanban',
    description: 'Keep your week organized from inbox to done.',
    category: 'personal',
    background: { type: 'color', value: '#22A186' },
    structure: {
      labels: [
        { name: 'Work', color: '#0079BF' },
        { name: 'Personal', color: '#61BD4F' },
        { name: 'Errand', color: '#F2D600' },
        { name: 'Urgent', color: '#EB5A46' },
        { name: 'Idea', color: '#C377E0' },
      ],
      lists: [
        {
          title: 'How to use this board',
          cards: [
            {
              title: 'Read me first',
              description:
                'A simple personal Kanban to keep your week in flow.\n\n**Inbox** — capture anything that comes to mind, decide later.\n**Today** — what you committed to doing today (cap it at 3–5).\n**This Week** — scheduled for the next 5 days.\n**Waiting On** — blocked by someone else.\n**Done** — review weekly, then archive.\n\nUse labels to separate Work / Personal / Errand and to flag Urgent items.',
            },
            {
              title: 'Daily ritual',
              checklists: [
                {
                  title: 'Morning (5 min)',
                  items: [
                    { text: 'Move 3–5 cards from This Week into Today' },
                    { text: 'Check Waiting On — any nudges to send?' },
                    { text: 'Pick the one thing you must finish today' },
                  ],
                },
                {
                  title: 'Evening (3 min)',
                  items: [
                    { text: 'Move finished cards to Done' },
                    { text: 'Triage Inbox into This Week or Later' },
                    { text: 'Clear tomorrow’s top priority' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Inbox',
          cards: [
            {
              title: 'Capture: book recommendation from Sara',
              labels: ['Personal', 'Idea'],
            },
            {
              title: 'Look into bike repair shops nearby',
              labels: ['Errand'],
            },
          ],
        },
        {
          title: 'Today',
          cards: [
            {
              title: 'Reply to client proposal',
              description: 'Confirm scope and send back the signed estimate.',
              labels: ['Work', 'Urgent'],
            },
            {
              title: 'Gym — leg day',
              labels: ['Personal'],
            },
            {
              title: 'Pick up dry cleaning',
              labels: ['Errand'],
            },
          ],
        },
        {
          title: 'This Week',
          cards: [
            {
              title: 'Plan weekend trip',
              checklists: [
                {
                  title: 'To book',
                  items: [
                    { text: 'Train tickets' },
                    { text: 'Hotel for Sat night' },
                    { text: 'Dinner reservation' },
                  ],
                },
              ],
              labels: ['Personal'],
            },
            {
              title: 'Quarterly self-review',
              labels: ['Work'],
            },
          ],
        },
        {
          title: 'Waiting On',
          cards: [
            {
              title: 'Feedback from manager on draft doc',
              description: 'Sent Mon. Nudge if no reply by Thu.',
              labels: ['Work'],
            },
          ],
        },
        {
          title: 'Done',
          cards: [
            {
              title: '✓ Schedule annual checkup',
              labels: ['Personal'],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Product Roadmap',
    description: 'Communicate what is shipping now, next, and later.',
    category: 'product',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#FF6B6B,#FFA8A8)' },
    structure: {
      labels: [
        { name: 'Growth', color: '#61BD4F' },
        { name: 'Retention', color: '#0079BF' },
        { name: 'Platform', color: '#C377E0' },
        { name: 'Mobile', color: '#FF9F1A' },
        { name: 'Big Bet', color: '#EB5A46' },
      ],
      lists: [
        {
          title: 'How this roadmap works',
          cards: [
            {
              title: 'Read me',
              description:
                'A "now / next / later" roadmap — not a Gantt chart.\n\n**Discovery** — ideas being researched or validated.\n**Now** — committed for this quarter.\n**Next** — likely next quarter; not committed yet.\n**Later** — on the radar, not scheduled.\n**Shipped** — released to customers.\n\nEach card should answer: who is it for, what problem does it solve, and how will we know it worked?',
            },
            {
              title: 'Initiative template — duplicate me',
              description:
                '## Problem\n_Who is hurting and why?_\n\n## Hypothesis\n_If we ship X, we expect Y because Z._\n\n## Success metric\n_How will we know it worked? Target number + timeframe._\n\n## Risks / open questions\n- \n- ',
              checklists: [
                {
                  title: 'Discovery checklist',
                  items: [
                    { text: 'Customer interviews (≥5)' },
                    { text: 'Competitive scan' },
                    { text: 'Prototype validated' },
                    { text: 'Engineering effort sized' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Discovery',
          cards: [
            {
              title: 'AI-assisted onboarding flow',
              description: 'Could we cut time-to-value for new teams from 4 days to <1?',
              labels: ['Growth', 'Big Bet'],
            },
            {
              title: 'Native push notifications on iOS',
              labels: ['Mobile', 'Retention'],
            },
          ],
        },
        {
          title: 'Now — Q2',
          cards: [
            {
              title: 'Workspace-level SSO',
              description: 'Blocking 3 enterprise deals. Owner: @priya. Target: end of quarter.',
              labels: ['Platform'],
            },
            {
              title: 'Faster board load (<800ms p95)',
              labels: ['Retention'],
              checklists: [
                {
                  title: 'Workstreams',
                  items: [
                    { text: 'Server-side pagination for large boards' },
                    { text: 'Defer non-critical bundle chunks' },
                    { text: 'Image lazy-loading on cards' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Next — Q3',
          cards: [
            {
              title: 'Public API + webhooks',
              labels: ['Platform'],
            },
            {
              title: 'In-app referrals',
              labels: ['Growth'],
            },
          ],
        },
        {
          title: 'Later',
          cards: [
            {
              title: 'Offline mode for mobile',
              labels: ['Mobile', 'Big Bet'],
            },
          ],
        },
        {
          title: 'Shipped',
          cards: [
            {
              title: 'Card templates (v1)',
              description: 'Released March. Adoption: 38% of active boards in week one.',
              labels: ['Growth'],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Marketing Campaign',
    description: 'Plan a campaign end-to-end: brief, assets, launch, review.',
    category: 'marketing',
    background: { type: 'color', value: '#F2994A' },
    structure: {
      labels: [
        { name: 'Blog', color: '#0079BF' },
        { name: 'Email', color: '#61BD4F' },
        { name: 'Social', color: '#F2D600' },
        { name: 'Paid', color: '#EB5A46' },
        { name: 'Event', color: '#C377E0' },
      ],
      lists: [
        {
          title: 'Campaign Brief',
          cards: [
            {
              title: 'Brief — fill this in first',
              description:
                '## Campaign\n_Working name_\n\n## Audience\n_Who are we trying to reach?_\n\n## Goal\n_One primary metric we are moving (e.g. +500 trial signups in 30 days)._\n\n## Key message\n_The one thing the audience should remember._\n\n## Channels\n- [ ] Blog\n- [ ] Email\n- [ ] Social\n- [ ] Paid\n- [ ] Event / webinar\n\n## Timeline\n_Kickoff → launch → wrap._',
              checklists: [
                {
                  title: 'Sign-offs',
                  items: [
                    { text: 'Brief approved by marketing lead' },
                    { text: 'Budget confirmed' },
                    { text: 'Legal review (if claims involved)' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Ideas',
          cards: [
            { title: 'Customer story: how Acme cut onboarding time 60%', labels: ['Blog'] },
            { title: 'Launch-week countdown thread', labels: ['Social'] },
            { title: 'Co-marketing webinar with partner X', labels: ['Event'] },
          ],
        },
        {
          title: 'In Production',
          cards: [
            {
              title: 'Announcement blog post',
              labels: ['Blog'],
              checklists: [
                {
                  title: 'Production checklist',
                  items: [
                    { text: 'Outline approved' },
                    { text: 'First draft' },
                    { text: 'Editor pass' },
                    { text: 'Hero image / screenshots' },
                    { text: 'SEO meta + slug' },
                  ],
                },
              ],
            },
            {
              title: 'Launch-day email blast',
              labels: ['Email'],
              checklists: [
                {
                  title: 'Email checklist',
                  items: [
                    { text: 'Subject line A/B' },
                    { text: 'Preview text' },
                    { text: 'CTA tested in staging' },
                    { text: 'Segment confirmed' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Scheduled',
          cards: [
            {
              title: 'LinkedIn carousel — feature highlights',
              labels: ['Social'],
            },
          ],
        },
        {
          title: 'Live',
          cards: [
            {
              title: 'Google search campaign — branded terms',
              labels: ['Paid'],
            },
          ],
        },
        {
          title: 'Review',
          cards: [
            {
              title: 'Post-launch review (T+14 days)',
              description: 'Pull metrics, write retro, decide what to repeat.',
              checklists: [
                {
                  title: 'Metrics to report',
                  items: [
                    { text: 'Trial signups vs goal' },
                    { text: 'Channel attribution' },
                    { text: 'Cost per acquisition' },
                    { text: 'Top-performing creative' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Bug Tracker',
    description: 'Triage incoming bugs and ship fixes faster.',
    category: 'engineering',
    background: { type: 'color', value: '#EB5757' },
    structure: {
      labels: [
        { name: 'P0 — Critical', color: '#EB5A46' },
        { name: 'P1 — High', color: '#FF9F1A' },
        { name: 'P2 — Normal', color: '#F2D600' },
        { name: 'P3 — Low', color: '#61BD4F' },
        { name: 'Needs Repro', color: '#C377E0' },
      ],
      lists: [
        {
          title: 'How we triage',
          cards: [
            {
              title: 'Triage rules',
              description:
                '**P0** — outage, data loss, security. Drop everything, page on-call.\n**P1** — broken core flow for many users. Same-week fix.\n**P2** — broken edge case or workaround exists. Schedule into next sprint.\n**P3** — cosmetic / minor annoyance. Batch with related work.\n\nIf you cannot reproduce, label "Needs Repro" and ask the reporter for steps + environment.',
            },
            {
              title: 'Bug report template',
              description:
                '## Summary\n_One line: what is broken?_\n\n## Steps to reproduce\n1. \n2. \n3. \n\n## Expected\n\n## Actual\n\n## Environment\n- Browser / OS:\n- App version:\n- User / workspace ID:\n\n## Attachments\n_Screenshots, console errors, HAR file_',
            },
          ],
        },
        {
          title: 'Reported',
          cards: [
            {
              title: 'Avatar uploads >5MB silently fail',
              description: 'Reported by 3 users in support over the last week.',
              labels: ['P2 — Normal', 'Needs Repro'],
            },
            {
              title: 'Search returns no results when query contains apostrophe',
              labels: ['P1 — High'],
            },
          ],
        },
        {
          title: 'Triage',
          cards: [
            {
              title: 'Dropdown overlaps modal on Safari iOS',
              labels: ['P2 — Normal'],
            },
          ],
        },
        {
          title: 'In Progress',
          cards: [
            {
              title: 'Email notifications send twice on card move',
              labels: ['P1 — High'],
              checklists: [
                {
                  title: 'Fix steps',
                  items: [
                    { text: 'Reproduce in staging' },
                    { text: 'Identify duplicate emitter' },
                    { text: 'Add regression test' },
                    { text: 'Backport to release branch' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Verifying',
          cards: [
            {
              title: 'Board background reverts to default on refresh',
              description: 'Fix merged in #921 — QA verifying on staging.',
              labels: ['P1 — High'],
            },
          ],
        },
        {
          title: 'Closed',
          cards: [
            {
              title: '✓ Login button disabled on slow networks',
              labels: ['P0 — Critical'],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Editorial Calendar',
    description: 'Pitch, draft, edit, and publish content on schedule.',
    category: 'content',
    background: { type: 'color', value: '#2D9CDB' },
    structure: {
      labels: [
        { name: 'How-to', color: '#61BD4F' },
        { name: 'Case Study', color: '#0079BF' },
        { name: 'Opinion', color: '#C377E0' },
        { name: 'News', color: '#EB5A46' },
        { name: 'Series', color: '#F2D600' },
      ],
      lists: [
        {
          title: 'How this calendar works',
          cards: [
            {
              title: 'Workflow at a glance',
              description:
                '**Pitch** — proposed ideas with a one-line angle.\n**Drafting** — writer is heads-down. Aim to leave drafting within 5 working days.\n**Editing** — with editor for line edits + fact check.\n**Scheduled** — ready, slotted into a publish date.\n**Published** — live. Promote on social + newsletter.\n\nEach post needs an angle, a target reader, and one takeaway before it leaves Pitch.',
            },
            {
              title: 'Post brief — duplicate me',
              description:
                '## Working title\n\n## Target reader\n_Who is this for? What do they already know?_\n\n## One-line angle\n_The sharp point of view this post takes._\n\n## Takeaway\n_What does the reader walk away knowing or doing?_\n\n## Sources / interviews\n- \n- \n\n## SEO\n- Primary keyword:\n- Slug:',
              checklists: [
                {
                  title: 'Pre-publish',
                  items: [
                    { text: 'Editor pass' },
                    { text: 'Fact check' },
                    { text: 'Hero image' },
                    { text: 'SEO meta + slug' },
                    { text: 'Social share copy' },
                    { text: 'Newsletter mention' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Pitch',
          cards: [
            { title: 'The hidden cost of meeting overload', labels: ['Opinion'] },
            { title: 'How Acme rebuilt onboarding in 6 weeks', labels: ['Case Study'] },
            { title: 'Async-first: a year in', labels: ['Opinion', 'Series'] },
          ],
        },
        {
          title: 'Drafting',
          cards: [
            {
              title: '5 keyboard shortcuts power users swear by',
              labels: ['How-to'],
            },
          ],
        },
        {
          title: 'Editing',
          cards: [
            {
              title: 'Migrating from Jira: a step-by-step playbook',
              labels: ['How-to'],
            },
          ],
        },
        {
          title: 'Scheduled',
          cards: [
            {
              title: 'Q2 product update roundup',
              description: 'Publish date: first Tue of the month.',
              labels: ['News'],
            },
          ],
        },
        {
          title: 'Published',
          cards: [
            { title: '✓ Why we rewrote our search index', labels: ['Case Study'] },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Client Onboarding',
    description: 'Take a new client from kickoff to first win.',
    category: 'agency',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#FFD166,#F2994A)' },
    structure: {
      labels: [
        { name: 'New', color: '#61BD4F' },
        { name: 'Strategic', color: '#0079BF' },
        { name: 'At Risk', color: '#EB5A46' },
        { name: 'Renewal', color: '#C377E0' },
      ],
      lists: [
        {
          title: 'New Client Intake',
          cards: [
            {
              title: 'Client template — duplicate me',
              description:
                '## Company\n_Name, industry, size_\n\n## Primary contact\n_Name, role, email, phone_\n\n## Engagement\n_Scope, start date, value_\n\n## Goals\n_What "good" looks like in 90 days_\n\n## Risks\n_Anything we know is shaky going in_',
              checklists: [
                {
                  title: 'Intake checklist',
                  items: [
                    { text: 'Signed SOW filed' },
                    { text: 'Billing set up' },
                    { text: 'Slack / shared channel created' },
                    { text: 'Kickoff scheduled' },
                  ],
                },
              ],
            },
            {
              title: 'Acme Industries',
              description: 'Manufacturing, ~500 employees. Sourced via referral.',
              labels: ['New'],
            },
          ],
        },
        {
          title: 'Kickoff Scheduled',
          cards: [
            {
              title: 'Northwind Logistics',
              description: 'Kickoff Tue 10am. Stakeholders: COO, Head of Ops.',
              labels: ['Strategic'],
              checklists: [
                {
                  title: 'Kickoff agenda',
                  items: [
                    { text: 'Introductions and roles' },
                    { text: 'Walk through goals + success metrics' },
                    { text: 'Confirm 30/60/90 plan' },
                    { text: 'Agree on weekly cadence' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Active — 30 Day Plan',
          cards: [
            {
              title: 'Stark-Kling LLC',
              description: 'Week 2 of onboarding. On track.',
              labels: ['Strategic'],
              checklists: [
                {
                  title: '30-day milestones',
                  items: [
                    { text: 'Discovery interviews complete', completed: true },
                    { text: 'Baseline metrics captured' },
                    { text: 'First deliverable shipped' },
                    { text: '30-day review booked' },
                  ],
                },
              ],
            },
            {
              title: 'Goyette Inc',
              description: 'Two stakeholders unresponsive — watching this one.',
              labels: ['At Risk'],
            },
          ],
        },
        {
          title: 'First Win',
          cards: [
            {
              title: 'Tiny Pants Inc',
              description: 'Hit their first reporting milestone two weeks early.',
              labels: ['Strategic'],
            },
          ],
        },
        {
          title: 'Steady State',
          cards: [
            {
              title: 'Toy-Adams',
              description: 'In steady-state. QBR booked for next quarter.',
              labels: ['Renewal'],
            },
          ],
        },
        {
          title: 'Churned / Lost',
          cards: [
            {
              title: 'Hudson, Baumbach and Dach',
              description: 'Did not renew — budget cuts. Post-mortem in the description below.',
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Design Project',
    description: 'Run a design engagement from brief to client review.',
    category: 'design',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#5E60CE,#48BFE3)' },
    structure: {
      labels: [
        { name: 'Discovery', color: '#C377E0' },
        { name: 'Design', color: '#0079BF' },
        { name: 'Dev Handoff', color: '#61BD4F' },
        { name: 'Blocked', color: '#EB5A46' },
        { name: 'Client Review', color: '#F2D600' },
      ],
      lists: [
        {
          title: 'Project Brief',
          cards: [
            {
              title: 'Project Documents',
              description:
                'Central place for the SOW, contract, and shared drive link.\n\n- SOW: _link_\n- Shared drive: _link_\n- Figma file: _link_',
            },
            {
              title: 'Project Goals',
              labels: ['Discovery'],
              checklists: [
                {
                  title: 'Outcomes we are aiming for',
                  items: [
                    { text: 'Increase signup conversion' },
                    { text: 'Modernize the visual language' },
                    { text: 'Establish a reusable component library' },
                    { text: 'Launch by end of quarter' },
                  ],
                },
              ],
            },
            {
              title: 'Success Metrics',
              checklists: [
                {
                  title: 'How we measure success',
                  items: [
                    { text: 'Signup conversion +20%' },
                    { text: 'Time on key screens reduced 30%' },
                    { text: 'Lighthouse a11y ≥95' },
                    { text: 'Stakeholder sign-off received' },
                  ],
                },
              ],
            },
            {
              title: 'Stakeholder sign-off',
              checklists: [
                {
                  title: 'Approvals needed',
                  items: [
                    { text: 'Founder / CEO' },
                    { text: 'Head of Product' },
                    { text: 'Engineering lead' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Brand Identity',
          cards: [
            {
              title: 'Strategy Document',
              description: 'Brand positioning, audience, tone of voice.',
              labels: ['Discovery'],
            },
            {
              title: 'Design Deliverables',
              labels: ['Design'],
              checklists: [
                {
                  title: 'Brand deliverables',
                  items: [
                    { text: 'Logo lockups' },
                    { text: 'Color palette' },
                    { text: 'Typography scale' },
                    { text: 'Iconography set' },
                    { text: 'Photography direction' },
                    { text: 'Brand voice guide' },
                  ],
                },
              ],
            },
            {
              title: 'Brand Guidelines',
              labels: ['Dev Handoff'],
            },
          ],
        },
        {
          title: 'Product Design',
          cards: [
            { title: 'User Research', labels: ['Discovery'] },
            { title: 'Information Architecture', labels: ['Design'] },
            { title: 'Wireframes', labels: ['Design'] },
            { title: 'Design System', labels: ['Design', 'Dev Handoff'] },
            { title: 'Visual Design', labels: ['Design'] },
            { title: 'Interaction Design', labels: ['Design'] },
          ],
        },
        {
          title: 'Marketing Website',
          cards: [
            { title: 'Sitemap', labels: ['Discovery'] },
            { title: 'Wireframes', labels: ['Design'] },
            { title: 'Visual Design', labels: ['Design'] },
            {
              title: 'Launch checklist',
              labels: ['Dev Handoff'],
              checklists: [
                {
                  title: 'Pre-launch',
                  items: [
                    { text: 'All copy proofread' },
                    { text: 'Analytics installed' },
                    { text: 'OG images set' },
                    { text: 'Cross-browser tested' },
                    { text: 'Final stakeholder review' },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Client Reviews',
          cards: [
            {
              title: 'Mobile App Reviews',
              labels: ['Client Review'],
              checklists: [
                { title: 'Round 1', items: [{ text: 'Initial concepts presented' }] },
              ],
            },
            {
              title: 'Web App Reviews',
              labels: ['Client Review'],
              checklists: [
                { title: 'Round 1', items: [{ text: 'Initial concepts presented' }] },
              ],
            },
            {
              title: 'Marketing Website Reviews',
              labels: ['Client Review'],
              checklists: [
                { title: 'Round 1', items: [{ text: 'Initial concepts presented' }] },
              ],
            },
          ],
        },
      ],
    },
    isPublic: true,
  },
];

async function ensureSeeded() {
  for (const tpl of DEFAULT_TEMPLATES) {
    await Template.updateOne(
      { name: tpl.name },
      {
        $set: {
          description: tpl.description,
          category: tpl.category,
          background: tpl.background,
          structure: tpl.structure,
          isPublic: tpl.isPublic,
        },
        $setOnInsert: { useCount: 0 },
      },
      { upsert: true },
    );
  }
}

export async function list() {
  await ensureSeeded().catch(() => undefined);
  return Template.find({ isPublic: true }).sort({ useCount: -1 }).lean();
}

export async function createBoardFromTemplate(
  templateId: string,
  workspaceId: string,
  title: string,
  creatorId: string,
) {
  const template = await Template.findById(templateId);
  if (!template) throw NotFound('Template not found');

  const board = await Board.create({
    workspaceId,
    title,
    description: template.description,
    background: template.background ?? { type: 'color', value: '#0079bf' },
    visibility: 'workspace',
    members: [{ userId: new Types.ObjectId(creatorId), role: 'admin', joinedAt: new Date() }],
    lastActivityAt: new Date(),
  });

  const structure = (template.structure ?? {}) as SeedStructure;

  const labelIdByName = new Map<string, Types.ObjectId>();
  for (const lbl of structure.labels ?? []) {
    const created = await Label.create({
      boardId: board._id,
      name: lbl.name,
      color: lbl.color,
    });
    labelIdByName.set(lbl.name, created._id as Types.ObjectId);
  }

  let listPos = 65_536;
  for (const lst of structure.lists ?? []) {
    const newList = await List.create({
      boardId: board._id,
      title: lst.title,
      position: listPos,
    });
    listPos += 65_536;

    let cardPos = 65_536;
    for (const c of lst.cards ?? []) {
      const cardLabelIds = (c.labels ?? [])
        .map((name) => labelIdByName.get(name))
        .filter((id): id is Types.ObjectId => !!id);

      const checklists = (c.checklists ?? []).map((cl, clIdx) => ({
        id: crypto.randomUUID(),
        title: cl.title,
        position: (clIdx + 1) * 65_536,
        items: cl.items.map((it, itIdx) => ({
          id: crypto.randomUUID(),
          text: it.text,
          completed: !!it.completed,
          position: (itIdx + 1) * 65_536,
        })),
      }));

      await Card.create({
        boardId: board._id,
        listId: newList._id,
        title: c.title,
        description: c.description ?? '',
        position: cardPos,
        labels: cardLabelIds,
        checklists,
      });
      cardPos += 65_536;
    }
  }

  template.useCount = (template.useCount ?? 0) + 1;
  await template.save();
  await logActivity({
    boardId: board._id,
    actorId: creatorId,
    type: 'board.created.from-template',
    payload: { templateId },
  });
  return board;
}
