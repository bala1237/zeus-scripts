# Retention and motivation in long-running community and live-service games, and the ethical pitfalls

Researcher notes, compiled 22 November 2026. Evidence labels used throughout:

- **[Peer-reviewed]** published academic study or paper.
- **[Regulator/court]** regulator action, court filing or official statement. Court filings are allegations unless stated.
- **[Company-reported]** a figure published by the company that benefits from it; no independent check.
- **[Press]** journalism, usually quoting developers.
- **[Folklore]** practitioner blog or designer opinion with no data behind it.

Method caveat: most findings below were taken from search-result summaries of the cited pages, not from reading each page in full. Numbers flagged "single secondary source" should be checked against the original before they are quoted in anything public.

## 1. Motivation theory applied to games (SDT/PENS, Bartle, Yee, Quantic Foundry): what it predicts about collective versus individual goals

### Takeaway
The best-evidenced model (Self-Determination Theory) says games hold people by satisfying autonomy, competence and relatedness; survey models (Yee, Quantic Foundry) show "social" motivation is a separate cluster from "achievement", and that collaboration ("Community") and rivalry ("Competition") are distinct motivations. None of these sources directly tests collective goals against individual goals; that prediction is an inference.

### Cited Findings
- [Peer-reviewed] Ryan, Rigby & Przybylski (2006), "The Motivational Pull of Video Games: A Self-Determination Theory Approach", *Motivation and Emotion*, reports four studies applying SDT to game motivation and to the effect of play on well-being. — [Springer PDF, 2006](https://link.springer.com/content/pdf/10.1007%2Fs11031-006-9051-8.pdf)
- [Press, quoting author] Richard Ryan: "the psychological 'pull' of games is largely due to their capacity to engender feelings of autonomy, competence, and relatedness." — [University of Rochester news release](https://www.rochester.edu/news/printable.php?id=2719)
- [Peer-reviewed lineage] The 2006 work produced the Player Experience of Need Satisfaction (PENS) measure. — [Center for Self-Determination Theory](https://selfdeterminationtheory.org/player-experience-of-need-satisfaction-pens/)
- [Peer-reviewed] Przybylski, Rigby & Ryan (2010), "A Motivational Model of Video Game Engagement", argues both the appeal and the well-being effects of games rest on need satisfaction. — [publication record](https://pure.ewha.ac.kr/en/publications/a-motivational-model-of-video-game-engagement/)
- [Peer-reviewed] Yee (2006), "Motivations of Play in MMORPGs": survey of about 3,000 MMORPG players using 40 items derived from Bartle's types. Factor analysis gave three clusters: Achievement (progress, power, accumulation, status), Social (socialising, relationship, teamwork) and Immersion (discovery, role-play, customisation, escapism). — [DiGRA digital library](https://dl.digra.org/index.php/dl/article/view/239)
- [Peer-reviewed] Yee's key correction to Bartle: motivations "do not suppress each other as Bartle suggested". A player can be high on several at once, so Bartle's four exclusive types (achiever, explorer, socialiser, killer) are not supported as mutually exclusive categories. — [DiGRA digital library](https://dl.digra.org/index.php/dl/article/view/239); see also [Yee's own summary](https://nickyee.com/facets/5motiva.html)
- [Company research, large self-selected sample] Quantic Foundry's Gamer Motivation Model has 12 motivations in 6 pairs. The Social pair is Competition (duels, matches) and Community (interacting and collaborating). The 2015 validation used about 30,000 gamers; later company material cites 400,000 and then over 2 million. Respondents are people who chose to take an online profile. — [Quantic Foundry, July 2015](https://quanticfoundry.com/2015/07/20/how-we-developed-the-gamer-motivation-profile-v2/); [model reference PDF, 2019](https://quanticfoundry.com/wp-content/uploads/2019/04/Gamer-Motivation-Model-Reference.pdf)
- [Company research] Both Competition (r = -.28) and Community (r = -.17) decline with age, competition faster. Age explains about twice the variance gender does; competition scores show 87% overlap between genders. — [Quantic Foundry](https://quanticfoundry.com/) (figures as reported in search summary of Quantic Foundry posts)

### Inferences
- A collective city-building goal mainly serves **relatedness** (SDT) and Yee's **teamwork/relationship** components. It does not by itself serve **competence** or **autonomy**: a viewer needs to see that their own action moved something (competence) and needs a real choice about how to take part (autonomy). A named home plus a visible, attributable contribution is the usual bridge.
- Because Competition falls with age faster than Community, a design with no winners and no spend ranking should lose least among older and less competitive viewers, and most among young, highly competitive ones. This is a reading of the correlations, not a tested result.
- Since motivations co-exist rather than exclude one another (Yee), designing for "types" of viewer is weaker than giving each viewer several kinds of thing to do: collect, decorate, socialise, discover.

### Gaps
- No source found that experimentally compares collective goals against individual goals for retention. The claim "shared goals retain better" is industry folklore supported by case studies (section 3), not by controlled evidence.
- Bartle's original 1996 paper and independent replications or critiques beyond Yee were not retrieved.
- Quantic Foundry's samples are self-selected core gamers; a TikTok LIVE audience is a different population and may not match.

## 2. Progression and unlock design: gating, locked content, collection, appointment mechanics, goal-gradient, endowed progress, variable rewards

### Takeaway
Two effects are well evidenced outside games: people speed up as they near a goal (goal-gradient) and persist more when given a head start (endowed progress). Streak and "don't break the chain" mechanics also work, but through loss aversion, which is the mechanism behind the anxiety complaints. Most game-specific "best practice" on locked doors, collection sets and appointment timers is designer folklore without published data.

### Cited Findings
- [Peer-reviewed] Nunes & Drèze (2006), "The Endowed Progress Effect: How Artificial Advancement Increases Effort", *Journal of Consumer Research* 32(4), 504–512. Car-wash loyalty cards: an 8-stamp card versus a 10-stamp card with 2 stamps already given (same real effort). Over nine months, 34% of the head-start group redeemed against 19% of the plain group. — [Wharton summary](https://knowledge.wharton.upenn.edu/podcast/knowledge-at-wharton-podcast/the-lowdown-on-customer-loyalty-programs-which-are-the-most-effective-and-why/); [Coglode summary](https://www.coglode.com/nuggets/endowed-progress-effect)
- [Peer-reviewed, reported via one secondary source] Kivetz, Urminsky & Zheng (2006), goal-gradient hypothesis: café loyalty-card members bought coffee more often as they got closer to the free drink. — [secondary summary](https://www.changingminds.org/explanations/theories/endowed_progress.htm)
- [Peer-reviewed, via INSEAD summary] Silverman & Barasch, "On or Off Track: How (Broken) Streaks Affect Consumer Decisions", *Journal of Consumer Research*: people are more likely to continue a behaviour when recent repetitions are logged and shown to them; secondary accounts add that a broken streak lowers later engagement. — [INSEAD Knowledge](https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive)
- [Folklore/practitioner] A review of 859 app streak designs argues streaks are "about losing": the tone moves from encouragement to urgency over time. — [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs)
- [Folklore, no primary citation] Duolingo reportedly raised the number of 7-day-plus streaks by over 40% when it separated the streak from the daily goal, i.e. made the streak easier to keep. — [Smashing Magazine, Feb 2026](https://smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/)
- [Press] Supercell's stated founding aim was games played "for years, not just for weeks or months"; CEO Ilkka Paananen names social features as a main reason players return. Clan Games (December 2017) are shared task lists a clan completes together; Clan Capital has the whole clan build one base together. — [Game Developer, "Looking back on 10 years of Clash of Clans"](https://www.gamedeveloper.com/game-platforms/looking-back-on-10-years-of-clash-of-clans); [mobilegamer.biz, 2022](https://mobilegamer.biz/ten-years-of-clash-of-clans-milestones-missteps-and-barbarian-drool/)
- [Company-reported, via fan and press sites] Pokémon GO Global Catch Challenge (November 2017): a worldwide target of 3 billion catches in 7 days, with three milestones each unlocking a bonus for everyone (double XP, double stardust, more spawns) and a final reward (Farfetch'd worldwide). Final count 3,364,580,633. — [Game Informer, Nov 2017](https://gameinformer.com/b/news/archive/2017/11/26/pokemon-go-new-event-asks-players-to-catch-3-billion-pokemon-in-a-week-); [Niantic recap](https://pokemongo.com/post/travelrecapnov2017?hl=en)

### Inferences
- The city's shared buildings fit the tested pattern: a visible bar toward a named reward, tiered milestones that each pay out for everyone (Pokémon GO model), and a bar that never starts at zero (endowed progress). Expect contributions to accelerate near completion (goal-gradient), so pacing should assume a late surge and not read a slow middle as failure.
- Endowed progress is honest only when the head start is real or openly themed (for example "the founders laid the first stones"). Presented as fake scarcity or fake progress it becomes the "artificial advancement" the paper's own title names, and sits close to a dark pattern.
- Streak mechanics are the one well-evidenced retention tool that conflicts with "absence is never punished". Cumulative counts ("days visited: 41") keep the logged-repetition benefit without a loss on a missed day.

### Gaps
- No published retention data found for "visible locked content", collection sets, or appointment timers in the named games (Clash of Clans, Animal Crossing, Destiny, Genshin). Treat advice on these as folklore.
- No Supercell source found stating that Clan Games were designed to avoid punishing individual members. That reading is common among players but unsourced here.
- Variable-ratio reward evidence in games was only found in the loot-box/harm literature (section 7), not as a retention study.
- Kivetz et al. rests on a single secondary summary; the original paper was not read.

## 3. Collective goals, guild and clan systems, and community-wide events (WoW Ahn'Qiraj, Helldivers 2, Pokémon GO, others)

### Takeaway
The recurring pattern in successful community-wide events is a shared, visible target with a human hand steering it and a story players tell themselves; the recurring failures are opaque progress, suspicion of rigging, poor coordination tools, and one-off moments that most of the community missed.

### Cited Findings
**Helldivers 2 (Arrowhead, 2024 onward)**
- [Press, quoting studio] "Joel" is a real staff member acting as Game Master. He sets Major and personal orders, decides where enemy factions attack, and can reinforce planets or grant temporary bonus stratagems. Arrowhead says the role exists to react to player behaviour and stop the live service becoming "a calendar with automated events tied to major holidays". — [PC Gamer, 2024](https://www.pcgamer.com/games/third-person-shooter/helldivers-2-uses-its-game-master-to-stop-its-live-service-side-from-being-just-a-calendar-with-automated-events-tied-to-major-holidays)
- [Press] Arrowhead compared the role to a tabletop game master and tied it to wanting the game to run "for many years". — [GamesRadar, 2024](https://www.gamesradar.com/helldivers-2-needed-its-own-dandd-type-game-master-because-the-co-op-shooter-is-going-to-run-for-a-long-time-wed-love-to-see-it-go-for-many-years)
- [Press] Players adopted the fiction and role-play it; Joel became a community meme and a target of blame. The story is "told by the players themselves". — [TechRadar, 2024](https://www.techradar.com/gaming/helldivers-2s-greatest-asset-is-its-story-which-is-being-told-by-the-players-themselves); [Kotaku, 2024](https://kotaku.com/helldivers-2-galactic-war-game-master-joel-1851297376)
- [Press] Real collective choice: in one Major Order players chose between two rewards by which planet they liberated. — [GamesRadar, 2024](https://www.gamesradar.com/helldivers-2-game-master-joel-claps-back-with-a-tough-new-major-order-liberate-5-planets-in-3-days-to-secure-our-economic-future)
- [Press] Problem, rigging in both directions: some players believe Joel stacks the deck against them; after narrow wins others suspect he is "going easy". A developer confirmed the GM quietly helps struggling players, "short of handing you the win". — [PC Gamer](https://www.pcgamer.com/games/third-person-shooter/the-helldivers-complete-another-major-order-by-the-skin-of-their-teeth-and-some-cant-help-but-feel-joels-going-easy-on-them); [GamesRadar](https://gamesradar.com/games/third-person-shooter/as-helldivers-2-players-struggle-with-a-brutal-major-order-dev-says-gm-joel-secretly-helps-them-out-short-of-handing-you-the-win-there-isnt-a-lot-more-we-can-do)
- [Press] Problem, coordination: the game lacks in-game tools for the community to coordinate; hidden information such as supply lines was surfaced by a fan-made map. — [PC Gamer](https://pcgamer.com/games/third-person-shooter/arrowheads-latest-major-order-is-exploiting-the-helldiver-2-communitys-greatest-weakness-communication)
- [Press] Arrowhead's director set out limits on the GM's power and said the studio deliberately does not force players onto the "important" planets, because it is a casual co-op game first. — [Windows Central, 2024](https://www.windowscentral.com/gaming/helldivers-2-director-explains-the-limits-of-joel-the-game-masters-power)

**World of Warcraft, Gates of Ahn'Qiraj (2006; recreated 2020)**
- [Press/history] A server-wide "war effort": both factions had to hand in just over a million supplies before a new raid opened. The fastest servers took 19 days in 2006. — [Engadget, "WoW Archivist", April 2011](https://www.engadget.com/2011/04/19/wow-archivist-the-gates-of-ahnqiraj/); [Warcraft Wiki](https://warcraft.wiki.gg/wiki/War_Effort)
- [Press/critique] The gate-opening moment could fire in the middle of the night on an unannounced date, so many players missed the one-time event; the 2006 launch brought server crashes and long queues. Later realm-wide unlocks (Isle of Quel'Danas, Isle of Thunder) kept the shared effort but made participation predictable. — [Blizzard Watch, April 2016](https://blizzardwatch.com/2016/04/25/wow-gates-ahnqiraj-cthun/)
- [Company engineering post] For the 2020 Classic rerun, Blizzard engineers set explicit goals: prevent chain crashes, raise zone population limits, and decide how much lag was tolerable. — [Blizzard, "Engineer's Workshop"](https://worldofwarcraft.blizzard.com/en-us/news/23504702/engineers-workshop-recreating-the-ahnqiraj-war-effort)
- [Press] In the rerun one server finished the war effort in 14 hours and players still reported lag and crashes. — [Vice, 2020](https://www.vice.com/en/article/world-of-warcraft-recreates-one-of-its-biggest-events-including-broken-servers/)

**Pokémon GO**
- [Company-reported] GO Fest 2017 used a two-tier design: players worldwide unlocked a challenge, attendees in Chicago completed it, and everyone received the reward; the global reward window was extended from 24 to 27 July 2017. — [Niantic](https://pokemongo.com/post/globalchallenge-gofest?hl=en); [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_GO_Fest_2017)

### Inferences
- Why the Helldivers model worked, as far as the coverage supports: (1) one number everyone can see, (2) a named human who responds to what the crowd actually did, so outcomes feel authored and not scheduled, (3) outcomes that can be lost, which makes wins mean something, (4) a fiction light enough for players to play along.
- For a single streamer, the streamer already is the game master. The transferable lessons are the failure modes: publish the rule for how progress is counted, admit when a thumb is on the scale, and keep a visible record of what the community chose.
- Ahn'Qiraj shows a 14-hour to 19-day spread for the same target depending on community size and preparation. Fixed collective targets are badly calibrated for an audience whose size is unknown; targets should scale with the active audience or be tuned live.
- A one-time spectacle should be scheduled and announced, with a replay or lasting marker for those absent. Ahn'Qiraj is remembered fondly and is also the standard example of content most players never saw.
- Helldivers can afford real failure because losing a planet takes nothing from an individual. Under a "nothing earned is taken away" rule, the equivalent of failure is delay or a different branch, not loss.

### Gaps
- Nothing retrieved on Final Fantasy XIV, Splatoon Splatfests, Noita or Elden Ring community moments; these remain uncovered.
- No retention figures tied to Helldivers 2 Major Orders or to WoW server events; all evidence here is qualitative press coverage, mostly from 2024.
- No Arrowhead post-mortem or GDC talk was found; later changes to the Galactic War (2025–2026) are not reflected.

## 4. Seasons, live events and one-time spectacles: retention effect and the content treadmill

### Takeaway
One-time live events reliably produce record attendance peaks, but there is no public evidence here that they raise long-term retention, and the best-documented seasonal model (Destiny 2) produced acknowledged player burnout and FOMO even with a large studio behind it.

### Cited Findings
- [Company-reported] Fortnite's Galactus event (December 2020) peaked at 15.3 million concurrent players, with 3.4 million more watching on Twitch and YouTube. — [GamesRadar, Dec 2020](https://gamesradar.com/fortnite-hits-153-million-concurrent-players-in-biggest-live-event-ever); [GameSpot](https://gamespot.com/articles/fortnites-marvel-galactus-event-sets-new-concurrent-player-record/1100-6485054/)
- [Company-reported] Travis Scott "Astronomical" (April 2020): 12.3 million concurrent at the first showing; 27.7 million unique players took part 45.8 million times across five showings, so repeat showings materially widened reach. — [GamesRadar, April 2020](https://gamesradar.com/fortnite-travis-scott-event-sees-123-million-players-in-first-show); [GameSpot](https://www.gamespot.com/articles/fortnite-sets-new-records-with-travis-scott-event/1100-6476508/)
- [Company-reported] "Remix: The Finale" (30 November 2024) drew over 14 million concurrent players and over 3 million stream viewers. — [Music Business Worldwide](https://musicbusinessworldwide.com/fortnites-remix-the-finale-concert-draws-over-14m-players-breaking-records)
- [Press, quoting Bungie] In early 2020 Destiny 2's director said the studio was trying to fix the FOMO problem created by seasonal content that disappears. — [Kotaku, 2020](https://kotaku.com/destiny-2-lead-says-theyre-trying-to-fix-the-fomo-probl-1841936370)
- [Press] By late 2022 players were described as "over" the seasonal model; Steam counts hit a then-historic low at the end of Season of Plunder. Game director Joe Blackburn acknowledged the burnout ("your words are not falling on deaf ears"). — [PC Gamer](https://pcgamer.com/for-many-destiny-2-players-season-of-the-plunder-was-a-season-of-burnout-and-its-only-going-to-get-worse); [GamesRadar](https://gamesradar.com/destiny-2-game-director-addresses-seasonal-burnout-your-words-are-not-falling-on-deaf-ears)
- [Press, quoting Bungie] Bungie conceded its story structure "may have become predictable" when moving from seasons to episodes. — [PC Gamer](https://pcgamer.com/destinys-story-structure-may-have-become-predictable-admits-bungie-as-it-pivots-to-episodes-to-pleasantly-surprise-players-more-often)
- [Press, quoting Bungie] After The Edge of Fate (2025), following four months of falling player numbers, Bungie said the new direction "was the wrong path for Destiny". — [PC Gamer](https://pcgamer.com/games/fps/this-was-the-wrong-path-for-destiny-after-4-months-of-dwindling-players-and-community-outrage-bungie-admits-that-the-edge-of-fates-bold-new-vision-for-destiny-2-was-a-mistake)

### Inferences
- The Travis Scott numbers are the most useful for a small project: the same event shown five times reached more than double the first-showing audience. Repeat showings recover most of the people a single time slot loses, without removing the sense of occasion.
- Destiny's trajectory shows two separate failure modes: content that expires creates obligation (FOMO), and a fixed seasonal template becomes predictable. A hand-run, reactive model (section 3) addresses the second; permanent rewards address the first.
- If a studio of Bungie's size could not sustain the treadmill without burnout on both sides, a one-person or small-team project should plan for few, large, repeatable moments built from systems (collective targets, votes, community-chosen builds) and not from a stream of new hand-made content.

### Gaps
- No independent study found measuring retention after live events or seasons; peak concurrency is not retention.
- No figures retrieved on the production cost of seasonal content or on developer burnout specifically.
- Fortnite events from 2025–2026 were not covered by the search.

## 5. Social identity and status: titles, housing, cosmetics, named contributions, leaderboards

### Takeaway
Leaderboard research is mixed but consistently finds that public absolute rankings risk discouraging people at the bottom; no evidence was found in this pass on housing, titles or named monuments as retention tools, so those remain supported by motivation theory and case examples only.

### Cited Findings
- [Peer-reviewed, via review] Domínguez et al. (2013): high leaderboard positions raise motivation, low positions harm it. — cited in [Internet Research review, 2023](https://www.emerald.com/intr/article/33/7/1/178330)
- [Peer-reviewed, via review] Counter-findings: in one educational game low-ranked learners reported more competitive effort and better retention than high-ranked ones; extroverted and agreeable people did not lose motivation at the bottom. — [Internet Research review, 2023](https://www.emerald.com/intr/article/33/7/1/178330)
- [Peer-reviewed] Absolute leaderboards (everyone's rank visible) create competition but risk discouraging lower-ranked users; relative leaderboards showing only a user's near neighbours are less studied but may reduce that. — [NSF-hosted paper](https://par.nsf.gov/servlets/purl/10510520)
- [Peer-reviewed mapping study] A systematic mapping of negative gamification effects in education software lists leaderboard-driven demotivation among recurring harms. — [arXiv 2305.08346, 2023](https://arxiv.org/pdf/2305.08346)
- [Peer-reviewed] Yee's Achievement cluster includes "status" as its own component, separate from progress and accumulation; Immersion includes "customisation". — [DiGRA digital library](https://dl.digra.org/index.php/dl/article/view/239)
- [Company research] Quantic Foundry treats Community (collaboration) as distinct from Competition, and reports competition motivation falls with age. — [Quantic Foundry, 2015](https://quanticfoundry.com/2015/07/20/how-we-developed-the-gamer-motivation-profile-v2/)

### Inferences
- The existing rule against on-screen money and spend rankings matches the evidence: a spend leaderboard is an absolute leaderboard on the one dimension most viewers cannot compete on, so it should discourage the majority while rewarding a few.
- Status that is not rank-ordered (a named home, a title describing a role, a name on a building the person helped fund, tenure such as "citizen since day 12") gives Yee's status and customisation motives an outlet without a bottom of the table. This is inference; no study of it was found.
- If any ranking is wanted, the lower-risk forms on the evidence are relative (near neighbours only), group-level (the city against its own past), or based on free actions.

### Gaps
- No evidence found on player housing, titles, cosmetics or named monuments and their effect on retention or on non-payer alienation.
- Hamari, Koivisto & Sarsa (2014), "Does Gamification Work?", was searched for but not retrieved; its conclusions are not cited here.
- No evidence found on how non-paying viewers react to visible paid cosmetics in a shared space.

## 6. Viewer loyalty systems on streams (channel points, sub streaks, loyalty currencies)

### Takeaway
The only quantified claim found is Twitch's own figure of up to 18% more viewing time on large channels with Channel Points; there is no independent or peer-reviewed study of loyalty currencies and return rate, so their effectiveness is platform-reported and otherwise folklore.

### Cited Findings
- [Company-reported, no method given] Twitch says channels with a large audience that enabled Channel Points saw up to an 18% increase in time spent by viewers, and up to a 13% rise in chat participation. No sample, comparison group or method is published. — [Twitch Creator Camp](https://twitch.tv/creatorcamp/en/paths/establish-your-brand/new-viewer-retention)
- [Company research, with its own caution] A 2016 Twitch data-science post on viewing and game retention warned that the link could be selection (already-loyal users watch more) and not cause. The same caution applies to any channel-points claim. — [Twitch blog, July 2016](https://blog.twitch.tv/en/2016/07/13/game-creator-success-on-twitch-hard-numbers-688154815817)
- [Vendor claim] StreamElements describes its loyalty points as improving interaction and retention; this is product marketing. — [StreamElements help centre](https://support.streamelements.com/hc/en-us/articles/10474478470290)
- [Folklore] Streamer-advice blogs recommend channel-point rewards for retention on anecdote alone. — [StreamHub blog](https://streamhub.world/streamer-blog/twitch/4562-how-to-maximize-twitch-channel-points-for-viewer-retention/)
- [Regulator] A watch-to-earn rewards scheme on TikTok itself was treated by the EU as a potential addiction risk and permanently withdrawn in August 2024 (details in section 7). — [European Commission statement, 5 Aug 2024](https://luxembourg.representation.ec.europa.eu/actualites-et-evenements/actualites/tiktok-commits-permanently-withdraw-tiktok-lite-rewards-programme-eu-comply-digital-services-act-2024-08-05_en)

### Inferences
- A currency earned by watching and chatting is a plausible but unproven retention tool. The 18% figure is an upper bound ("up to"), for large channels, with unknown selection effects; it should not be used as a forecast.
- The same mechanic sits on a regulatory fault line: rewarding time-on-platform is exactly what the EU objected to in TikTok Lite. A currency that rewards participation (a chat message, a vote, a tap that does something) is easier to defend than one that pays for minutes watched, and it also serves competence better.

### Gaps
- No independent study found on channel points, sub streaks or third-party loyalty currencies and their effect on watch time or return rate.
- No data found for TikTok LIVE specifically (as opposed to Twitch).
- No evidence found on whether sub streaks or watch streaks cause the anxiety documented for app streaks.

## 7. Ethical pitfalls and backlash: pay-to-win, loot boxes, FOMO, streaks, dark patterns, and live-stream gifting pressure

### Takeaway
Regulators have now acted against purchase-flow dark patterns (Epic, US$245M), undisclosed loot-box odds and sales to minors (HoYoverse, US$20M) and watch-to-earn rewards (TikTok Lite, EU), and TikTok LIVE gifting is itself the subject of multiple US state lawsuits alleging exploitation of minors. Research on gifting finds the parasocial relationship is the main driver of spending, and that competitive formats ("battles") add pressure to give.

### Cited Findings
**Frameworks**
- [Peer-reviewed] Zagal, Björk & Lewis (2013), "Dark Patterns in the Design of Games", FDG 2013, pp. 39–46: defines dark game design patterns as design elements that serve the creator's interests where these diverge from the player's, with examples and guiding questions for spotting them. — [Chalmers research record](https://research.chalmers.se/en/publication/177148); [bibliographic record](https://bibtex.github.io/FDG-2013-ZagalB0.html)
- [Peer-reviewed critique] Deterding, Stenros & Montola (2020), "Against 'Dark Game Design Patterns'", DiGRA 2020: argues the concept is unproductive for ethical analysis and that the 2013 examples are biased toward one historical idea of what games should be. — [White Rose eprint](https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf)
- [Peer-reviewed editorial, not an empirical study] King & Delfabbro (2018), *Addiction*: "predatory monetisation" means purchasing systems that disguise or withhold the long-term cost until the player is already financially and psychologically committed. — [Flinders University record](https://researchnow.flinders.edu.au/en/publications/predatory-monetization-schemes-in-video-games-eg-loot-boxes-and-i/)
- [Government inquiry summarising the above] Loot boxes encourage repeat spending through intrusive, unavoidable solicitations, limited product disclosure and manipulated reward outcomes, and bring gaming closer to gambling. — [Australian Senate committee report, chapter 3](https://aph.gov.au/Parliamentary_Business/Committees/Senate/Environment_and_Communications/Gamingmicro-transactions/Report/c03)
- [Peer-reviewed] King & Delfabbro followed with a 2019 blueprint of protective measures; Xiao & Henderson (2021) published a commentary proposing an ethical-design response. — [Durham repository](https://durham-repository.worktribe.com/output/1263760/towards-an-ethical-game-design-solution-to-loot-boxes-a-commentary-on-king-and-delfabbro)

**Regulatory actions**
- [Regulator] Epic Games (Fortnite): US$520M total announced December 2022, comprising US$275M for children's privacy and US$245M in refunds for dark patterns that tricked players into unwanted purchases. — [PBS NewsHour, Dec 2022](https://www.pbs.org/newshour/nation/fortnite-maker-epic-games-to-settle-ftc-case-pay-520-million-in-penalties-and-refunds)
- [Regulator] The order was finalised 14 March 2023 and bars Epic from charging through dark patterns or without affirmative consent. — [TechCrunch, March 2023](https://techcrunch.com/2023/03/15/ftc-fortnite-epic-games-purchases-settlement/amp/)
- [Regulator] First refund round of more than US$72M sent in December 2024. — [FTC press release, Dec 2024](https://ftc.gov/news-events/news/press-releases/2024/12/ftc-sends-refund-payments-consumers-impacted-epic-games-unlawful-billing-practices?os=w)
- [Regulator] HoYoverse (Genshin Impact), January 2025: US$20M; alleged children's-privacy violations and misleading players about the odds of top loot-box prizes. Remedies: no loot-box sales to under-16s without parental consent, a way to buy loot boxes directly with real money (not only through layered virtual currency), and clear odds disclosure. — [FTC business guidance blog, Jan 2025](https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse); [Pocket Gamer.biz](https://www.pocketgamer.biz/hoyoverse-agrees-to-20-million-settlement-with-ftc-over-loot-boxes)
- [Company response] HoYoverse admitted no wrongdoing and called many allegations inaccurate. — [Hitmarker, Jan 2025](https://hitmarker.net/news/genshin-impact-developer-hoyoverse-pays-20-million-to-settle-inaccurate-ftc-child-privacy-and-deception-complaint-2889257)
- [Regulator] TikTok Lite Rewards (points for watching and engaging): launched in France and Spain April 2024; the European Commission opened Digital Services Act proceedings on 22 April 2024 citing addictive potential and risk to physical and mental health; TikTok suspended it on 24 April; on 5 August 2024 TikTok's commitment to withdraw it permanently and not launch an equivalent was made binding. First case closed under the DSA. — [European Commission](https://luxembourg.representation.ec.europa.eu/actualites-et-evenements/actualites/tiktok-commits-permanently-withdraw-tiktok-lite-rewards-programme-eu-comply-digital-services-act-2024-08-05_en); [TechCrunch, Aug 2024](https://techcrunch.com/2024/08/05/tiktok-lite-eu-closes-addictive-design-case-after-tiktok-commits-to-not-bring-back-rewards-mechanism)

**Live-stream gifting**
- [Peer-reviewed, CHI 2018 extended abstract] Six motivations identified for giving money to a streamer. Parasocial relationship correlated with all three kinds of support (emotional, instrumental, financial); social presence only with instrumental and financial. — [NJIT research record](https://researchwith.njit.edu/en/publications/explaining-viewers-emotional-instrumental-and-financial-support-p/)
- [Peer-reviewed, small qualitative study] Qiu & Klug (2021), 12 interviews with Douyin gift-givers: gifts act as appreciation and support inside a parasocial relationship, and viewers also gift to help a host win a live competition, which carries implicit expectations. — [AoIR Selected Papers](https://spir.aoir.org/ojs/index.php/spir/article/view/12194)
- [Peer-reviewed] 2025 study: the link from parasocial relationship to gifting intention runs through expected relationship development and image building, and is stronger for more popular streamers. — [Journal of Retailing and Consumer Services, 2025](https://ideas.repec.org/a/eee/joreco/v87y2025ics0969698925002152.html)
- [Peer-reviewed] Gift-giving intention analysed through social exchange theory; the authors note research on gifting remains thin. — [PMC article](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10793923/); [Frontiers in Psychology, 2022](https://www.frontiersin.org/articles/10.3389/fpsyg.2022.953484/pdf)
- [Investigative journalism] BBC (October 2022): followed 30 accounts streaming from Syrian camps where families begged for gifts; some streams drew up to US$1,000 an hour; in the BBC's test TikTok kept 69% of gift value; middlemen supplied phones and took commission. TikTok disputed the 70% figure, banned the accounts after being contacted, and promised stronger policy on exploitative begging. — [Fortune, Oct 2022](https://fortune.com/2022/10/12/tiktok-china-exploitation-bytedance-children-livestreaming-refugees-charity-donations-syria-bbc/); [The New Arab](https://english.alaraby.co.uk/news/tiktok-takes-70-syrians-live-appeal-funds-report)
- [Court filings, allegations] Utah's unsealed complaint (reported January 2025): an internal review, "Project Meramec", found 112,000 children aged 13–15 hosting or appearing on LIVE in January 2022 alone (reports differ on the exact measure); adults were alleged to pay minors through gifts to pose or strip; "Project Jupiter" examined money laundering through gifting. — [Route Fifty, Jan 2025](https://route-fifty.com/digital-government/2025/01/new-court-records-claim-tiktok-knew-its-live-feature-was-used-groom-children/401956); [Gizmodo](https://gizmodo.com/utah-ag-accuses-tiktok-of-knowing-minors-were-being-groomed-on-live-2000545608)
- [Court records, reported October 2026] NPR reporting on newly released records says staff raised child-safety alarms about LIVE and executives failed to act; lawsuits from Utah, Vermont, New Hampshire, Kentucky and the District of Columbia focus on LIVE. Reported settlements: US$8M with a Kentucky school district and US$100M with Alabama (September 2026). — [OPB/NPR, 20 Oct 2026](https://www.opb.org/article/2026/10/20/tiktok-staff-raised-child-safety-alarms-and-were-ignored/)
- [Court filing] District of Columbia complaint against TikTok, October 2024 (public redacted version). — [DC Attorney General](https://oag.dc.gov/sites/default/files/2024-10/2024.10.08%20DC-TikTok%20Complaint%20%5BPUBLIC-REDACTED%5D.pdf)
- [Company response] TikTok says the complaints cherry-pick misleading quotes and outdated documents out of context. — [Route Fifty, Jan 2025](https://route-fifty.com/digital-government/2025/01/new-court-records-claim-tiktok-knew-its-live-feature-was-used-groom-children/401956)
- [Press] After the BBC report TikTok moved to bar under-18s from hosting livestreams. — [Arab News](https://www.arabnews.com/media/tiktok-to-ban-children-under-18-from-livestreaming-2185006)

**Streaks and FOMO**
- [Folklore/commentary] Design writers attribute streak retention to loss aversion and note it can produce anxiety and "unhealthy attachment"; whether Duolingo-style streaks count as a dark pattern is disputed between commentators. — [UX Magazine](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design); [Smashing Magazine, Feb 2026](https://smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/)
- [Press] Destiny 2's own director named FOMO from expiring content as a problem to fix. — [Kotaku, 2020](https://kotaku.com/destiny-2-lead-says-theyre-trying-to-fix-the-fomo-probl-1841936370)

### Inferences
- The project's existing rules map closely onto what regulators and researchers object to: no loss on absence (against streak anxiety and FOMO), nothing taken away (against sunk-cost pressure), no spend rankings (against whale competition), no solo winner (against battle-style escalation).
- The largest remaining exposure is not inside the game design; it is the gifting layer. Research says spending is driven by the parasocial bond and by wanting to help the host "win". Any moment where the streamer or the on-screen city visibly reacts more warmly to gifts than to free actions, or where a collective bar is about to fall short and only gifts can close it, recreates battle pressure even with no leaderboard.
- Three concrete tests follow from the cases: (1) the real-money cost of anything must be plain and not hidden behind layers of currency (HoYoverse remedy; King & Delfabbro definition); (2) no reward for raw minutes watched (TikTok Lite); (3) no purchase by a single ambiguous tap (Epic).
- Minors are the sharpest legal and ethical risk on this platform specifically. TikTok's own age rules for gifting should be treated as a floor, and the design should not single out or publicly thank individual gifters in ways that invite children to seek the same attention.
- Zagal et al. is a useful checklist but contested (Deterding et al.); the more practical test is King & Delfabbro's: is the long-term cost hidden until the person is committed?

### Gaps
- No peer-reviewed study or investigative report was retrieved specifically on TikTok LIVE "battles" and spending harm (debt, compulsive gifting). The Douyin interview study is the closest evidence that competitions drive gifting. This is a notable hole given how central battles are to the brief.
- No empirical evidence retrieved on "whale" concentration of spending in live-stream gifting.
- No peer-reviewed evidence retrieved on streak anxiety (Snapchat, Duolingo) or on daily-login rewards as a dark pattern; what exists here is commentary.
- EU consumer-protection guidance on in-game virtual currencies (2025) and the UK position on loot boxes were searched for but not retrieved.
- King & Delfabbro's full text was not read; the definition is taken from the abstract and the Senate summary.
- The Utah and other state claims are allegations in litigation; settlements reported do not establish the facts alleged.

## 8. "Idle" and "cozy" design that respects absence and still retains players

### Takeaway
Animal Crossing: New Horizons deliberately softened the series' earlier punishment of absence (weeds, scolding), and its developers discourage but do not shame clock-skipping; however no data was found showing that absence-respecting design retains players as well as or better than punishing design, so this remains a values-led choice supported by example.

### Cited Findings
- [Press, hands-on test] Earlier Animal Crossing games "notoriously reprimanded" absent players with unmanageable weeds; a player returning to a long-abandoned New Horizons island found it was not overrun. The piece observes that tending the island is a chore "you can always put off till next week". — [Kotaku, Aug 2020](https://kotaku.com/what-happens-when-you-abandon-your-animal-crossing-new-1844574997)
- [Press, quoting developers] Director Aya Kyogoku and producer Hisashi Nogami said they think playing in real time without clock-skipping is best in the long run, but are not trying to make players feel bad for doing otherwise. — [GamesRadar, 2020](https://gamesradar.com/animal-crossing-new-horizons-developers-think-playing-without-time-travels-best-in-the-long-run)
- [Press, quoting developers] New Horizons added features that allow instant change inside a real-time game, loosening the series' one-thing-per-day pacing. — [Game Developer](https://gamedeveloper.com/design/why-nintendo-s-new-i-animal-crossing-i-features-allow-instant-change-in-the-real-time-game)
- [Press, counter-example] Nintendo sent lapsed New Horizons players an email in which villagers appeared to guilt them about being away; it was reported as a guilt trip. — [TheGamer](https://www.thegamer.com/nintendo-animal-crossing-new-horizons-hiatus-guilt-trip-email/)
- [Commentary, counter-view] An essay argues weeds should stay because visible passage of time is part of what makes the place feel alive. — [Kill Screen](https://killscreen.com/rip-animal-crossing-weeds)
- [Press] Arrowhead chose not to force players toward priority objectives because Helldivers 2 is "a casual co-op shooter first"; a parallel case of protecting low-commitment play inside a collective game. — [Windows Central, 2024](https://www.windowscentral.com/gaming/helldivers-2-director-explains-the-limits-of-joel-the-game-masters-power)

### Inferences
- Animal Crossing separates two things that are easy to conflate: the world visibly changing while you are away (which makes it feel alive and gives a reason to look in) and the player being penalised for being away. The first can be kept without the second: on return, show what happened and what the returning citizen's home gained, not what they lost.
- The guilt-trip email shows that punishing absence can creep back in through messaging even when the game rules are gentle. Return prompts, streamer call-outs and notifications need the same rule as the mechanics.
- Real-time pacing (things take a real day) is the cozy genre's appointment mechanic, and it works without a penalty because the reward waits. "It will still be there" is the difference between an appointment and a deadline.

### Gaps
- No retention data found for Animal Crossing or any cozy game comparing gentle and punishing treatment of absence.
- Nothing retrieved on idle/incremental games (offline progress, "welcome back" rewards) and their retention; this part of the question is unanswered.
- The developers' own stated reasoning for reducing weed and absence penalties was not found; the change is documented by observation, not by a design statement.
