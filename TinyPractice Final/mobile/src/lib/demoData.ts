import { Client, Session, ScheduledAppointment, Invoice } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDateRange(startDaysAgo: number, endDaysAgo: number): string {
  const start = daysAgo(startDaysAgo);
  const end = daysAgo(endDaysAgo);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

export function generateDemoData(): {
  clients: Client[];
  sessions: Session[];
  invoices: Invoice[];
  appointments: ScheduledAppointment[];
} {
  // ── Client IDs ──
  const sarahId = generateId();
  const jamesId = generateId();
  const avaId = generateId();
  const marcusId = generateId();
  const priyaId = generateId();
  const davidId = generateId();
  const emmaId = generateId();
  const rachelId = generateId();

  // ── Clients ──
  const clients: Client[] = [
    {
      id: sarahId,
      name: 'Sarah Mitchell',
      email: 's.mitchell@email.com',
      phone: '(617) 555-0142',
      tags: ['Weekly', 'Private Pay'],
      notes: 'Anxiety management, CBT approach. Prefers morning sessions.',
      createdAt: daysAgo(90).toISOString(),
      sessionCount: 12,
      lastSessionAt: daysAgo(2).toISOString(),
      isArchived: false,
    },
    {
      id: jamesId,
      name: 'James Cooper',
      email: 'jcooper@email.com',
      phone: '(617) 555-0198',
      tags: ['Weekly', 'Insurance'],
      notes: 'Couples therapy referral from Dr. Patel. BCBS insurance.',
      createdAt: daysAgo(85).toISOString(),
      sessionCount: 10,
      lastSessionAt: daysAgo(4).toISOString(),
      isArchived: false,
    },
    {
      id: avaId,
      name: 'Ava Thornton',
      email: 'ava.thornton@email.com',
      phone: '(508) 555-0167',
      tags: ['Bi-weekly', 'Private Pay', 'VIP'],
      notes: 'Grief counseling. Lost spouse 6 months ago. Very committed to process.',
      createdAt: daysAgo(80).toISOString(),
      sessionCount: 6,
      lastSessionAt: daysAgo(7).toISOString(),
      isArchived: false,
    },
    {
      id: marcusId,
      name: 'Marcus Rivera',
      email: 'm.rivera@email.com',
      phone: '(617) 555-0234',
      tags: ['Weekly', 'Insurance'],
      notes: 'Career transition stress. Recently promoted to VP.',
      createdAt: daysAgo(70).toISOString(),
      sessionCount: 8,
      lastSessionAt: daysAgo(3).toISOString(),
      isArchived: false,
    },
    {
      id: priyaId,
      name: 'Priya Patel',
      email: 'priya.p@email.com',
      phone: '(781) 555-0156',
      tags: ['Bi-weekly', 'Private Pay'],
      notes: 'Postpartum adjustment. Baby is 4 months old.',
      createdAt: daysAgo(65).toISOString(),
      sessionCount: 5,
      lastSessionAt: daysAgo(10).toISOString(),
      isArchived: false,
    },
    {
      id: davidId,
      name: 'David Okafor',
      email: 'dokafor@email.com',
      phone: '(617) 555-0289',
      tags: ['Monthly', 'New Client'],
      notes: 'Initial intake completed. Social anxiety focus.',
      createdAt: daysAgo(14).toISOString(),
      sessionCount: 2,
      lastSessionAt: daysAgo(5).toISOString(),
      isArchived: false,
    },
    {
      id: emmaId,
      name: 'Emma Larsson',
      email: 'emma.l@email.com',
      phone: '(508) 555-0312',
      tags: ['Weekly', 'Private Pay', 'VIP'],
      notes: 'Long-term client, EMDR for trauma processing.',
      createdAt: daysAgo(90).toISOString(),
      sessionCount: 11,
      lastSessionAt: daysAgo(2).toISOString(),
      isArchived: false,
    },
    {
      id: rachelId,
      name: 'Rachel Kim',
      phone: '(617) 555-0178',
      tags: ['Bi-weekly', 'Insurance'],
      notes: 'Family dynamics and boundary setting. Referred by Emma Larsson.',
      createdAt: daysAgo(55).toISOString(),
      sessionCount: 4,
      lastSessionAt: daysAgo(8).toISOString(),
      isArchived: false,
    },
  ];

  // ── Sessions ──
  const sessions: Session[] = [];

  const sarahNotes = [
    'Explored triggers related to workplace conflict. Practiced grounding techniques. Client reports improved sleep this week.',
    'Reviewed thought journal entries. Identified core belief around perfectionism. Introduced cognitive restructuring worksheet.',
    'Practiced progressive muscle relaxation in session. Client reports decreased morning anxiety. Continuing daily practice.',
    'Discussed upcoming presentation anxiety. Role-played scenarios. Client feeling more prepared.',
    'Checked in on sleep hygiene changes. Client reports sleeping through the night 5/7 days. Significant improvement.',
    'Explored relationship between anxiety and people-pleasing tendencies. Client had important insight about childhood patterns.',
    'Reviewed CBT triangle. Client independently identified distorted thinking pattern this week. Great progress.',
    'Processed conflict with supervisor. Practiced assertive communication techniques. Will implement before next session.',
    'Midpoint review of treatment goals. Client has met 3 of 5 goals. Revised remaining goals together.',
    'Introduced exposure hierarchy for social situations. Client completed first low-anxiety exposure successfully.',
    'Discussed setback after family gathering. Normalized regression. Reviewed coping strategies.',
    'Strong session. Client used grounding techniques independently during a panic episode at work. Very encouraged.',
  ];
  const sarahFollowUps = [
    'Review thought journal',
    'Practice breathing exercises daily',
    undefined,
    'Practice presentation once before Thursday',
    undefined,
    'Journal about people-pleasing patterns',
    'Complete CBT worksheet',
    'Use assertive communication with supervisor this week',
    undefined,
    'Complete 2 low-anxiety exposures before next session',
    'Resume daily meditation practice',
    undefined,
  ];
  for (let i = 0; i < 12; i++) {
    const sessionDate = daysAgo(2 + i * 7);
    sessions.push({
      id: generateId(),
      clientId: sarahId,
      date: setTime(sessionDate, 9, 0).toISOString(),
      duration: i % 3 === 0 ? 60 : 50,
      mood: i < 4 ? 'neutral' : i < 8 ? 'good' : (i === 11 ? 'great' : 'good'),
      notes: sarahNotes[i],
      followUp: sarahFollowUps[i],
      createdAt: setTime(sessionDate, 10, 0).toISOString(),
    });
  }

  const jamesNotes = [
    'Initial couples intake. Both partners present. Identified communication breakdown as primary concern. Gottman assessment administered.',
    'Reviewed Gottman assessment results. Introduced Four Horsemen framework. Both partners engaged and receptive.',
    'Practiced active listening exercise in session. Partner A had difficulty with reflective listening. Will focus here.',
    'Discussed financial stressors impacting relationship. Created shared budget planning exercise.',
    'Significant breakthrough. Partner B expressed vulnerability about childhood attachment. Partner A responded with empathy.',
    'Reviewed love languages assessment. Identified mismatch in quality time vs. acts of service expectations.',
    'Practiced conflict de-escalation techniques. Both partners report fewer arguments this week.',
    'Explored extended family boundaries. Created shared agreement about holiday plans.',
    'Check-in on communication goals. Both partners using I-statements more consistently. Positive trajectory.',
    'Processed recent argument about parenting styles. Introduced unified front strategy.',
  ];
  const jamesFollowUps = [
    'Complete relationship history questionnaire',
    'Each partner list 3 appreciations daily',
    'Practice reflective listening 10 min/day',
    undefined,
    'Journal about attachment styles',
    'Plan one quality time activity this week',
    undefined,
    'Discuss holiday plan with in-laws',
    undefined,
    'Read co-parenting chapter before next session',
  ];
  for (let i = 0; i < 10; i++) {
    const sessionDate = daysAgo(4 + i * 7);
    sessions.push({
      id: generateId(),
      clientId: jamesId,
      date: setTime(sessionDate, 14, 0).toISOString(),
      duration: 60,
      mood: i < 3 ? 'difficult' : i < 6 ? 'neutral' : 'good',
      notes: jamesNotes[i],
      followUp: jamesFollowUps[i],
      createdAt: setTime(sessionDate, 15, 0).toISOString(),
    });
  }

  const avaNotes = [
    'First session. Completed grief assessment. Client presents with complicated grief, 6 months post-loss. PHQ-9 score: 18.',
    'Explored memories of deceased spouse. Client showed strong emotional response. Good engagement with process.',
    'Introduced meaning-making framework. Client identified three positive legacies from relationship.',
    'Discussed guilt around moments of happiness. Normalized grief non-linearity. Client found this validating.',
    'Processed anniversary reaction. Client had prepared by visiting meaningful location. Showed resilience.',
    'Reviewed progress. PHQ-9 score: 12 (down from 18). Client beginning to engage in social activities again.',
  ];
  const avaFollowUps = [
    'Complete PHQ-9 before next session',
    'Write letter to spouse (not to send)',
    undefined,
    'Allow one joyful activity this week without guilt',
    'Bring photos to next session',
    'Continue social engagement plan',
  ];
  for (let i = 0; i < 6; i++) {
    const sessionDate = daysAgo(7 + i * 14);
    sessions.push({
      id: generateId(),
      clientId: avaId,
      date: setTime(sessionDate, 11, 0).toISOString(),
      duration: 60,
      mood: i < 2 ? 'difficult' : i < 4 ? 'neutral' : 'good',
      notes: avaNotes[i],
      followUp: avaFollowUps[i],
      createdAt: setTime(sessionDate, 12, 0).toISOString(),
    });
  }

  const marcusNotes = [
    'Initial intake. Client reports high stress following VP promotion. Imposter syndrome prominent. GAD-7 score: 16.',
    'Explored imposter syndrome origins. Connected to first-generation college experience. Psychoeducation on cognitive distortions.',
    'Discussed work-life balance deterioration. Client working 70+ hours/week. Introduced boundary-setting framework.',
    'Practiced saying no to non-essential meetings. Client successfully declined two this week. Building confidence.',
    'Processed feedback anxiety. Client received positive performance review but focused on one constructive point.',
    'Introduced mindfulness meditation for stress management. Client skeptical but willing to try.',
    'Check-in on meditation practice. Client reports sleeping better. Has been using 5-minute app daily.',
    'Discussed delegation as a leadership skill vs. weakness. Reframed control needs. Good insight.',
  ];
  const marcusFollowUps = [
    'Complete stress inventory',
    'Track imposter syndrome thoughts this week',
    'Set one firm boundary at work this week',
    undefined,
    'Write down 3 accomplishments each evening',
    'Try 5-minute meditation daily',
    undefined,
    'Delegate one task this week',
  ];
  for (let i = 0; i < 8; i++) {
    const sessionDate = daysAgo(3 + i * 7);
    sessions.push({
      id: generateId(),
      clientId: marcusId,
      date: setTime(sessionDate, 16, 0).toISOString(),
      duration: 50,
      mood: i < 3 ? 'neutral' : i < 6 ? 'good' : 'good',
      notes: marcusNotes[i],
      followUp: marcusFollowUps[i],
      createdAt: setTime(sessionDate, 17, 0).toISOString(),
    });
  }

  const priyaNotes = [
    'Initial session. Client presents with postpartum adjustment. Baby 4 months old. Edinburgh score: 14. No SI.',
    'Explored identity shift from professional to mother. Client grieving loss of previous routine.',
    'Discussed sleep deprivation impact on mood. Created self-care micro-plan that fits infant schedule.',
    'Partner dynamics session. Client feeling unsupported. Communication strategies for asking for help.',
    'Positive check-in. Client implemented self-care plan. Edinburgh score: 10. Returning to part-time work next month.',
  ];
  const priyaFollowUps = [
    'Complete Edinburgh Postnatal Depression Scale',
    'Journal about identity before and after baby',
    'Implement one micro-self-care item daily',
    'Have scheduled conversation with partner about support needs',
    'Complete return-to-work anxiety worksheet',
  ];
  for (let i = 0; i < 5; i++) {
    const sessionDate = daysAgo(10 + i * 14);
    sessions.push({
      id: generateId(),
      clientId: priyaId,
      date: setTime(sessionDate, 10, 0).toISOString(),
      duration: 50,
      mood: i < 2 ? 'difficult' : i < 4 ? 'neutral' : 'good',
      notes: priyaNotes[i],
      followUp: priyaFollowUps[i],
      createdAt: setTime(sessionDate, 11, 0).toISOString(),
    });
  }

  const davidNotes = [
    'First session. Completed intake assessment. Client presents with social anxiety, primarily in work settings. GAD-7 score: 14.',
    'Explored social anxiety triggers. Identified meetings and presentations as primary. Created exposure hierarchy.',
  ];
  const davidFollowUps = [
    'Complete social anxiety inventory',
    'Practice one low-anxiety social interaction daily',
  ];
  for (let i = 0; i < 2; i++) {
    const sessionDate = daysAgo(5 + i * 9);
    sessions.push({
      id: generateId(),
      clientId: davidId,
      date: setTime(sessionDate, 15, 0).toISOString(),
      duration: 60,
      mood: 'neutral',
      notes: davidNotes[i],
      followUp: davidFollowUps[i],
      createdAt: setTime(sessionDate, 16, 0).toISOString(),
    });
  }

  const emmaNotes = [
    'Continued EMDR processing of childhood event. Strong emotional response but good containment. Will revisit next session.',
    'Completed EMDR set on target memory. SUD decreased from 8 to 4. Client reports feeling lighter.',
    'Installed positive cognition "I am safe now." Body scan clear. Moving to next target memory.',
    'New target memory identified through recent trigger. Prepared for processing next session.',
    'EMDR processing session. Unexpected connection to earlier memory. Looping resolved with cognitive interweave.',
    'Strong session. Client processed grief component connected to trauma. Integration going well.',
    'Review session. Client reports decreased hypervigilance in daily life. Sleep improved significantly.',
    'Continued processing secondary trauma targets. Client demonstrating resilience and self-compassion.',
    'Explored current relationship patterns through trauma-informed lens. Client making connections independently.',
    'Positive session. SUD on primary target now 1. Close to completing this phase of EMDR protocol.',
    'Reprocessed remaining disturbance on primary target. SUD now 0. VoC on positive cognition: 7. Major milestone.',
  ];
  const emmaFollowUps = [
    'Practice container exercise if distressed',
    undefined,
    'Notice body sensations throughout the week',
    'Journal about triggers noticed this week',
    undefined,
    'Practice self-compassion meditation',
    'Continue sleep hygiene routine',
    undefined,
    'Write letter to younger self',
    'Practice calm place visualization daily',
    undefined,
  ];
  for (let i = 0; i < 11; i++) {
    const sessionDate = daysAgo(2 + i * 7);
    sessions.push({
      id: generateId(),
      clientId: emmaId,
      date: setTime(sessionDate, 13, 0).toISOString(),
      duration: i % 4 === 0 ? 60 : 50,
      mood: i < 3 ? 'neutral' : i < 7 ? 'good' : 'great',
      notes: emmaNotes[i],
      followUp: emmaFollowUps[i],
      createdAt: setTime(sessionDate, 14, 0).toISOString(),
    });
  }

  const rachelNotes = [
    'Initial session. Client referred by existing client. Presenting with family boundary issues, particularly with parents.',
    'Explored enmeshment patterns. Client identifies as "family peacekeeper." Introduced differentiation concepts.',
    'Discussed boundary setting with mother. Role-played upcoming conversation. Client nervous but motivated.',
    'Debriefed boundary conversation. Client set limit successfully. Mother reacted with guilt-tripping but client held firm.',
  ];
  const rachelFollowUps = [
    'Complete family genogram worksheet',
    'Read "Where You End and I Begin" chapter 1-3',
    'Practice boundary script before family dinner',
    undefined,
  ];
  for (let i = 0; i < 4; i++) {
    const sessionDate = daysAgo(8 + i * 14);
    sessions.push({
      id: generateId(),
      clientId: rachelId,
      date: setTime(sessionDate, 11, 0).toISOString(),
      duration: 50,
      mood: i < 2 ? 'neutral' : 'good',
      notes: rachelNotes[i],
      followUp: rachelFollowUps[i],
      createdAt: setTime(sessionDate, 12, 0).toISOString(),
    });
  }

  // ── Invoices ──
  const invoices: Invoice[] = [];

  // Paid invoices (older, ~$4,800 total)
  // Sarah — 4 sessions @ $175 = $700
  const sarahSessions1 = sessions.filter((s) => s.clientId === sarahId).slice(8, 12);
  const inv1Id = generateId();
  invoices.push({
    id: inv1Id,
    clientId: sarahId,
    amount: 700,
    description: `Individual therapy - ${formatDateRange(86, 65)} (4 sessions)`,
    dueDate: daysAgo(55).toISOString(),
    status: 'paid',
    paidDate: daysAgo(58).toISOString(),
    createdAt: daysAgo(65).toISOString(),
    sessionIds: sarahSessions1.map((s) => s.id),
  });
  sarahSessions1.forEach((s) => { s.invoiceId = inv1Id; });

  // Sarah — 4 sessions @ $175 = $700
  const sarahSessions2 = sessions.filter((s) => s.clientId === sarahId).slice(4, 8);
  const inv2Id = generateId();
  invoices.push({
    id: inv2Id,
    clientId: sarahId,
    amount: 700,
    description: `Individual therapy - ${formatDateRange(44, 23)} (4 sessions)`,
    dueDate: daysAgo(13).toISOString(),
    status: 'paid',
    paidDate: daysAgo(15).toISOString(),
    createdAt: daysAgo(23).toISOString(),
    sessionIds: sarahSessions2.map((s) => s.id),
  });
  sarahSessions2.forEach((s) => { s.invoiceId = inv2Id; });

  // James — 4 sessions @ $125 = $500
  const jamesSessions1 = sessions.filter((s) => s.clientId === jamesId).slice(6, 10);
  const inv3Id = generateId();
  invoices.push({
    id: inv3Id,
    clientId: jamesId,
    amount: 500,
    description: `Couples therapy - ${formatDateRange(67, 46)} (4 sessions)`,
    dueDate: daysAgo(36).toISOString(),
    status: 'paid',
    paidDate: daysAgo(38).toISOString(),
    createdAt: daysAgo(46).toISOString(),
    sessionIds: jamesSessions1.map((s) => s.id),
  });
  jamesSessions1.forEach((s) => { s.invoiceId = inv3Id; });

  // Emma — 4 sessions @ $200 = $800
  const emmaSessions1 = sessions.filter((s) => s.clientId === emmaId).slice(7, 11);
  const inv4Id = generateId();
  invoices.push({
    id: inv4Id,
    clientId: emmaId,
    amount: 800,
    description: `EMDR therapy - ${formatDateRange(79, 58)} (4 sessions)`,
    dueDate: daysAgo(48).toISOString(),
    status: 'paid',
    paidDate: daysAgo(50).toISOString(),
    createdAt: daysAgo(58).toISOString(),
    sessionIds: emmaSessions1.map((s) => s.id),
  });
  emmaSessions1.forEach((s) => { s.invoiceId = inv4Id; });

  // Emma — 3 sessions @ $200 = $600
  const emmaSessions2 = sessions.filter((s) => s.clientId === emmaId).slice(4, 7);
  const inv5Id = generateId();
  invoices.push({
    id: inv5Id,
    clientId: emmaId,
    amount: 600,
    description: `EMDR therapy - ${formatDateRange(37, 16)} (3 sessions)`,
    dueDate: daysAgo(6).toISOString(),
    status: 'paid',
    paidDate: daysAgo(8).toISOString(),
    createdAt: daysAgo(16).toISOString(),
    sessionIds: emmaSessions2.map((s) => s.id),
  });
  emmaSessions2.forEach((s) => { s.invoiceId = inv5Id; });

  // Ava — 3 sessions @ $200 = $600
  const avaSessions1 = sessions.filter((s) => s.clientId === avaId).slice(3, 6);
  const inv6Id = generateId();
  invoices.push({
    id: inv6Id,
    clientId: avaId,
    amount: 600,
    description: `Grief counseling - ${formatDateRange(77, 49)} (3 sessions)`,
    dueDate: daysAgo(39).toISOString(),
    status: 'paid',
    paidDate: daysAgo(41).toISOString(),
    createdAt: daysAgo(49).toISOString(),
    sessionIds: avaSessions1.map((s) => s.id),
  });
  avaSessions1.forEach((s) => { s.invoiceId = inv6Id; });

  // Marcus — 4 sessions @ $125 = $500 (paid)
  const marcusSessions1 = sessions.filter((s) => s.clientId === marcusId).slice(4, 8);
  const inv7Id = generateId();
  invoices.push({
    id: inv7Id,
    clientId: marcusId,
    amount: 500,
    description: `Individual therapy - ${formatDateRange(52, 31)} (4 sessions)`,
    dueDate: daysAgo(21).toISOString(),
    status: 'paid',
    paidDate: daysAgo(23).toISOString(),
    createdAt: daysAgo(31).toISOString(),
    sessionIds: marcusSessions1.map((s) => s.id),
  });
  marcusSessions1.forEach((s) => { s.invoiceId = inv7Id; });

  // Pending invoices
  // Sarah — 4 recent sessions @ $175 = $700
  const sarahSessions3 = sessions.filter((s) => s.clientId === sarahId).slice(0, 4);
  const inv8Id = generateId();
  invoices.push({
    id: inv8Id,
    clientId: sarahId,
    amount: 700,
    description: `Individual therapy - ${formatDateRange(23, 2)} (4 sessions)`,
    dueDate: daysFromNow(12).toISOString(),
    status: 'pending',
    createdAt: daysAgo(2).toISOString(),
    sessionIds: sarahSessions3.map((s) => s.id),
  });
  sarahSessions3.forEach((s) => { s.invoiceId = inv8Id; });

  // James — 3 sessions @ $125 = $375
  const jamesSessions2 = sessions.filter((s) => s.clientId === jamesId).slice(0, 3);
  const inv9Id = generateId();
  invoices.push({
    id: inv9Id,
    clientId: jamesId,
    amount: 375,
    description: `Couples therapy - ${formatDateRange(18, 4)} (3 sessions)`,
    dueDate: daysFromNow(8).toISOString(),
    status: 'pending',
    createdAt: daysAgo(4).toISOString(),
    sessionIds: jamesSessions2.map((s) => s.id),
  });
  jamesSessions2.forEach((s) => { s.invoiceId = inv9Id; });

  // Priya — 3 sessions @ $175 = $525
  const priyaSessions1 = sessions.filter((s) => s.clientId === priyaId).slice(0, 3);
  const inv10Id = generateId();
  invoices.push({
    id: inv10Id,
    clientId: priyaId,
    amount: 525,
    description: `Individual therapy - ${formatDateRange(38, 10)} (3 sessions)`,
    dueDate: daysFromNow(5).toISOString(),
    status: 'pending',
    createdAt: daysAgo(10).toISOString(),
    sessionIds: priyaSessions1.map((s) => s.id),
  });
  priyaSessions1.forEach((s) => { s.invoiceId = inv10Id; });

  // Overdue invoices
  // Rachel — 2 sessions @ $125 = $250 (overdue 2 weeks)
  const rachelSessions1 = sessions.filter((s) => s.clientId === rachelId).slice(2, 4);
  const inv11Id = generateId();
  invoices.push({
    id: inv11Id,
    clientId: rachelId,
    amount: 250,
    description: `Individual therapy - ${formatDateRange(50, 36)} (2 sessions)`,
    dueDate: daysAgo(14).toISOString(),
    status: 'overdue',
    createdAt: daysAgo(36).toISOString(),
    sessionIds: rachelSessions1.map((s) => s.id),
  });
  rachelSessions1.forEach((s) => { s.invoiceId = inv11Id; });

  // Ava — 3 sessions @ $200 = $600 (overdue 1 week)
  const avaSessions2 = sessions.filter((s) => s.clientId === avaId).slice(0, 3);
  const inv12Id = generateId();
  invoices.push({
    id: inv12Id,
    clientId: avaId,
    amount: 600,
    description: `Grief counseling - ${formatDateRange(35, 7)} (3 sessions)`,
    dueDate: daysAgo(7).toISOString(),
    status: 'overdue',
    createdAt: daysAgo(7).toISOString(),
    sessionIds: avaSessions2.map((s) => s.id),
  });
  avaSessions2.forEach((s) => { s.invoiceId = inv12Id; });

  // ── Appointments (upcoming) ──
  const appointments: ScheduledAppointment[] = [];

  // Today or tomorrow
  const todayHour = new Date().getHours();
  const todaySlot = todayHour < 14 ? 0 : 1; // If before 2pm, schedule today; otherwise tomorrow

  appointments.push({
    id: generateId(),
    clientId: sarahId,
    scheduledDate: setTime(daysFromNow(todaySlot), 9, 0).toISOString(),
    duration: 50,
    notes: 'Follow up on exposure hierarchy progress',
    isCompleted: false,
    createdAt: daysAgo(5).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: emmaId,
    scheduledDate: setTime(daysFromNow(todaySlot), 13, 0).toISOString(),
    duration: 60,
    notes: 'Begin processing secondary target memory',
    isCompleted: false,
    createdAt: daysAgo(5).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: marcusId,
    scheduledDate: setTime(daysFromNow(1), 16, 0).toISOString(),
    duration: 50,
    isCompleted: false,
    createdAt: daysAgo(3).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: jamesId,
    scheduledDate: setTime(daysFromNow(3), 14, 0).toISOString(),
    duration: 60,
    notes: 'Couples session - revisit parenting strategies',
    isCompleted: false,
    createdAt: daysAgo(4).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: avaId,
    scheduledDate: setTime(daysFromNow(5), 11, 0).toISOString(),
    duration: 60,
    isCompleted: false,
    createdAt: daysAgo(2).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: priyaId,
    scheduledDate: setTime(daysFromNow(8), 10, 0).toISOString(),
    duration: 50,
    notes: 'Discuss return-to-work plan',
    isCompleted: false,
    createdAt: daysAgo(3).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: rachelId,
    scheduledDate: setTime(daysFromNow(6), 11, 0).toISOString(),
    duration: 50,
    isCompleted: false,
    createdAt: daysAgo(2).toISOString(),
  });

  appointments.push({
    id: generateId(),
    clientId: davidId,
    scheduledDate: setTime(daysFromNow(10), 15, 0).toISOString(),
    duration: 60,
    notes: 'Review exposure hierarchy progress',
    isCompleted: false,
    createdAt: daysAgo(1).toISOString(),
  });

  // Past completed appointments (linked to recent sessions)
  const sarahRecentSession = sessions.find((s) => s.clientId === sarahId);
  if (sarahRecentSession) {
    appointments.push({
      id: generateId(),
      clientId: sarahId,
      scheduledDate: sarahRecentSession.date,
      duration: 50,
      isCompleted: true,
      completedSessionId: sarahRecentSession.id,
      createdAt: daysAgo(7).toISOString(),
    });
  }

  const emmaRecentSession = sessions.find((s) => s.clientId === emmaId);
  if (emmaRecentSession) {
    appointments.push({
      id: generateId(),
      clientId: emmaId,
      scheduledDate: emmaRecentSession.date,
      duration: 60,
      isCompleted: true,
      completedSessionId: emmaRecentSession.id,
      createdAt: daysAgo(7).toISOString(),
    });
  }

  const marcusRecentSession = sessions.find((s) => s.clientId === marcusId);
  if (marcusRecentSession) {
    appointments.push({
      id: generateId(),
      clientId: marcusId,
      scheduledDate: marcusRecentSession.date,
      duration: 50,
      isCompleted: true,
      completedSessionId: marcusRecentSession.id,
      createdAt: daysAgo(7).toISOString(),
    });
  }

  const jamesRecentSession = sessions.find((s) => s.clientId === jamesId);
  if (jamesRecentSession) {
    appointments.push({
      id: generateId(),
      clientId: jamesId,
      scheduledDate: jamesRecentSession.date,
      duration: 60,
      isCompleted: true,
      completedSessionId: jamesRecentSession.id,
      createdAt: daysAgo(10).toISOString(),
    });
  }

  return { clients, sessions, invoices, appointments };
}
