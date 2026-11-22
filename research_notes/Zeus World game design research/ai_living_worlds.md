# AI-driven living worlds and AI narrators/directors: state of the art in 2026 and what is practical for a very small team

Notes compiled 22 November 2026. Every dated claim carries its source. "Estimate" means my own arithmetic from sourced prices, not a published figure. Where a figure came only from a search-result summary and I did not open the primary page, it is marked "(not opened)".

## 1. Generative agents: architecture, cost per agent-hour, failure modes, cheaper approximations

### Takeaway
The full Smallville-style loop (memory stream, reflection, recursive planning, one LLM per agent decision) is well documented, produced believable but bounded behaviour, and was priced at roughly $25 per agent-hour in 2023. Every serious follow-up (Lyfe Agents, Affordable Generative Agents, Project Sid) cut cost the same way: call the LLM rarely, let cheap rules run the body, summarise memory, and reuse earlier decisions. The research itself says agent behaviour in a fixed world is finite and can be cached.

### Cited Findings

**Smallville (Park et al., April 2023)**
- Architecture: a memory stream (natural-language log, each record with description, creation time, last-access time); retrieval scored by recency (exponential decay 0.995 per sandbox hour), importance (LLM rates each memory 1 to 10 at creation) and relevance (embedding cosine similarity), all weighted equally — [Park et al. 2023, ar5iv](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Reflection fires when the summed importance of recent events exceeds 150, about 2 to 3 times per game day; the agent asks questions of its 100 most recent records and writes higher-level insights, which can themselves be reflected on — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Planning: a daily plan of about 5 to 8 chunks, decomposed recursively to hourly and then 5 to 15 minute actions, revised when the agent reacts to something — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Scale and cost: 25 agents, two game days, gpt-3.5-turbo; authors report "thousands of dollars in token credits" and multiple days of wall-clock time — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Evidence it worked: the full architecture beat every ablation in human-rated believability (TrueSkill 29.89 versus 21.21 with no memory, planning or reflection); news of a party spread from 4% to 52% of agents; 5 of 12 invited agents actually turned up — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Failure modes the authors report: retrieval misses (agent forgets something it was told); embellishment (invented details, e.g. attributing The Wealth of Nations to a neighbour who shared the author's name); about 1.3% of awareness claims hallucinated (6 of 453); overly formal and over-agreeable speech; errors about physical and social norms (entering a closed shop, several agents using a one-person bathroom, choosing a bar for lunch); unknown robustness to prompt and memory hacking — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)

**Lyfe Agents (October 2023)**
- Puts Smallville at about $25 per agent per human hour (the authors' estimate, from a conservative $2,000 for 25 agents over two game days and an assumed 10x game speed) and its own agents at about $0.50 per agent-hour on GPT-3.5, i.e. the 10 to 100x saving claimed in the abstract — [Lyfe Agents, arXiv 2310.02172](https://arxiv.org/html/2310.02172v1)
- Three techniques: (1) option-action selection, where one LLM call picks a high-level option and subgoal and then cheap non-LLM checks (timers, repetition detection) decide when to leave it; (2) asynchronous self-monitoring, a running narrative summary updated on its own clock, separate from action selection; (3) summarise-and-forget memory in three tiers, clustering and summarising on promotion to long-term and dropping near-duplicates — [Lyfe Agents](https://arxiv.org/html/2310.02172v1)
- No measured latency figures are given; in harder scenarios agents failed to converge (mutual suspicion in the murder mystery; over half of medicine-scenario runs had no success) — [Lyfe Agents](https://arxiv.org/html/2310.02172v1)

**Affordable Generative Agents (AGA, February 2024)**
- Token cost fell to 31.1% of the Smallville baseline in a 3-agent town (4.55M to 1.42M tokens, GPT-3.5-Turbo) and to 42.7% in the 25-agent town (25.41M to 10.86M tokens) with no loss in rated human-likeness (activity 3.13 baseline versus 3.21 AGA; dialogue 3.97 versus 4.01) — [AGA, arXiv 2402.02053](https://arxiv.org/html/2402.02053v2)
- Techniques: "Lifestyle Policy" (store a plan once generated and reuse it when a new situation matches by embedding similarity above 0.97) and "Social Memory" (replace the 30 to 45 retrieved events, about 2,000 tokens per conversation prompt, with a relationship summary of about 100 tokens) — [AGA](https://arxiv.org/html/2402.02053v2)
- Input tokens dominate: baseline 4.21M input versus 0.31M output — [AGA](https://arxiv.org/html/2402.02053v2)
- Key finding for a small town: agents "can only generate finite behaviors in fixed environments" and after many trials "cease to generate new activities"; LLM randomness mostly changes wording, not behaviour — [AGA](https://arxiv.org/html/2402.02053v2)
- A community fork of the Smallville code with a cost logger reports about $18.5 for a full simulated day with 25 agents on gpt-3.5-turbo-0125 (not the original authors; not opened) — [drudilorenzo/generative_agents](https://github.com/drudilorenzo/generative_agents)

**Project Sid (Altera, 31 October 2024)**
- PIANO architecture: about 10 modules (memory, action awareness, goal generation, social awareness, talking, skill execution) run concurrently at different speeds against a shared agent state; small fast networks handle reflexes, slow deliberate reasoning handles goals; a "cognitive controller" bottleneck makes the high-level decision and broadcasts it so speech and action stay consistent — [Project Sid, arXiv 2411.00114](https://arxiv.org/html/2411.00114v1)
- Scale actually run: 50 agents for 4+ hours as a society; 500 agents for 9,000 seconds for culture; runs of 1,000+ "exceeded the computational constraints" of the Minecraft server and agents went unresponsive. No cost figures are published — [Project Sid](https://arxiv.org/html/2411.00114v1)
- Needed GPT-4o-class models; older base models could not reach the single-agent performance — [Project Sid](https://arxiv.org/html/2411.00114v1)
- Reported failure modes: hallucinations compound over successive calls and spread between agents socially; agents get stuck in repetitive action loops; speech and action drift apart (an agent promises an item and never hands it over), which misleads other agents — [Project Sid](https://arxiv.org/html/2411.00114v1)
- Emergent results: persistent job roles (which disappeared when the social module was removed), tax compliance moving with rule changes (about 20% paid, falling to about 9% after an amendment), a religion spreading between towns — [Project Sid](https://arxiv.org/html/2411.00114v1)

**a16z AI Town (2023 onward)**
- MIT-licensed starter kit inspired by Smallville; Convex is the game engine, database and vector search, PixiJS renders; LLM is swappable (local Ollama, OpenAI, Together.ai). The maintainers' own advice for slowness is to lower `NUM_MEMORIES_TO_SEARCH` to 1 to shrink conversation prompts — [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town)

**1,000-person simulation (Park et al., November 2024)**
- Different goal from a living town: each agent is an LLM plus a two-hour interview transcript of a real person; agents matched their person's General Social Survey answers 85% as well as the person matched themselves two weeks later — [arXiv 2411.10109](https://arxiv.org/abs/2411.10109); [Stanford HAI](https://hai.stanford.edu/news/ai-agents-simulate-1052-individuals-personalities-with-impressive-accuracy)

### Inferences
- A 50 to 100 citizen town does not need per-agent LLM loops. The research's own conclusion (finite behaviours, policy reuse, summaries instead of raw memory) points to: deterministic simulation drives bodies; an LLM is called occasionally and its outputs are cached and reused.
- The Smallville failure list maps directly onto live-stream risks: embellishment and retrieval misses become "the narrator said something untrue about a viewer's citizen". The 1.3% hallucination rate was measured on a 2023 model in a constrained interview; treat it as evidence the rate is non-zero, not as a current number.
- Estimate: at November 2026 small-model prices (section 6), the AGA 25-agent baseline workload of 25.41M tokens, mostly input, would cost roughly $2.50 to $3 on a $0.10 per million input model. The 2023 cost barrier has largely gone; the remaining barriers are latency, consistency and safety.
- Project Sid's speech-versus-action drift is the best argument for letting the simulation be the single source of truth and having the LLM describe, not decide.

### Gaps
- I did not confirm what simulated duration the AGA token totals cover, so the per-day cost is not stated.
- No published per-agent-hour cost for Project Sid or AI Town.
- I did not find a 2025 to 2026 paper re-measuring Smallville-style agents on current small models; the cost estimate above is mine.
- Google DeepMind's work in this area (e.g. Concordia) was not researched in this pass.

## 2. Commercial AI NPC technology and shipped or demoed games

### Takeaway
As of late 2026 the big-studio record is mostly prototypes and opt-in experimental features; the one large shipped example aimed at "living town" behaviour (inZOI's Smart Zoi) got a lukewarm reception, with reviewers unable to tell it from ordinary NPC logic and players noting heavy hardware cost. The recurring criticisms are hardware or inference cost, generic output, character drift, and hostility to generative AI among players and developers.

### Cited Findings
- inZOI (early access 27 March 2025) ships NVIDIA ACE autonomous characters as an experimental "Smart Zoi" setting — [Tech-Critter GDC 2025 recap](https://www.tech-critter.com/nvidia-gdc-2025-quick-recap/)
- Smart Zoi is an on-device small language model; it shows visible "inner thoughts" and sets autonomous schedules — [PC Gamer](https://www.pcgamer.com/games/life-sim/inzoi-is-creating-a-newfangled-life-sim-npc-that-can-grow-and-develop-its-own-personality-with-nvidias-ai-tech)
- Reception: PC Gamer's live-demo write-up was headlined that it "didn't exactly wow me" — [PC Gamer](https://www.pcgamer.com/games/life-sim/inzois-smart-zoi-ai-system-sounds-great-on-paper-but-seeing-it-in-a-live-demo-didnt-exactly-wow-me); GamesRadar said it "kinda just looks like regular NPC AI" — [GamesRadar](https://www.gamesradar.com/games/simulation/the-sims-rival-inzoi-uses-special-nvidia-ai-tech-to-power-its-characters-but-this-kinda-just-looks-like-regular-npc-ai-to-me); KrASIA called the game "gloriously unstable" and a resource hog — [KrASIA](https://kr-asia.com/inzoi-is-what-happens-when-the-sims-meets-ai-and-the-results-are-gloriously-unstable)
- Lower-confidence detail from a community wiki (not opened): the model is reported as a 0.5B-parameter Mistral NeMo Minitron variant, needs an NVIDIA RTX GPU, and had bugs such as disappearing thought bubbles and lag with several Smart Zois — [inZOI community wiki](https://thegameswiki.com/inzoi/wiki/reception-and-reviews)
- Ubisoft NEO NPC (shown March 2024, built with Inworld and NVIDIA) remained a prototype; a 2026 explainer found no shipped game crediting it — [Arcanum explainer](https://arcanumrpgs.com/blog/ubisoft-neo-npc-explained/). In the demo a female character had to be reworked for being too "flirtatious and seductive", i.e. model bias pulling a character off its brief — [Yahoo/GamesRadar](https://www.yahoo.com/entertainment/ubisoft-talks-ai-powered-npcs-205501002.html). Critical response focused on writers' work becoming raw material for imitation — [Aftermath](https://aftermath.site/ubisoft-ai-npcs/)
- NVIDIA ACE partners: Mecha BREAK was the first showcase, using an on-device 4B small language model (Nemotron-4 4B Instruct) — [NVIDIA Gamescom 2024](https://www.nvidia.com/en-gb/geforce/news/gamescom-2024-nvidia-geforce-announcements/); NARAKA: Bladepoint, PUBG ("PUBG Ally" co-playable character), inZOI and MIR5 were announced January 2025 — [Wccftech](https://wccftech.com/nvidia-ace-to-power-dynamic-ai-characters-companions-and-bosses-in-pubg-naraka-bladepoint-inzoi-and-mir5/); early coverage noted PUBG Ally was not yet greenlit for the live game — [Engadget](https://www.engadget.com/gaming/pubg-will-get-ai-powered-npcs-220218057.html)
- Commentary: executives pushing AI-written NPCs draw the charge that they undervalue authored writing — [PC Gamer opinion](https://www.pcgamer.com/gaming-industry/game-development/the-bigwigs-who-want-ai-generated-npcs-and-writing-think-youre-too-dumb-to-appreciate-a-good-story-dont-prove-them-right/)

### Inferences
- The clearest product lesson from Smart Zoi: an LLM that only picks among actions the game already had looks identical to utility AI. The visible part (the thought bubble, the line of text) is where the value was noticed. For a stream, spend the LLM on what viewers can read or hear, not on invisible decision-making.
- Commercial NPC middleware (Inworld, Convai, ACE) is built for a player talking one-to-one with a character in real time. A stream narrator with a few seconds of slack and no player conversation does not need it; a direct API call to a small model is simpler and cheaper.

### Gaps
- I found no reliable 2025 to 2026 player-reception data for NARAKA's AI teammate, Mecha BREAK or PUBG Ally, and could not confirm PUBG Ally's current status.
- Inworld and Convai pricing and customer lists were not retrieved.
- A reported Ubisoft "Teammates" prototype at GDC 2026 and a "52% of developers view generative AI negatively" survey figure appeared only on a low-authority site with inconsistent dates; treat as unverified — [aioapex](https://aioapex.com/en/blog/ubisofts-ai-teammates-can-talk-back-now-and-half-of-developers-still-dont-trust--mtxzls1i)
- The PC Gamer Smart Zoi article body could not be fetched; only headline-level reception is cited.

## 3. Classic non-LLM techniques that give most of the "alive" feeling cheaply

### Takeaway
Needs plus "advertising" smart objects (The Sims), daily schedules (Radiant AI) and storylets with prerequisites and effects (Failbetter, Emily Short) are cheap, deterministic, and proven to make observers read personality and intent into simple agents. The viewer supplies most of the story; the system's job is to give them named characters, legible motives and a few relationships to hang it on.

### Cited Findings
- The Sims: each Sim has "motives" (meters such as hunger, energy, social); objects advertise how much they satisfy each; the Sim scores every available interaction by current motive levels, personality and distance, and deliberately does not always take the top score, to avoid robotic predictability — [GMTK, "The Genius AI Behind The Sims" transcript](https://amara.org/videos/cVoJS4OdmVql/en/4330642)
- Putting behaviour on objects, not on agents, is what let Maxis add hundreds of objects without touching core AI code — [GMTK transcript](https://amara.org/videos/cVoJS4OdmVql/en/4330642)
- The Sims 3 chose actions with a modified Boltzmann distribution whose temperature is low when the Sim is happy and high when it is doing badly (unhappy Sims act more erratically), per Richard Evans' GDC talk as cited by — [Wikipedia, Utility system](https://en.wikipedia.org/wiki/Utility_system)
- Radiant AI (Oblivion, 2006): NPCs get goals and schedules and work out how to meet them; it was reportedly dialled back before release because unscripted behaviour (theft, fights) broke things, and refined in Skyrim until it was "less noticeable" — [Wikipedia, Radiant AI](https://en.wikipedia.org/wiki/Radiant_AI); [Dot Esports](https://dotesports.com/skyrim/news/elder-scrolls-6-must-bring-back-one-oblivion-feature-to-avoid-starfields-major-flaw). The scale-back account is secondhand, not a direct developer statement.
- Storylets: a unit of content with prerequisites (when it may play) and effects (how it changes world state); "simple, atomic, robust, and recombinable"; suited to games meant to run and grow for years; prototype on index cards; use a progress stat and a menace stat to rebuild classic arcs — [Emily Short, "Storylets: You Want Them", Nov 2019](https://emshort.blog/2019/11/29/storylets-you-want-them/)
- Quality-based versus salience-based: in quality-based narrative the player chooses among currently legal storylets; in salience-based narrative the system picks the most applicable one itself, as a drama manager does — [Emily Short, "Beyond Branching", Apr 2016](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)
- Apophenia: Tynan Sylvester's design position is that players perceive personality and intent where there is none, that this is what makes simulation games work, that the simulation should stay simple enough to observe and understand, and that it attaches most strongly to health and relationships; RimWorld supports it by naming every character and keeping the cast small — [Game Developer, "The Simulation Dream"](https://www.gamedeveloper.com/design/the-simulation-dream); [Rock Paper Shotgun, "How RimWorld Generates Great Stories", Aug 2016](https://www.rockpapershotgun.com/2016/08/12/how-rimworld-generates-great-stories)

### Inferences
- For 50 to 100 citizens watched from above, a needs meter per citizen, objects and buildings that advertise, a day schedule, and a small relationship table is the whole "alive" layer. It costs nothing per hour and is deterministic, which suits an event-driven simulation and makes every narrated fact checkable.
- Salience-based storylet selection is the non-LLM form of "pick the story worth telling": score candidate storylets against world state, play the best one, apply its effects, and mark it used.
- The Radiant AI story is a warning about emergent behaviour in a public setting: unscripted agent actions need a whitelist, especially when some citizens carry real viewers' names.

### Gaps
- Behaviour trees, GOAP and crowd simulation were not sourced in this pass. From general knowledge only (no citation): behaviour trees and GOAP solve moment-to-moment action sequencing for individual characters and are more than a top-down miniature town needs; flocking or flow-field movement covers crowds cheaply. A writer should source these before relying on them.
- Red Dead Redemption 2's schedule system: I found only unsourced listicles, no technical account.
- I could not confirm a freely available Game AI Pro chapter by Richard Evans on The Sims.

## 4. AI directors and storytellers: how they decide what happens and when

### Takeaway
The proven directors are small state machines over one or two numbers: an estimate of current tension, and a budget for the next event. Left 4 Dead changes how often peaks arrive, not how big they are, and forces a quiet period after each peak; RimWorld sizes events from a points budget and offers three pacing personalities. Both are a few hundred lines of deterministic code.

### Cited Findings

**Left 4 Dead AI Director (Mike Booth, Valve, 2009 talk; read from the slides)**
- Goal stated as "generate dramatic game pacing" with "peaks and valleys of intensity" — [Booth, "The AI Systems of Left 4 Dead"](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Algorithm: estimate each survivor's "emotional intensity"; track the maximum across the four; if it is too high, remove major threats for a while; otherwise create an interesting population of threats — [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Intensity rises with damage taken (proportionally), incapacitation, being pulled off a ledge, and nearby enemy deaths (inversely with distance); it decays toward zero over time, but not while the survivor is being actively attacked — [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Four states: Build Up (full threat population until intensity crosses the peak threshold); Sustain Peak (keep it up 3 to 5 seconds); Peak Fade (minimal threats until intensity decays out of peak range, so the current fight can finish before the rest timer starts); Relax (minimal threats for 30 to 45 seconds or until the team has travelled far enough), then back to Build Up — [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Boss encounters are exempt from pacing, because removing them damaged the overall rhythm — [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Stated lessons: "Algorithm adjusts pacing, not difficulty. Amplitude is not changed, frequency is"; "Simple algorithms can generate compelling pacing schedules"; timing and place of peaks differ every run — [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)

**RimWorld storytellers**
- Cassandra Classic follows a rising curve of challenge with breathing room after each push; Phoebe Chillax leaves long gaps; Randy Random ignores the curve — [RimWorld Wiki, AI Storytellers](https://rimworldwiki.com/wiki/AI_Storytellers)
- Inputs listed: colony wealth, building wealth, colonist count, animal count, whether a colonist recently died or was badly hurt, and time since the last major event — [RimWorld Wiki, AI Storytellers](https://rimworldwiki.com/wiki/AI_Storytellers)
- Threat size: Raid Points = (Wealth Points + Pawn Points) x Difficulty x Starting Factor x Adaptation Factor; buildings count at 50%; the wealth curve caps (4,200 points at 1 million wealth); floor 35, ceiling 10,000 — [RimWorld Wiki, Raid points](https://rimworldwiki.com/wiki/Raid_points)
- The adaptation factor rises over time and drops after losses, so the game eases off a colony that has just been hurt (the wiki's exact modifiers were not retrieved; a forum post describes the reset on colonist death) — [RimWorld Wiki, Raid points](https://rimworldwiki.com/wiki/Raid_points)

**Nemesis system (Middle-earth: Shadow of Mordor, 2014)**
- Any ordinary enemy can be promoted to a named character who remembers earlier encounters and refers to them; hidden stats steer drama (e.g. sending a betrayal if the player has cleared out all rivals) — [GamesRadar](https://www.gamesradar.com/shadow-mordor-nemesis-system-amazing-how-works/); [Wikipedia](https://en.wikipedia.org/wiki/Middle-earth:_Shadow_of_Mordor)
- Warner Bros. holds a patent on the system until 2036 — [TechRadar](https://www.techradar.com/gaming/shadow-of-mordors-nemesis-system-will-remain-warner-bros-property-until-2036)

**Caves of Qud sultan histories**
- The generator "first decides that a particular historical event will occur, then it rationalizes a cause" from the current state of the entities involved, using a state machine and a replacement grammar; each event is then told twice in different voices (a "gospel" and a tomb inscription) — [Grinblat and Bucklew, FDG 2017](https://pcgworkshop.com/archive/grinblat2017subverting.pdf); [Caves of Qud Wiki](https://wiki.cavesofqud.com/wiki/Sultan_history)

**Wildermyth and Dwarf Fortress**
- Wildermyth alternates hand-authored and procedural layers; Nate Austin's GDC 2022 talk was specifically on getting players attached to procedurally generated characters and avoiding moments that break that attachment — [GDC Vault listing](https://gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting)
- Dwarf Fortress runs a world simulation for a set number of years before play, then exposes the resulting record of figures, civilisations and wars as a browsable "Legends" mode — [Game Developer interview](https://www.gamedeveloper.com/design/interview-the-making-of-dwarf-fortress)

### Inferences
- For a multi-hour stream the Left 4 Dead loop transfers almost directly, with "audience intensity" replacing survivor intensity: raise it on big events, gifts and chat bursts; let it decay; after a peak, enforce a quiet stretch in which the director schedules only small, warm events and the narrator slows down. Booth's 30 to 45 second relax period is tuned for a shooter; a town stream would need minutes, to be found by testing. This is my extrapolation, not a sourced figure.
- "Adjust frequency, not amplitude" suggests keeping a fixed vocabulary of event sizes and letting the director choose spacing. "Bosses are exempt" suggests scheduled set pieces (a festival on the hour) that happen regardless of the pacing state.
- RimWorld's three storytellers show pacing personality as a product feature: the same event deck feels different under a rising-tension curve, a gentle curve, or pure chance. A stream could switch curve by time of day or audience size.
- The Qud approach (decide the event, then find a reason in existing state) fits a deterministic simulation with a narrator: the director picks a beat that the pacing needs, then selects citizens whose recorded history makes it plausible, and the narrator is handed that reason.
- The Nemesis idea of promoting an anonymous character to a named, remembered one on a trigger maps onto promoting a filler townsperson when a viewer adopts them or when they survive something notable. The patent covers a specific combination and I have not assessed its scope; a writer should not treat this note as legal clearance.
- Legends mode suggests keeping the full event log as a product in itself: a recap at the start of each stream, and a "previously" for returning viewers.

### Gaps
- Wildermyth's actual event-selection rules were not retrieved (the talk is behind GDC Vault membership).
- No step-by-step account of Dwarf Fortress history generation was found.
- RimWorld's exact event intervals per storyteller were not retrieved.
- A third-party page gives specific Left 4 Dead thresholds (stress 0.75 and so on) that do not appear in Booth's slides; I excluded them as unverified.

## 5. AI narrators and commentators: selecting events, avoiding repetition and hallucination, staying safe

### Takeaway
The commentary research and the AI-streamer track record point the same way: generate narration from a structured event feed, not from raw perception or free invention, and put more than one filter between the model and the microphone. The hardest practical problem after safety is rhythm: sequential pipelines leave long silences.

### Cited Findings
- A June 2026 demo paper (IJCAI-ECAI 2026) identifies accumulated waiting as the main latency problem: pipelines that generate one utterance, synthesise it, and only then start the next leave long gaps. Generating text in parallel with speech playback and buffering several candidate utterances cut mean silence between utterances from 9.6 seconds to 0.3 seconds, and 120 experienced players rated the rhythm significantly better — [Kawamatsu et al., arXiv 2606.13322](https://arxiv.org/abs/2606.13322)
- A robot-soccer commentary system reports that turning deterministic, rule-based event outputs into commentary, "grounded in explicit symbolic events, significantly reduces the risk of hallucinations" (not opened; from search summary) — [arXiv 2607.14809](https://arxiv.org/pdf/2607.14809)
- A 2025 survey of AI game commentary notes that discrete event spotting is attractive from an engineering standpoint because events can be turned into prompts without solving visual perception first (not opened) — [arXiv 2506.17294](https://arxiv.org/pdf/2506.17294)
- A 2025 paper pairs a lightweight event predictor with an open-source LLM (LLaMA 3.3) for game commentary (not opened) — [Mathematics 13(17) 2738](https://doi.org/10.3390/math13172738)
- "Nothing, Forever" (always-on generated sitcom): suspended from Twitch for 14 days in February 2023 after a transphobic stand-up bit. Cause given by the creators: the primary model (GPT-3 Davinci) had an outage and the system fell back to a weaker model (Curie) on which the content-moderation setup did not work. They said they would stop using that fallback and add a second moderation layer — [TechCrunch, 6 Feb 2023](https://techcrunch.com/2023/02/06/ai-generated-seinfeld-suspended-on-twitch-for-ai-generated-transphobic-jokes/)
- Neuro-sama: pipeline is an LLM producing text which a separate text-to-speech system voices; the developer has said there are many filters, some AI-powered, and that a human moderator is still needed — [Wikipedia, Neuro-sama](https://en.wikipedia.org/wiki/Neuro-sama). Banned for two weeks from 11 January 2023 for "hateful conduct", widely attributed (not confirmed by Twitch) to a Holocaust-denial remark on 28 December 2022; the developer had already tightened the filter — [Kotaku](https://kotaku.com/neuro-sama-twitch-vtuber-ban-holocaust-minecraft-ai-1849977269); [Wikipedia](https://en.wikipedia.org/wiki/Neuro-sama)
- The format can hold an audience for very long sessions: a 17-day continuous subathon ended 4 January 2025 with 41,767 subscriptions and 2.43 million watch hours; a further record on 23 December 2025 (Hype Train level 123, 118,989 subscriptions) — [Wikipedia](https://en.wikipedia.org/wiki/Neuro-sama); [Streams Charts](https://streamscharts.com/news/vedals-ai-vtuber-neuro-sama-shatters-twitch-hype-train-record-again)

### Inferences
A guardrail stack consistent with the evidence above (the components are standard practice; the assembly is my recommendation):
1. Selection is done in code, not by the LLM. Each simulation event gets a salience score (rarity, stakes, involves a viewer's citizen, continues an open thread, novelty against recently narrated events) and the top few go to the narrator. This is the salience-based storylet idea from section 3.
2. The narrator prompt contains only the selected events as structured records, with an instruction to state nothing that is not in them. Names, numbers and outcomes are slotted from the record; the LLM supplies voice and connective tissue ("templates plus polish").
3. A cheap check after generation: every proper noun in the line must appear in the event record or the citizen register; otherwise drop the line and use a template.
4. Repetition control in code: keep the last N lines and recently used openers in the prompt as "do not reuse", rotate storylet types, and cool down any citizen who was just featured.
5. Output moderation that is independent of the generating model, plus a blocklist, plus a pre-written fallback line bank. The "Nothing, Forever" incident shows the fallback path must be at least as safe as the main path: fall back to canned lines, never to a weaker unfiltered model.
6. Buffer two or three lines ahead (per the June 2026 paper) so moderation and speech synthesis time is hidden and there is always something safe to say.
- A deterministic event log is a structural advantage over Neuro-sama and "Nothing, Forever", which generate content from open-ended model output: the narrator here has a ground truth to be checked against.

### Gaps
- Neuro-sama's actual architecture, filter design and latency are not publicly documented in any reliable source I found; a November 2025 blog guessing at the underlying model is speculation.
- I found no published evaluation of how often a grounded LLM narrator still misstates an event on 2026 small models. This should be measured on the project's own logs before launch.
- AI dungeon-master systems were not researched in this pass.
- The three "not opened" papers above should be read before being quoted.

## 6. Hybrid designs and approximate current costs

### Takeaway
At official November 2026 prices, text generation for a narrator plus occasional thoughts for 50 citizens costs well under a dollar per 5-hour stream on the cheapest tier, and a few dollars on a mid-tier model with caching. Speech synthesis, not the LLM, is likely the larger line item. All dollar figures in the Inferences are my estimates from the cited price lists.

### Cited Findings

Official list prices, USD per million tokens, read 22 November 2026:
- Claude Haiku 5.5 (prompts up to 100k tokens): $0.10 input, $0.50 output, $0.01 cache read; batch $0.05 / $0.25. Claude Sonnet 5.5: $2 input, $10 output, $0.10 cache read. Claude Haiku 4.5: $1 / $5 — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Prompt caching: 5-minute cache write is 1.25x input price, 1-hour write is 2x, cache read 0.1x on most models; batch API is 50% off and stacks with caching — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Newer Claude models use a tokenizer producing about 30% more tokens for the same text — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- OpenAI: gpt-5-nano $0.05 input, $0.005 cached input, $0.40 output; gpt-5.4-nano $0.20 / $0.02 / $1.25; gpt-5-mini $0.25 / $0.025 / $2.00; batch is half price — [OpenAI pricing](https://developers.openai.com/api/docs/pricing)
- Google: Gemini 2.5 Flash-Lite $0.10 input, $0.40 output; Gemini 3.1 Flash-Lite $0.25 / $1.50; Gemini 3.5 Flash-Lite $0.30 / $2.50; Gemini 3.8 Flash $0.75 / $3.75, scheduled to double on 1 January 2027 — [Google AI Studio pricing](https://aistudio.google.com/docs/pricing)
- Speech: OpenAI tts-1 $15 per million characters (tts-1-hd $30); gpt-4o-mini-tts $12 per million audio output tokens — [OpenAI pricing](https://developers.openai.com/api/docs/pricing). Gemini 3.8 Flash-Lite TTS $6 per million audio output tokens (doubling 1 January 2027); Gemini Live audio output $12 per million tokens, equated on the page to $0.018 per minute — [Google AI Studio pricing](https://aistudio.google.com/docs/pricing)
- Research backing for the hybrid pattern: call the LLM for high-level choices only and let non-LLM checks run in between (Lyfe Agents); reuse stored decisions and replace retrieved memories with short summaries (AGA) — [Lyfe Agents](https://arxiv.org/html/2310.02172v1); [AGA](https://arxiv.org/html/2402.02053v2)

### Inferences

Narrator text, 5-hour stream (estimate). Assumptions: one line every 20 seconds, so 900 calls; each call a 3,000-token prompt (2,500 stable persona, rules and world summary, 500 fresh events) and 60 output tokens. Totals: 2.7M input, 54k output.
- Claude Haiku 5.5, no caching: about $0.27 input + $0.03 output = roughly $0.30. With the stable prefix cached: under $0.10.
- gpt-5-nano: about $0.14 + $0.02 = roughly $0.16.
- Gemini 2.5 Flash-Lite: about $0.27 + $0.02 = roughly $0.29.
- Claude Sonnet 5.5 with the 2,500-token prefix cached: about $0.23 cache reads + $0.90 fresh input + $0.54 output = roughly $1.70; without caching roughly $5.90.
- Allow up to +30% for the newer tokenizer and for retries.

Occasional thoughts for 50 citizens (estimate). Assumptions: each citizen gets one thought per 10 minutes, so 1,500 calls in 5 hours, 800 tokens in and 40 out each: 1.2M input, 60k output. On Claude Haiku 5.5 that is about $0.12 + $0.03 = roughly $0.15 per stream. Batching ten citizens into one call shares the prompt and cuts it several-fold. Because AGA found behaviour in a fixed world is finite, thoughts keyed by (trait, situation) can be cached and reused, pushing the marginal cost toward zero over time.

Speech (estimate). If the narrator talks 40% of the time, that is about 120 minutes of audio per 5-hour stream. At about 900 characters per spoken minute, OpenAI tts-1 costs roughly $1.60. Using Google's own $12 per million = $0.018 per minute equivalence (about 1,500 audio tokens per minute), Gemini 3.8 Flash-Lite TTS at $6 per million is roughly $1.10 until the January 2027 price change, then about double. Speech therefore costs several times the text.

Overall: a low-cost configuration is on the order of $1.50 to $3 per 5-hour stream, mostly speech; a premium-voice, mid-tier-model configuration is on the order of $5 to $10. Compare $25 per agent-hour for Smallville in 2023.

Design consequences:
- Keep a long stable prefix first in the prompt and the changing events last, so caching applies. A call every 20 seconds keeps a 5-minute cache warm.
- Pre-generate non-urgent material (citizen backstories, a line bank per storylet type, daily recaps) through the batch API at half price before the stream; use live calls only for what depends on live events.
- Two-tier model use: a small model for routine lines and thoughts, a better model a few times an hour for arc summaries and "the story so far".
- Engineering effort (my judgement, unsourced): salience scorer, prompt builder, proper-noun check, moderation call, line buffer and fallback bank are each small pieces of ordinary code; the hard work is tuning salience weights and pacing constants by watching real streams.

### Gaps
- All totals are estimates built on my assumed call rates and prompt sizes; real token counts should be measured.
- Latency: I found no current published time-to-first-token figures for these small models, so no latency numbers are given. The June 2026 commentary paper shows buffering hides it either way.
- Prices change often and two listed prices are already scheduled to double on 1 January 2027; recheck before budgeting.
- Third-party price aggregators disagreed with each other and with official pages; only official pages are cited here.
- Self-hosted or in-browser small models (zero marginal cost, as inZOI and Mecha BREAK do on-device) were not costed.

## 7. Risks on a live stream

### Takeaway
The two documented platform bans of AI streams both came from offensive model output slipping past a single filter layer, one of them through a fallback path. For a stream that puts viewers' names into prompts, injection through names and chat is a plausible and under-documented risk; platform rules on AI voices in live streams tightened in 2026 and need checking against TikTok's own text.

### Cited Findings
- "Nothing, Forever": 14-day Twitch suspension, February 2023; root cause was a fallback to a weaker model on which moderation failed; remedy was removing the fallback and adding a redundant moderation layer — [TechCrunch](https://techcrunch.com/2023/02/06/ai-generated-seinfeld-suspended-on-twitch-for-ai-generated-transphobic-jokes/)
- Neuro-sama: two-week Twitch ban in January 2023 for hateful conduct; Twitch's policy explicitly covers genocide denial; a word filter added beforehand did not prevent it — [Kotaku](https://kotaku.com/neuro-sama-twitch-vtuber-ban-holocaust-minecraft-ai-1849977269); [Anime News Network](https://www.animenewsnetwork.com/interest/2023-01-13/ai-vtuber-neuro-sama-banned-from-twitch-after-holocaust-denial-comment/.193761)
- Indirect prompt injection is the class of attack where instructions arrive in external data rather than from the operator — [Wikipedia, Prompt injection](https://en.wikipedia.org/wiki/Prompt_injection)
- Open-source AI-streamer projects pass viewer usernames straight into the model context: one formats recent chat as "username: message" lines — [kimjammer/Neuro Twitch integration](https://deepwiki.com/kimjammer/Neuro/4.2-twitch-integration); another sends the username to the model by default (`SEND_USERNAME` default true) — [pedrojlazevedo/twitch-chatgpt](https://github.com/pedrojlazevedo/twitch-chatgpt)
- Smallville's authors listed robustness to prompt and memory hacking as unknown, and measured hallucinated embellishment even without an adversary — [Park et al. 2023](https://ar5iv.labs.arxiv.org/html/2304.03442)
- Project Sid: hallucinations compound across calls and spread between agents — [Project Sid](https://arxiv.org/html/2411.00114v1)
- Latency: sequential generate-then-speak pipelines produced 9.6-second mean silences; parallel generation with buffering brought that to 0.3 seconds — [arXiv 2606.13322](https://arxiv.org/abs/2606.13322)
- TikTok, 2026 (secondary reporting; policy text not verified by me): shopping livestreams may not use "non-real-time verbal interaction such as AI-generated voices, audio recordings, or radio", and virtual characters may cover no more than 50% of the screen — [Social Media Today](https://www.socialmediatoday.com/news/tiktok-bans-ai-generated-voices-in-shopping-livestreams/822977/). TikTok also updated its Community Guidelines with new rules for LIVE creators and AI content — [Cybernews](https://cybernews.com/news/tiktok-updates-community-guidelines-with-new-rules-for-live-creators-and-ai-content/) (page could not be opened; headline only).

### Inferences
- Viewer names and chat text are untrusted input. Mitigations that follow from the findings: never place raw names or chat in the instruction part of a prompt; pass a citizen ID and resolve the display name in code after generation; sanitise display names (length cap, character whitelist, blocklist, moderation check) before they are shown or spoken; and never let chat text reach the narrator model without a moderation pass. Slotting the name in after generation also removes the route for an offensive username to be read out in a sentence the model built around it.
- Facts about real viewers should come only from the event record. The narrator should be barred from stating anything about a viewer-linked citizen beyond what the simulation logged, and negative events (crime, disgrace, death) involving viewer-linked citizens deserve a stricter storylet whitelist than filler townsfolk get.
- Both bans were two weeks. For a stream that depends on daily presence, one bad line can cost two weeks, which justifies redundant filters and a conservative fallback even at some cost in liveliness.
- Memory is an attack surface over many hours: if anything a viewer typed is stored and later retrieved into prompts, an injection can persist. Storing only structured events, not free text, avoids this.
- The TikTok reports concern shopping streams, but they signal the platform's direction on AI voices in LIVE. Whether a narrated simulation stream with an AI voice is affected is a question for TikTok's current guidelines, not for these notes.

### Gaps
- I found no documented incident or security write-up of prompt injection specifically through a viewer's username on a live stream; the risk is inferred from how these integrations build prompts.
- TikTok's actual current Community Guidelines for LIVE and for AI-generated content were not read directly; effective dates in secondary reports ranged from 23 May to 16 June 2026. This needs a primary-source check before launch.
- No incident reports were found for AI streamers on TikTok specifically; both documented bans are on Twitch.
- An academic study of AI VTuber fandom ("My Favorite Streamer is an LLM", arXiv 2509.10427) surfaced but was not read; it may hold audience-side findings.
