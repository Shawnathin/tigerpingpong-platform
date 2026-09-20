# Project Paddle Buddy community rollout package

Status: ready to configure after Owner signs in to Reddit. Do not create or publish the community, seed posts, or first announcement until the live landing page and intake have been checked in the production environment.

## Intake readiness

The existing `/paddlebuddy` form writes a durable `paddle_buddy_submissions` row before attempting an email notification. It records email, intent, update opt-in, early-testing interest, 3050XL access, device, playing level, message and creation time. Support, bug and feature requests have distinct intents; a support request with `wantsUpdates: false` remains non-marketing consent.

The protected Tiger staff admin now has a **Paddle Buddy** queue. It keeps this work in the existing platform rather than creating a separate CRM. The queue shows an internal digest for update opt-ins, early-testing interest and confirmed 3050XL access, and uses `New`, `Reviewing`, `Considering`, `Planned`, and `Shipped` as internal feedback labels. These labels are not public commitments.

## Reddit setup package

Target: `r/ProjectPaddleBuddy`.

Before creating it, verify that exact name is available. If it is unavailable, stop and ask Owner for the naming decision. Owner must complete Reddit login and any 2FA; do not request credentials.

Configuration:

- Community type: public; NSFW: off.
- Description: `The development community for Project Paddle Buddy — a small Tiger PingPong side project for Robo-Pong 3050XL practice. We’re building it in public, carefully.`
- Website: `https://tigerpingpong.ca/paddlebuddy`
- Use the approved Paddle Buddy app captures as the visual source. A clean crop of the existing home/connect screen is suitable for the icon; a wide crop of the connection screen with Tiger orange/navy treatment is suitable for the banner. Do not introduce stock imagery.
- Post flair: `Development Update`, `Beta`, `Feature Idea`, `Bug / Problem`, `Question`, `Show & Tell`.

Rules (keep the list short):

1. Keep it about Paddle Buddy or robot practice.
2. Be useful and civil.
3. Bug reports should include enough detail to reproduce when possible.
4. No spam or unrelated promotion.
5. Do not post personal information or private beta material marked private.

## Seed post 1 — pin: Start here

**Title:** We made a thing for the 3050XL. Apparently we’re doing it publicly now.

We started building a small side project for the Robo-Pong 3050XL because we wanted a simpler way to connect, run drills, and get back to playing.

We needed a temporary name. “Paddle Buddy” was what we wrote down. It escaped into documentation, then people started asking us how to get it. That is how a temporary name becomes a problem for future us.

The app is still in development. The current build connects to the robot and runs drills; we’re refining reliability and the drill experience before bringing more people in. It is a Tiger PingPong side project, not a Newgy product or an official Newgy app.

You can see the current project here: https://tigerpingpong.ca/paddlebuddy

Questions, bugs, and feature ideas are welcome here or through the form on that page. App support is handled in writing through the project, not through Tiger’s sales phone line.

What would make your robot practice less fiddly and more useful?

## Seed post 2 — pin: What do you want from this?

**Title:** If you use a 3050XL, what do you actually want it to do better?

We have opinions. You have the robot in your space. Yours are more useful right now.

What do you wish you could do with your 3050XL? What annoys you enough that you stop using it? What would make practice easier or more useful?

No twenty-question survey hiding below this post. Just tell us the thing.

If you would like to be considered for a small future testing group, use the development-list form: https://tigerpingpong.ca/paddlebuddy

Signing up is interest, not a promise of access. We’ll choose early testers for useful setup and device coverage, not signup speed.

## Seed post 3 — pin: Current development status

**Title:** Current development status: what exists, what we’re working on, what is still early

Small and honest version:

- **Working in development:** connection to the Robo-Pong 3050XL and running drills.
- **Current focus:** reliability and the experience of getting into and running drills.
- **Planned:** a more guided warm-up system.
- **Exploring / considering:** an adaptive layer that could help shape future practice suggestions over time.

This is a development project, so details can change. We will update this when the public state materially changes, rather than inventing progress percentages or dates.

## First Tiger announcement — pending approval

We’ve been working on something for the Robo-Pong 3050XL.

It started as a little side project: a simpler way to connect, run drills, and get on with practice. We needed a temporary name, called it Paddle Buddy, and then made the mistake of putting that name in documentation.

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
