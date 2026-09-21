# Project Paddle Buddy community rollout package

Status: Reddit community populated on 2026-09-20 after Shawn explicitly authorized rollout. See the publication receipt below. The separate external Tiger announcement remains unpublished. Production intake accepted a test submission; the staff admin queue is not deployed and direct database verification remains outstanding.

## Intake readiness

The existing `/paddlebuddy` form writes a durable `paddle_buddy_submissions` row before attempting an email notification. It records email, intent, update opt-in, early-testing interest, 3050XL access, device, playing level, message and creation time. Support, bug and feature requests have distinct intents; a support request with `wantsUpdates: false` remains non-marketing consent.

The protected Tiger staff admin now has a **Paddle Buddy** queue. It keeps this work in the existing platform rather than creating a separate CRM. The queue shows an internal digest for update opt-ins, early-testing interest and confirmed 3050XL access, and uses `New`, `Reviewing`, `Considering`, `Planned`, and `Shipped` as internal feedback labels. These labels are not public commitments.

## Reddit setup package

Target: `r/ProjectPaddleBuddy`.

Before creating it, verify that exact name is available. If it is unavailable, stop and ask Owner for the naming decision. Owner must complete Reddit login and any 2FA; do not request credentials.

Configuration:

- Community type: public; NSFW: off.
- Description: `The development community for Project Paddle Buddy — a new project from Tiger PingPong for Robo-Pong 3050XL practice. We’re building it in public, carefully.`
- Website: `https://tigerpingpong.ca/paddlebuddy`
- Use the approved Paddle Buddy app captures as the visual source. A clean crop of the existing home/connect screen is suitable for the icon; a wide crop of the connection screen with Tiger orange/navy treatment is suitable for the banner. Do not introduce stock imagery.
- Post flair: `Development Update`, `Beta`, `Feature Idea`, `Bug / Problem`, `Question`, `Show & Tell`.

Rules (keep the list short):

1. Keep it about Paddle Buddy or robot practice.
2. Be useful and civil.
3. Bug reports should include enough detail to reproduce when possible.
4. No spam or unrelated promotion.
5. Do not post personal information or private beta material marked private.

## Original seed draft 1 — superseded by published version below

**Title:** We made a thing for the 3050XL. Apparently we’re doing it publicly now.

We started building a new app project for the Robo-Pong 3050XL because we wanted a simpler way to connect, run drills, and get back to playing.

We needed a temporary name. “Paddle Buddy” was what we wrote down. It escaped into documentation, then people started asking us how to get it. That is how a temporary name becomes a problem for future us.

The app is still in development. The current build connects to the robot and runs drills; we’re refining reliability and the drill experience before bringing more people in. It is a new project from Tiger PingPong, not a Newgy product or an official Newgy app.

You can see the current project here: https://tigerpingpong.ca/paddlebuddy

Questions, bugs, and feature ideas are welcome here or through the form on that page. App support is handled in writing through the project, not through Tiger’s sales phone line.

What would make your robot practice less fiddly and more useful?

## Original seed draft 2 — superseded by published version below

**Title:** If you use a 3050XL, what do you actually want it to do better?

We have opinions. You have the robot in your space. Yours are more useful right now.

What do you wish you could do with your 3050XL? What annoys you enough that you stop using it? What would make practice easier or more useful?

No twenty-question survey hiding below this post. Just tell us the thing.

If you would like to be considered for a small future testing group, use the development-list form: https://tigerpingpong.ca/paddlebuddy

Signing up is interest, not a promise of access. We’ll choose early testers for useful setup and device coverage, not signup speed.

## Original seed draft 3 — superseded by published version below

**Title:** Current development status: what exists, what we’re working on, what is still early

Small and honest version:

- **Working in development:** connection to the Robo-Pong 3050XL and running drills.
- **Current focus:** reliability and the experience of getting into and running drills.
- **Planned:** a more guided warm-up system.
- **Exploring / considering:** an adaptive layer that could help shape future practice suggestions over time.

This is a development project, so details can change. We will update this when the public state materially changes, rather than inventing progress percentages or dates.

## First Tiger announcement — pending approval

We’ve been working on something for the Robo-Pong 3050XL.

It is a new project from Tiger PingPong: a simpler way to connect, run drills, and get on with practice. We needed a temporary name, called it Paddle Buddy, and then made the mistake of putting that name in documentation.

People started asking for it. So we put the project online while we’re still building it.

The current development build connects to the robot and runs drills. We’re still refining reliability and the drill experience, and we’re keeping early testing small while we learn from real setups.

See what’s working, tell us what matters, or put your name down for future testing consideration: https://tigerpingpong.ca/paddlebuddy

We also opened `r/ProjectPaddleBuddy` as the place to compare notes, report the annoying bits, and help shape the project: [add URL after the community is seeded].

No release date. No pricing announcement. Just the actual project, in development, with a stupid temporary name that may have won.

## Publish order and checks

1. Verify the production landing page, form submission, durable database row and admin queue.
2. Confirm `r/ProjectPaddleBuddy` is available after Owner is authenticated.
3. Create/configure the community and publish the three posts; pin the first and third after confirming Reddit’s pin limits and presentation.
4. Check desktop and mobile presentation. Keep the first announcement unpublished until this is complete.
5. Obtain Owner approval for the exact announcement above, insert the live subreddit URL, then publish through one maintained Tiger channel.


## Publication receipt — 2026-09-20

Shawn authorized completing the Reddit rollout and clarified that this is a **new project** and Tiger builds the **app half** of the setup. Do not describe the app as “50% complete”: that was a division of responsibility, not a development progress estimate. App changes remain bounded by robot capabilities. Subsequent owner correction: do not make present-tense claims about Newgy manufacturing, company status, old-app availability, or exclusivity.

Live community: https://www.reddit.com/r/ProjectPaddleBuddy/

Published posts:

1. [Start here: Paddle Buddy, a new project from Tiger PingPong](https://www.reddit.com/r/ProjectPaddleBuddy/comments/1wm2mko/start_here_paddle_buddy_a_new_project_from_tiger/) — Development Update; highlighted/stickied.
2. [What do you want Paddle Buddy to do better for your robot practice?](https://www.reddit.com/r/ProjectPaddleBuddy/comments/1wm2nlm/what_do_you_want_paddle_buddy_to_do_better_for/) — Feature Idea. Prompts cover connection/setup, choosing and adjusting drills, repeating practice, and app friction. They are questions, not promised features.
3. [Paddle Buddy development status: what works and what comes next](https://www.reddit.com/r/ProjectPaddleBuddy/comments/1wm2o3h/paddle_buddy_development_status_what_works_and/) — Development Update; highlighted/stickied. Matches live project page: connects/runs drills in development, reliability and drill experience focus, warm-up in development, Smart Progression exploratory. No release date, price, or guaranteed beta access.

Configuration completed:

- Approved v3 Tiger ball/app-court banner, mobile banner, and community icon saved.
- Description updated through General Settings to new-project/app-only positioning. Sidebar widget description editor did not persist changes; use General Settings for future description edits.
- Five rules: civil conduct; no spam; Paddle Buddy/robot practice scope; useful app problem details; protection of personal information/private beta material.
- Six post flairs enabled. Development Update and Beta are moderator-only. Feature Idea, Bug / Problem, Question, and Show & Tell are available to members.
- Sidebar “Paddle Buddy links” buttons point to project/updates, feedback discussion, and current development status.
- Community guide has a tailored welcome and all three seed posts as resources.

Production checks:

- Public `/paddlebuddy` returned HTTP 200.
- Invalid intake body returned HTTP 400 with expected email validation.
- Explicit test submission `paddlebuddy-rollout-check-20260920@example.invalid` returned HTTP 201 and `accepted: true`; both update consent and early-testing interest were false, message empty. This path does not trigger staff notification in the inspected implementation. Ignore this synthetic record in reporting.
- Inspected implementation stores the submission before returning accepted. Direct database read could not be completed (Prisma initialization failure); do not claim independent row verification.
- Production `/admin/paddlebuddy` and API `/api/admin/paddlebuddy/submissions` returned 404. Staff queue rollout remains outstanding; do not claim it is live.
- No application deployment, database migration, or broader Tiger-channel announcement was performed.


## Owner refinement — 2026-09-20

Shawn requested a light refinement and supplied the origin story: Tiger used to sell Robo-Pong robots; owners kept calling for help getting them working again; trying to help them return to playing led to asking what Tiger would want from a PingPong app. This is the public motivation. Do not publish claims that Newgy is gone, the old app is unavailable/nonfunctional, or Paddle Buddy is the only option.

All three existing post bodies were edited in place (URLs, flairs, and highlights preserved):

- Welcome: warm owner-confirmed origin story and invitation; retains independent/non-official app distinction.
- Feedback: short conversational prompts about what users want, with app scope stated once.
- Status: concise working/current/exploring/access reference; removes repeated origin and hardware paragraphs.
- Community description: now leads with helping existing 3050XL owners get back to playing. Removed “Newgy makes the robot.”

Public-link research was inconclusive about real-world availability: Newgy website returned a Cloudflare block in browser and HTTP 403 through web fetch; a Google Play listing remained visible. These do not establish company status or functional app availability. No such claims were added to Reddit.


## Community automation — 2026-09-20

Shawn authorized the proposed low-maintenance routine.

- Codex thread automation: `paddle-buddy-friday-check-in`, displayed as **Paddle Buddy community routine**, ACTIVE daily at 09:00 America/Vancouver. One thread heartbeat combines daily actionable-only community checks and the Friday reminder. Friday checklist: what we worked on, what we can show, and who needs a reply. Fortnightly development drafts begin September 25, 2026, based only on verified progress. No automatic development-update/reply publishing, removals, or bans.
- Monitoring uses the authenticated Reddit browser session. Mod queue access verified and Needs Review was clean during setup. Login/access failure must be reported as interrupted coverage, never as an empty queue. Checkpoint: task workspace `work/paddlebuddy-community-monitor/checkpoint.json`.
- Reddit recurring post ID `4752970`: “What are you practising with your robot this month? — {{date %B %Y}}”, Show & Tell flair, posting as u/ProjectPaddleBuddy. Starts October 1, 2026 at 09:00 Pacific; repeats monthly on the 1st. Not pinned. Verified in Scheduled Posts and Events.
- Existing Reddit safety filters verified ON: ban evasion, reputation, harassment, mature content. Crowd control is OFF, allowing new community members to participate. No additional AutoModerator rules were needed or added at setup.
- Reminders are in this Codex task, not an external calendar. Local check execution depends on available host/browser access; Reddit’s scheduled post is managed by Reddit.


## GitHub review handoff — 2026-09-20

Issue: #189. Review branch: `codex/issue-189-paddlebuddy-community-rollout`. Target: `develop` only.

The public Paddle Buddy page now includes a community section linking to the live subreddit, before the private contact form. The existing responsive story layout is reused. This website change is awaiting review/deployment.

Approved final Reddit exports are stored in `apps/web/public/paddlebuddy/community/paddle-buddy-banner-reddit-v3.png` and `paddle-buddy-icon-reddit-v3.png`. These supersede the earlier v1 community artwork. They are finished publication exports; source photographs, intermediate artwork, browser sessions, and local monitor state are not included.

The earlier community-operations commit includes a protected staff queue, feedback-state API, and Prisma migration `20260920090000_paddlebuddy_feedback_state`. Review its authentication, validation, migration and submission handling before rollout. No migration or deployment was performed in this session. A later unauthenticated admin check returned 401; this proves the auth gate responds, not that the staff queue is deployed.

Reddit configuration and scheduled posts are already live and are not deployed by Git. The Codex monitoring routine remains local to this task and is not activated by cloning the repository. Its schedule, constraints, and access dependencies are documented above. The cloud reviewer should review the code and receipts, then handle the normal develop review and separately authorized production promotion. Do not recreate the community or duplicate its posts/automation.
