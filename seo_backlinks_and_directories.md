# Upshift: backlinks and directory launch kit

Everything here needs a real person with an account (Product Hunt, G2, Trustpilot and so on). Copy below only uses facts that are on the site. Do not add ratings, user counts or awards unless they are real and you can show them.

Canonical site URL: https://www.joinupshift.com/

## Ready-to-paste copy

**Name:** Upshift

**Tagline (60 chars max):** Habit tracker that blocks apps until quests are done

**Short description (160 chars max):** Upshift turns your habits into quests. Earn XP, build streaks and keep distracting apps blocked until your daily quests are done. For iPhone and Android.

**Long description:**
Upshift is a gamified habit tracker and app blocker for iPhone and Android. Your habits become quests, you earn XP in Money, Strength, Health and Knowledge, and distracting apps stay blocked until your daily quests are done (the Quest Blocker). You can also set Block Now, Time Limits, a Work Schedule and strict mode, plan goals with micro-goals and a journal, track your time, and compete with friends on leaderboards. App blocking on iPhone is built on Apple's Screen Time, so Upshift cannot view your screen time data. Upshift offers a 7-day free trial.

**Categories to pick:** Productivity, Habit tracking, Digital wellbeing / Screen time, Self-improvement.

**Links:** App Store https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316 , Google Play https://play.google.com/store/apps/details?id=com.upshift.app , Support support@joinupshift.com

**Maker comment for launches (edit to your own voice):**
"I built Upshift because I kept opening my phone for one minute and losing an hour. Instead of just blocking apps, Upshift makes you earn them: finish your quests, get your apps back. Would love feedback on the Quest Blocker."

## Directories and profiles to claim (do these first, they are free)

Check each site's current rules and fields before submitting.

| Where | Why | Notes |
| --- | --- | --- |
| Product Hunt | Launch day traffic, a high-authority listing | Pick a weekday, prepare 4-6 screenshots and a short demo video, line up real supporters to comment (never buy upvotes) |
| AlternativeTo | Ranks for "alternative to X" searches | List Upshift as an alternative to Streaks, Habitica, Todoist (habits), Opal |
| SaaSHub | Alternatives pages | Free listing |
| G2 | Software review site, buyers research here | Claim the free profile. Only invite real users to review |
| Capterra / GetApp | Same audience as G2 | Mostly B2B; low priority for a consumer app |
| Trustpilot | Star ratings in search results | Claim profile. Ask real users for honest reviews; never write or buy reviews, it is against their rules and the law in many countries |
| Crunchbase | Entity recognition for AI and search | Company profile with website, description, founders |
| LinkedIn company page | Entity recognition | Same description as above |
| Indie Hackers | Builder community, product page | Post a build-in-public update, not an ad |
| BetaList / Uneed / similar launch lists | Cheap early links | Free tiers exist |
| Apple App Store and Google Play listings | They are the pages AI assistants and Google cite most for apps | Use the same tagline, add the website URL, keep the description consistent |
| Instagram, TikTok, YouTube, X profiles | `sameAs` signals | Put https://www.joinupshift.com/ in every bio and keep one name everywhere |

Once these profiles exist, send me the URLs and I will add them to the `sameAs` list in the site's structured data (`scripts/prerender.js` and `src/components/common/SEO/StructuredData.tsx`).

## Earning real backlinks (slower, higher value)

1. **Comparison and list pages are the link magnets.** The new articles (Upshift vs Todoist, best habit trackers, best app blockers) give journalists and bloggers something to cite. Email the editors of "best habit tracker" and "best app blocker" roundups on other sites and offer a review copy and a screenshot pack.
2. **Source requests.** Join one or more journalist-query services (for example Qwoted, Featured, Connectively) and answer questions about screen time, doomscrolling and habits. A single quoted answer can earn a link from a news site.
3. **Original data, only if real.** If you have anonymous aggregate usage data (for example average quests completed per week), publish it as a short report. Do not publish numbers you cannot back up.
4. **Free tools.** The creator tools in this repo (screen time and quest mockups) could become public, useful, linkable tools. A "what does your daily screen time cost you in a year" calculator is a classic that earns links.
5. **Guest posts and podcasts** on productivity, student and digital-wellbeing sites. Offer one genuinely useful article, not an ad.
6. **Reddit and Discord:** follow each community's rules (see `reddit_discord_rules.md`). Help first, mention Upshift only when it answers the question. Links from Reddit are nofollow, but they drive visits and AI assistants read these threads.
7. **Unlinked mentions:** search the web for "Upshift" mentions without a link and politely ask for one.
8. **Student and university digital-wellness pages:** many have "resources" lists; suggest Upshift.

## What not to do

- Buying links, link networks or "DR packages": Google treats paid link schemes as spam and it can get the site demoted.
- Fake reviews or paid upvotes on G2, Trustpilot or Product Hunt.
- Mass-submitting to hundreds of low-quality directories. A few relevant ones beat a hundred junk ones.

## Tracking

Create a simple sheet with: site, URL, date submitted, status, link type (follow or nofollow), contact. Re-run the Mented checks after deploy and again after 4-6 weeks:
- Agent readiness: https://trymented.com/agent-ready?url=www.joinupshift.com
- AI shortlist check: https://app.trymented.com/ (the score moves slowly, assistants need weeks to pick up new pages and profiles)
