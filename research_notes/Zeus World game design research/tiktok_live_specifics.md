# TikTok LIVE specifics for an interactive, audience-driven game (researched 22 Nov 2026)

Reading note for the report writer. TikTok's own pages (Help Center, LIVE Creator Hub, Creator Academy) are rendered by script and returned empty to the fetch tool in this session. Where an official page is cited below, the wording came from a search-engine extract of that page or from a third party quoting it, and is labelled as such. Nothing here was read directly off a rendered TikTok policy page. Before any design decision relies on exact wording, the owner should open the linked official pages in a browser. Claims from vendors of TikTok game tools are flagged as vendor claims.

## 1. LIVE features: how LIVE Matches / battles work

### Takeaway
A LIVE Match is a co-host mode where creators or teams compete on points for a short timed round, with points coming from gifts (the host can restrict it to specific gifts) and with viewer-held "power-ups" (boosting glove, magic mist, and others) that multiply or hide the score. The published official detail is thin; durations, whether likes count, speed-challenge rules, MVP and win-streak mechanics could not be confirmed from an authoritative source in this session.

### Cited Findings
- TikTok's Help Center describes LIVE Match as a co-host mode in which creators or teams complete challenges against each other and the creator or team with the most points wins; it offers a solo match (everyone competes individually) and a team match. (Search extract of the official page, Nov 2026.) — [TikTok Help: LIVE match](https://support.tiktok.com/nl/live-gifts-wallet/tiktok-live/live-match)
- The host can choose whether all gifts or only specific gifts count towards the score; in a specific-gift match, other gifts and likes still happen but "don't affect the final scores". (Search extract of the official page; this wording implies likes may count in an all-gifts match, but that is not stated outright.) — [TikTok Help: LIVE match](https://support.tiktok.com/nl/live-gifts-wallet/tiktok-live/live-match)
- A third-party guide states that both gifts and likes count as points and lists team formats 1v2, 1v3 and 2v2; not confirmed against TikTok's page. — [TikFinity blog: How to Start and Win a LIVE Battle](https://blog.tikfinity.com/?p=2195)
- A third-party guide gives 5 minutes as the default round length, while noting TikTok publishes very little documentation on battle mechanics. — [ttcalculator: TikTok Live Battles](https://ttcalculator.net/learn/tiktok-live-battles/)
- Boosting glove (official Creator Academy wording via search extract): it multiplies match points from gifts for 30 seconds; "A boosting glove grants up to 30% chance of triggering x5 points every time your creator receives a gift in a match." — [TikTok LIVE Creator Hub: Introduction to PK LIVE Match](https://www.tiktok.com/live/creators/en-MY/article/introduction-to-pk-live-match?name=Beginner)
- Magic mist hides your match points from the opponent for 30 seconds (Creator Academy via search extract). — [TikTok LIVE Creator Hub: Introduction to PK LIVE Match](https://www.tiktok.com/live/creators/en-MY/article/introduction-to-pk-live-match?name=Beginner)
- Power-ups are randomly distributed to the top three contributors of the winning creator or team in a match; those viewers can then send them in later matches (Creator Academy via search extract). — [TikTok LIVE Creator Hub: Introduction to PK LIVE Match](https://www.tiktok.com/live/creators/en-MY/article/introduction-to-pk-live-match?name=Beginner)
- TikTok's own @tiktoklive account promoted "Match Power-Up" and the Boosting Glove in a video (video ID dates it to around March 2023). — [@tiktoklive video](https://www.tiktok.com/@tiktoklive/video/7213949960327318785?lang=en)
- A third-party tool vendor describes timed x2/x3 multiplier phases at match level, observed to last "roughly 30 to 50 seconds"; says the glove is applied gift by gift (raw data carries a per-gift "critical" flag), so two identical gifts in one window can score differently; says the mist hides the score bar but does not change points; and says TikTok "can change them at any time". No primary source cited; all author observation. — [PKTOK: PK Battle Multiplier Explained](https://pktok.com/guides/pk-battle-multipliers/)
- A creator video lists four power-ups (gloves, mists, timer, hammer), says the hammer is used in the "victory lap period", and advises not using gloves during a speed challenge because "points multiplier don't stack". Creator strategy, not official rules. — [@houseofandreya video](https://www.tiktok.com/@houseofandreya/video/7548135736864722207)
- A Japanese agency blog claims the match winner receives a bonus of about 35% of gifts received, and itself notes TikTok's help pages do not mention that figure. Unconfirmed. — [note.com: Blue Puddle](https://note.com/bluepuddle_liver/n/n8c26d079d3e8?hl=en)
- TikTok's LIVE Match feature guidelines (as paraphrased by TikFinity's blog, Oct 2026) say like-for-like promises, programmed loops and reckless stunts can cost access to LIVE Match, gifting and ranking. — [TikFinity blog: TikTok Live Rules](https://blog.tikfinity.com/tiktok-live-rules/)
- The unofficial data feed exposes battle-related message types: `linkMicBattle` (battle id, both hosts), `linkMicArmies` (battle id, gift id, gift count, total diamond count), `linkMicBattlePunishFinish` (end of the punishment phase), `linkMicBattleTask` (task update / settle, plausibly the speed challenge or bonus tasks), plus `rankUpdate`, `hourlyRank` and `gameRankNotify`. This confirms a punishment phase and in-battle tasks exist in the protocol. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)

### Inferences
- A siege driven by the live score is feasible in principle: the unofficial feed carries battle start, per-side army/diamond totals and the end of the punishment phase. But the score a viewer sees is modified by multipliers and glove "critical" hits, so a siege computed from raw gift diamonds will drift from the on-screen TikTok score unless the tool reads the battle score fields themselves.
- Magic mist deliberately hides one side's score for 30 seconds, typically in the final 30 seconds. A siege visual needs a designed "fog" state for that window instead of showing a number it may not have.
- Because the rules are thinly documented and vendors say TikTok changes them without notice, any battle mechanic should be read from live data at run time and not hard-coded.

### Gaps
- Official match duration options (5 minutes or otherwise), whether likes/taps count towards score in an all-gifts match, the official speed-challenge rules, the timer and hammer power-ups, MVP display, win streaks, leagues and rankings: no authoritative page could be read. TikTok pages returned empty to the fetch tool.
- Multi-guest formats beyond "solo" and "team": only a third-party list (1v2, 1v3, 2v2).
- Any dated 2025-2026 change log for LIVE Match: none found.
- The power-up odds and durations quoted are from a Creator Academy page of unknown date and may have changed.

## 2. Data access: what a streamer's tool can receive in real time, official versus unofficial

### Takeaway
No official TikTok API, webhook or partner programme for receiving LIVE chat, gift or battle events was found; every interactive game tool located reads the public LIVE room through the reverse-engineered Webcast connection (TikTok-Live-Connector, usually signed by Euler Stream, often via TikFinity). That route delivers nearly everything Zeus World wants (chat, gifts with streaks, likes, shares, follows, joins, viewer counts, battle messages), but it is explicitly unofficial, can break without notice, and depends on a paid-tier third-party signing service.

### Cited Findings
- TikTok-Live-Connector describes itself as unofficial, unaffiliated with ByteDance, a reverse-engineering project and "not a production-ready API"; TikTok can change the Webcast protocol without notice and break it. Licence is a modified AGPL. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)
- Events and documented fields (v2.4.4): `chat` (user uniqueId, nickname, comment); `member` (join; user, memberCount); `gift` (user, giftId, repeatCount, repeatEnd, giftDetails with giftType and giftName, optional extendedGiftInfo); `like` (user, likeCount, totalLikeCount); `social` with derived `follow` and `share`; `roomUser` (viewerCount, top-gifter ranksList with coinCount); `emote` (subscriber sticker); `envelope` (treasure box with diamondCount, peopleCount); `questionNew`; `goalUpdate` (goal, contributor, contributeCount, contributeScore); `pollMessage`; `rankUpdate`; `streamEnd` (ended or suspended); `superFan` / `superFanJoin`; `subNotify` (named, payload not documented); and the battle messages listed in section 1. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)
- Gift streaks: streakable gifts (giftType 1) fire repeatedly and then once more with `repeatEnd: true`; totals should be counted only on the final event. The connected state includes `availableGifts`, the room's gift list, which is where per-gift diamond values come from. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)
- Signing dependency: WebSocket URL signing is done by a third-party sign server (Euler Stream). Enabling `authenticateWs` or `useMobile` sends the account's session cookies or OAuth token to that service. Sending chat (`sendMessage`) needs both a Euler Stream API key and an authenticated session (`sessionid`, `tt-target-idc`). The README recommends the managed Euler Stream WebSocket API for production. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)
- Euler Stream pricing (read Nov 2026): Community $0 (1,500 requests/day, 100 LIVE rooms/day, 25 concurrent WebSockets, 5 webhook alerts); Business 10K $50/month (10,000 requests/day, 1,000 rooms/day, 100 WebSockets, 5-day trial); Business 50K $100/month; 100K $150/month; 200K $250/month; Enterprise custom. Add-ons include Premium Webcast Routes $50/month and TikTok Signature Access $25/month. No TikTok-affiliation statement on the pricing page. — [Euler Stream pricing](https://www.eulerstream.com/pricing)
- The free signing tier is limited per IP address: a few connections per minute, with hourly and daily caps. — [Social Stream Ninja: TikTok Signing](https://socialstream.ninja/docs/tiktok-signing.html)
- A rate-limit failure surfaces as `SignatureRateLimitError` ("Too many connections started"); in older versions a 429 response surfaced as a TypeError, fixed in TikTok-Live-Connector 2.5.0. Source is a competing vendor. — [tik.tools troubleshooting](https://tik.tools/guides/troubleshooting/signature-rate-limit-error)
- A competing vendor states Euler's terms allow plan rate limits to change without notice and that several add-on prices are not shown publicly. Not neutral. — [tik.tools vs Euler Stream](https://tik.tools/compare/eulerstream)
- TikFinity exposes its data to other software over a local WebSocket; third-party games (raffle wheels, Block Builder) consume gifts, likes, shares and comments that way. — [TekSpert Games](https://tiktokgames.co.uk/); [GameTik Block Builder](https://gametikstudio.itch.io/block-builder)
- TikFinity connects by public TikTok username and does not ask for the TikTok password (third-party guide, 2026). — [Handshake Media: Tikfinity guide for UK creators](https://handshakemedia.co/insights/tikfinity-guide-uk-tiktok-live-creators)
- TikFinity's own page warns that gift or like mentions can get a stream flagged for "non-genuine interactions", and that its chatbot posts from the streamer's own account, so the streamer is responsible for every message. The page is old (roughly 2023). — [TikFinity](https://tikfinity.zerody.one/tiktok/dapi)
- Game vendors say they read only the public LIVE feed through a third-party connector, never log in to the account, and are not affiliated with or endorsed by TikTok. Vendor assurances, no TikTok policy cited. — [Livecade](https://livecade.io/); [StreamToEarn](https://streamtoearn.io/)
- A game vendor's help page (updated 6 Nov 2026) states TikTok allows third-party game tools on LIVE and restricts how the stream comes across, not which tool is used; it also reports that creators using no interactive tools at all receive the same restriction messages. Vendor claim. — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)

### Inferences
- The practical data route for Zeus World is the unofficial one, either TikFinity's local WebSocket (simplest, runs on the streaming PC) or TikTok-Live-Connector / Euler Stream directly (server-side, more control). Both sit on the same reverse-engineered protocol, so they share one point of failure.
- One streamer watching one room fits well inside Euler's free tier on paper (25 concurrent WebSockets, 100 rooms/day), but reconnect storms hit the per-minute cap, so the game needs back-off on reconnect and must keep running sensibly through a data outage.
- Reading the public room does not require the streamer's credentials. Anything that posts to chat (for example confirming a one-time code) requires handing the account's session cookie to a third party, which is the riskiest part of the unofficial route and can be avoided by confirming codes on screen or on the web page instead.
- No source reported a ban specifically for using a read-only connector. Enforcement reports are about how the stream looks (see section 3), which suggests the main risk is content-policy, not the connection itself. Absence of reports is not evidence of permission.

### Gaps
- No official TikTok LIVE events API, webhook, "LIVE interactive" SDK or game partner programme was found in searches of developers.tiktok.com results. This is a negative search result, not proof that none exists; TikTok may run invitation-only partner programmes that are not publicly documented.
- TikTok's Terms of Service wording on automated access / scraping, and whether the Webcast connectors breach it, was not read in this session. From general knowledge, TikTok's terms prohibit automated access and reverse engineering, which would make these connectors a breach in the letter of the terms; this is unverified here and should be checked.
- Whether the feed exposes per-side battle score as displayed (after multipliers) and MVP: the README documents only `totalDiamondCount` on `linkMicArmies`; newer versions (2.5.0 and later) were not read.
- Per-gift `diamondCount` on the gift event is not documented in the 2.4.4 README (older versions exposed it directly); needs a check against the current version.
- Streamer.bot's TikTok support and Effect House LIVE effects / official "Interactive Gifts" were not researched (tool-call budget).
- No reliable uptime statistics for any connector were found; the issue tracker was not reviewed.

## 3. Rules: gift solicitation, gambling-like mechanics, rewards for gifts, minors, unattended and automated streams

### Takeaway
Asking for gifts is allowed, but TikTok's LIVE Monetization Guidelines demonetise streams that "mechanically and repeatedly" solicit gifts or that run mainly on automation "without meaningful creator presence, interaction, or facilitation", and games of chance are prohibited. This is the central design risk for Zeus World: a persistent city that plays itself with on-screen gift prompts matches the pattern TikTok's automated moderation restricts, and a real, present, talking host is the stated mitigation.

### Cited Findings
- Official LIVE Monetization Guidelines wording (via search extract of the official page, Nov 2026), on solicitation: content that "tricks, manipulates, or mechanically and repeatedly solicits viewers to increase Gifts or engagement metrics through deceptive, inauthentic, baiting, or non-interactive behaviors". — [TikTok LIVE Creator Hub: LIVE Monetization Guidelines](https://www.tiktok.com/live/creators/en-US/rules_and_guidance/live_monetization_guidelines)
- Same page, on automation: content can be demonetised when it runs "primarily through automated systems, such as AI or other third-party tools, without meaningful creator presence, interaction, or facilitation of the LIVE experience". — [TikTok LIVE Creator Hub: LIVE Monetization Guidelines](https://www.tiktok.com/live/creators/en-US/rules_and_guidance/live_monetization_guidelines)
- The guidelines were introduced in May 2024; they say graphic, inauthentic or low-quality content cannot earn through LIVE features, and violators are notified and may lose monetisation access, with violations visible in the LIVE Safety Education Center. — [TikTok Newsroom, 24 May 2024](https://newsroom.tiktok.com/en-africa/tiktoklive)
- Gift-baiting patterns named by TikFinity's summary (updated 16 Oct 2026; it says the current Community Guidelines version took effect 24 Sep 2026): tricking viewers or asking for gifts mechanically and repeatedly; engagement trades such as follow-for-follow; emotional or sympathy pressure; setting two sides against each other to be decided by gifts; asking for money for personal finances or unrelated fundraisers. Streams with these patterns can lose gift access even if they pass the Community Guidelines. — [TikFinity blog: TikTok Live Rules](https://blog.tikfinity.com/tiktok-live-rules/)
- "Asking for gifts is allowed", but content that ties gifts to a transaction-like exchange can become a violation (third-party guide, updated 4 Sep 2026). — [Streamer.Guide: TikTok LIVE rules](https://streamer.guide/guides/tiktok-live-rules)
- Gambling: "Promoting betting sites, showing slot play, running raffles or hosting games of chance are prohibited on LIVE", including "gift to spin the wheel" formats when they cross into wagering (third-party guide citing the Community Guidelines). — [Streamer.Guide: TikTok LIVE rules](https://streamer.guide/guides/tiktok-live-rules)
- TikTok Shop's 2026 gambling policy (seller side) bans casino-style games, wagers and lotteries including paying to spin a wheel for a chance at an item; free giveaways must use TikTok's LIVE Giveaway tool, entry cannot depend on purchase, and winners cannot be picked by spins, wheels or draws. Publication date reported as 27 May 2026 by one outlet and 25 June 2026 by another. — [ppc.land](https://ppc.land/tiktok-shops-gambling-policy-bans-raffles-and-lucky-spins-sellers-beware/); [Focus Gaming News](https://focusgn.com/tiktok-shop-gambling-policy-sellers-creators)
- Age: creators must be 18 or older to go LIVE and viewers must be 18 or older to send gifts; accounts aged 13-17 have no LIVE access (third-party guides, Sep-Oct 2026). — [Streamer.Guide](https://streamer.guide/guides/tiktok-live-rules); [TikFinity blog](https://blog.tikfinity.com/tiktok-live-rules/). Some general guides still state 16+ to go LIVE; they conflict and appear out of date. — [Restream](https://restream.io/learn/platforms/how-many-followers-do-you-need-to-go-live-on-tiktok/)
- Unattended and low-quality streams: blank screens, static images, sleeping streamers, empty rooms and looping videos are "classed as low-quality LIVE content"; enforcement "got noticeably stricter in 2026", and long lurk streams that ran for hours in 2023 now end early. — [Streamer.Guide](https://streamer.guide/guides/tiktok-live-rules)
- TikTok may demonetise "sleeping on LIVE, or doing routine tasks without talking to anyone"; recorded, looped or blank streams are flagged; a Pause LIVE feature exists for short breaks. — [TikFinity blog](https://blog.tikfinity.com/tiktok-live-rules/)
- Enforcement ladder: in-app warning, then temporary gift and feature restrictions, extending to days and then permanent for repeated cases; the Creator Code of Conduct allows a three-month gifting lockout for serious violations and a permanent one for egregious cases; a LIVE standing page shows a 0-100 score. — [TikFinity blog](https://blog.tikfinity.com/tiktok-live-rules/)
- Strikes are per policy and per feature, expire after 90 days, and the threshold for a permanent ban is not published. — [Streamer.Guide](https://streamer.guide/guides/tiktok-live-rules)
- Restriction labels seen by interactive-game streamers (vendor page, 6 Nov 2026): "Not eligible for recommendation", "Unoriginal or reproduced content", "Fake engagement" / "inorganic gift solicitation", "Integrity and Authenticity" / "suspicious activity", "Gifting is suspended" / "LIVE monetization restricted". — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)
- Same page: on-screen gift information is not banned in itself (TikTok's Small Gift Guidance uses an on-screen gift instruction as an example); QR codes and information from third-party platforms are not allowed on screen; a no-face stream may be read as a recording; streams that only present two opposing sides and ask for gifts, comments, likes or shares are a named trigger; TikTok recommends showing the face on camera throughout. — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)
- Same page, vendor-recommended practice: stay on camera and react to the game; pause the LIVE instead of leaving the game running; shrink or hide the gift-trigger panel; keep gift instructions out of title and description; avoid instant-win gift bindings; vary games instead of one for hours; customise art and sound to avoid "unoriginal" flags. It also reports appeals being denied instantly by automation, developers restricted even after removing all overlay text, and no verified fix. In the EU, creators can escalate to a certified out-of-court dispute body under the Digital Services Act. — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)
- A game vendor advises that gift prompts should not be used to repeatedly ask viewers for gifts. — [itch.io blog: TikTok LIVE interactive games](https://itch.io/blog/1601230/how-to-make-money-with-tiktok-live-interactive-games)
- Sanctioned gift-driven features exist inside TikTok: Fan Club, LIVE Match, Gift Gallery goals and Gift Vote, where viewers send gifts to vote or complete goals. — [Sirency: How to make money on TikTok LIVE](https://www.sirency.com/blog/how-to-make-money-on-tiktok-live)

### Inferences
- "No QR codes and no information from third-party platforms on screen" bears directly on the plan to send viewers to a separate mobile web page: showing a URL or QR code for the plot-builder on stream is likely to be treated as off-platform redirection. The link would need to live in the profile bio or be spoken, and this should be checked against the official text first.
- A "typed code in chat proves ownership" flow is not addressed by any rule found. It is ordinary chat, but prompting it repeatedly on screen could read as engagement solicitation; keep the prompt occasional and host-led.
- Converting gifts into in-world currency for the gifter is close to "transaction-like exchange". The safer framing found in sources is that gifts trigger shared on-stream events (as TikTok's own Gift Vote and goals do) and that likes, chat, follows and shares also earn, so the gift is not a purchase. No source drew this line precisely.
- A two-sided siege "decided by gifts" resembles the named "two sides, vote with gifts" pattern. Inside an actual LIVE Match that is TikTok's own sanctioned format; outside a Match, a gift-decided two-team contest is a named trigger.
- Any random reward tied to a gift (loot box, wheel, chance of rare building) falls under games of chance. Gift outcomes should be deterministic.
- A persistent city that runs around the clock without a present host is exactly the "automated, unattended" case. The world can persist off-stream, but the LIVE itself needs a visible, talking host for the whole broadcast.

### Gaps
- The exact official wording of the Community Guidelines on LIVE (effective 24 Sep 2026 per a third party) and of the LIVE Monetization Guidelines in full could not be read directly.
- Whether the guidelines say anything specific about gifter leaderboards or rewarding top gifters: nothing found. The only data point is that TikTok itself shows top-gifter rankings natively (the feed's `ranksList`) and a vendor note that widgets and goals do not make a stream safer.
- Whether exchanging gifts for goods, services or in-stream benefits is expressly prohibited: only the third-party phrase "transaction-like exchange" was found; no official clause was read.
- Official rules on giveaways for LIVE gifting creators (as opposed to TikTok Shop sellers): not found.
- Any rule on maximum continuous stream length: not found.
- Any rule on labelling AI-generated LIVE content beyond the automation clause: not found.

## 4. Monetisation facts: coins, diamonds, creator share, regional differences

### Takeaway
Viewers buy coins, gifts convert to diamonds for the creator, and the creator ends up with roughly half the coin value; the widely used planning figure is about $0.005 per diamond, but TikTok does not publish a fixed rate.

### Cited Findings
- TikTok's LIVE Gifts documentation says diamonds are "awarded based on popularity" with no fixed cash value; $0.005 per diamond (200 diamonds per dollar) is a widely reported working estimate, not a guaranteed rate. — [Streamer.Guide: gifts, coins and diamonds](https://streamer.guide/guides/tiktok-live-gifts-coins-diamonds)
- TikTok retains approximately 50% of a gift's coin value; described by several calculator sites as an estimate. — [ttcalculator: Complete TikTok Diamond Guide](https://ttcalculator.net/learn/complete-tiktok-diamond-guide/)
- Minimum withdrawal commonly cited as 10,000 diamonds (about $50); not confirmed on an official page. — [ttcalculator: TikTok Diamonds Guide](https://ttcalculator.net/learn/tiktok-diamonds/)
- Take-home can be 20-40% below gross diamond value depending on agency contract terms; processing fees may apply. — [Influencer Marketing Hub: Live gifting earnings](https://influencermarketinghub.com/live-gifting-earnings/)
- Senders of gifts are subject to TikTok's Virtual Items Policy; for users in the EEA, Switzerland and the UK, TikTok applies a Coins Policy and a Rewards Policy instead. — [TikTok Help: LIVE Gifts](https://support.tiktok.com/en/live-gifts-wallet/tiktok-live/what-is-live-gifting-on-tiktok)
- Per-LIVE missions (a rewards mechanism) are tied to LIVE duration, new unique followers and adherence to the LIVE Monetization Guidelines and Community Guidelines. — [Sirency](https://www.sirency.com/blog/how-to-make-money-on-tiktok-live)
- TikTok LIVE has Fan Clubs as an engagement and monetisation feature. — [Social Media Today](https://www.socialmediatoday.com/news/tiktok-adds-live-fan-clubs-to-drive-livestream-engagement/751564/)
- Follower threshold to go LIVE is commonly 1,000 and "may vary across regions" per TikTok's help text; some users report access at about 500. — [Restream](https://restream.io/learn/platforms/how-many-followers-do-you-need-to-go-live-on-tiktok/)

### Inferences
- An in-world economy should price actions in diamonds (creator-side value), which the gift list supplies per gift, and should treat any cash conversion as approximate.
- Rewards missions being conditional on guideline adherence means a monetisation restriction costs more than gift income alone.

### Gaps
- Official creator share and diamond rate: not published by TikTok as far as could be found.
- Subscription (LIVE Subscription / Super Fan) pricing, perks and creator share: not researched in detail.
- Regional differences beyond the EEA/UK/Switzerland policy split: not confirmed. India's ban on TikTok (in force since 2020 from general knowledge) and the post-2025 US ownership arrangement were not verified in this session.
- Coin price by platform (app-store versus web purchase) not sourced.

## 5. Account linking: authenticating a viewer's TikTok identity in an external web app

### Takeaway
There is an official route: TikTok Login Kit (OAuth) with the default `user.info.basic` scope returns the user's avatar and display name, which is enough to tie a web plot-builder account to a TikTok identity. It requires a registered and reviewed TikTok developer app, and it does not by itself tell you the handle that appears in LIVE chat.

### Cited Findings
- `user.info.basic` is added by default for all apps with Login Kit and gives read-only access to a user's avatar and display name. — [TikTok for Developers: Scopes overview](https://developers.tiktok.com/doc/scopes-overview)
- Scopes beyond the baseline need pre-approval in the app configuration, and users can grant only a subset of what is requested. — [TikTok for Developers: Login Kit overview](https://developers.tiktok.com/docs/en/login-kit-overview)
- A migration bulletin split user info: bio and profile link moved to `user.info.profile`; follower and video counts moved to `user.info.stats`. — [TikTok for Developers: user info scope migration](https://developers.tiktok.com/bulletin/user-info-scope-migration)
- Login Kit supports web, iOS, Android and a QR-code authorisation flow, with managed user access tokens. — [TikTok for Developers: QR code authorization](https://developers.tiktok.com/docs/en/login-kit-qr-code-authorization); [Manage user access tokens](https://developers.tiktok.com/docs/en/login-kit-manage-user-access-tokens)
- TikTok's developer documentation also lists a "Minis SDK" login, indicating a mini-app surface inside TikTok. — [TikTok for Developers: Minis SDK login](https://developers.tiktok.com/docs/en/minis-sdk-login)
- In the unofficial LIVE feed, a chat event identifies the viewer by `uniqueId` (the @handle) and `nickname`. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)

### Inferences
- The chat-code method and Login Kit solve different halves. Login Kit proves "this web user controls a TikTok account" officially but returns an `open_id`, display name and avatar; matching that to a chat `uniqueId` likely needs the `user.info.profile` scope (which carries the profile link, hence the handle) or the chat code. The chat-code method links the web session straight to the chat identity with no developer app, but relies on the unofficial feed.
- Display names are not unique and can be changed, so the link should key on the stable id (`open_id` from Login Kit, or `userId` from the feed), not the nickname.
- A sensible combination is the chat code as the primary link, with Login Kit added later if TikTok approves the app.

### Gaps
- Whether `user.info.basic` or `user.info.profile` returns the @handle (`username`) today: the current scopes reference table was not read.
- App review requirements, timelines and any restriction on using Login Kit for a game tied to LIVE gifting: not found.
- Whether TikTok Minis are open to independent developers and whether a Mini could host the plot-builder inside TikTok (which would avoid off-platform redirection): not researched.
- The `open_id` is, from general knowledge, scoped per developer app and not equal to the LIVE `userId`; unverified here.

## 6. Existing TikTok LIVE interactive game formats and tools

### Takeaway
A sizeable cottage industry sells gift-, like- and chat-triggered games for TikTok LIVE, almost all built on TikFinity or the same connector; none is endorsed by TikTok, and the common complaint in 2026 is automated restriction or demonetisation of game streams with instant-denied appeals.

### Cited Findings
- Tools and marketplaces: TikFinity (overlays, alerts, chatbot, local data API); Livecade (interactive games for creators); StreamToEarn (interactive games and gift triggers); TekSpert Games (raffle wheels fed by gifts, likes, shares and comments via TikFinity); GameTik's Block Builder; an itch.io tag for TikTok tools. — [TikFinity](https://tikfinity.zerody.one/tiktok/obsoverlays); [Livecade](https://livecade.io/); [StreamToEarn](https://streamtoearn.io/); [TekSpert Games](https://tiktokgames.co.uk/); [Block Builder](https://gametikstudio.itch.io/block-builder); [itch.io TikTok tag](https://itch.io/tools/tag-tiktok)
- Guides exist for building a custom game on TikFinity's data feed, showing this is a common self-build path. — [wgmojo: Vibe Code a TikTok LIVE Game with TikFinity](https://wgmojo.gg/widgets/guides/vibe-code-tiktok-live-game/)
- Battle-specific tools exist that detect multiplier windows, mist periods, MVP and "snipe" moments from the raw feed and trigger video overlays. — [PKTOK](https://pktok.com/guides/pk-battle-multipliers/)
- Complaints and enforcement as reported by a vendor (6 Nov 2026): short automated restrictions lasting minutes to hours, lengthening on repetition and potentially permanent for monetisation; appeals auto-denied; some creators report fewer restrictions after hiding the gift HUD, unproven; no verified fix; TikTok publishes no thresholds. — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)
- "Gift to spin the wheel" formats are called out as prohibited when they cross into wagering. — [Streamer.Guide](https://streamer.guide/guides/tiktok-live-rules)
- An Ipsos report (December 2025) on interactive livestream gifting exists and may hold audience data. Not read. — [Ipsos: Interactive Livestream Gifting](https://www.ipsos.com/sites/default/files/documents/2025-12/Ipsos-Entertainment%20Redefined%20-%20Interactive%20Livestream%20Gifting.pdf)
- One third-party "official guidelines for interactive games" page makes claims about strikes and commission that do not match other sources; treated as unreliable and not used. — [Raven Games](https://ravengames.vercel.app/diretrizes-tiktok-jogos-interativos-regras-en.html)

### Inferences
- Zeus World's differentiators against this field are persistence and a present host. Most off-the-shelf games are session-long, generic and often run unattended, which is what draws "unoriginal" and "automated" flags. Original art and a host reacting on camera address the two most common flag types.
- Raffle wheels fed by gifts are sold openly despite the games-of-chance rule, so availability of a format in the market is not evidence it is permitted.

### Gaps
- Popularity data (which formats draw most viewers, "country war" / territory games, "tap to" games): no reliable figures found.
- Any official TikTok statement promoting or restricting third-party interactive games, and any named enforcement action against a game or tool: not found.
- TikTok's own native LIVE games (the feed lists `liveGameIntro`, `gameRankNotify`, `partnershipGameOffline`, `partnershipDropsUpdate`, which suggests official game partnerships exist) were not researched.

## 7. Technical constraints of streaming

### Takeaway
TikTok publishes no single spec sheet; third parties agree on 1080p as the ceiling with up to 60 fps, disagree widely on bitrate (2.5 to 12 Mbps), and agree that stream-key (RTMP) access is gated and not guaranteed. No reliable figure for stream delay or maximum stream length was found.

### Cited Findings
- TikTok LIVE Studio is Windows-only; no official Mac or Android version. — [Sociallyin: TikTok Studio system requirements](https://sociallyin.com/blog/tiktok-studio-system-requirements/)
- Maximum allowed is 1080p at 60 fps; recommended bitrate 8,000 kbps for 1080p60. — [Streamlabs: How to go live on TikTok](https://streamlabs.com/content-hub/post/how-to-go-live-on-tiktok)
- Restream suggests 1080p (720p minimum), 60 fps for gaming or 30 for lifestyle, around 2,500 kbps, in portrait orientation. — [Restream: Stream to TikTok](https://support.restream.io/en/articles/6721574-stream-to-tikto)
- Sociallyin gives about 10 Mbps for 1080p30 and 12 Mbps for 1080p60, and notes TikTok does not publish a universal spec. Conflicts with Restream's figure. — [Sociallyin](https://sociallyin.com/blog/tiktok-studio-system-requirements/)
- Stream keys are typically temporary and may not work across sessions; generate a fresh key before each broadcast. — [Castr: How to stream to TikTok LIVE](https://docs.castr.com/en/articles/14107182-how-to-stream-to-tiktok-live-using-castr)
- Stream-key access is gated beyond the follower count: it tends to appear for accounts that go live often with strong viewership, and one blog says agencies provide access in exchange for joining their network (single source). — [Opus: TikTok stream key](https://www.opus.pro/blog/tiktok-stream-key)
- LIVE Studio typically requires existing LIVE access (1,000+ followers, 18+) before applying. — [OneStream: How to get LIVE access on TikTok in 2026](https://onestream.live/?p=179238)
- Desktop streaming needs either RTMP access or LIVE Studio. — [Kapwing: TikTok LIVE](https://kapwing.com/resources/tiktok-live)
- The feed includes a `captionMessage` event with `timestampMs` and stream-level events such as `streamEnd` with action "ended or suspended", so the tool can detect TikTok suspending the LIVE. — [TikTok-Live-Connector README v2.4.4](https://unpkg.com/tiktok-live-connector@2.4.4/README.md)

### Inferences
- Design for 1080x1920 portrait. Given a software-rendered development machine, the frame-rate and bitrate choice has to be validated on the owner's streaming PC, not here.
- Chat and gift events arrive over the data feed in near real time, while the video the viewer sees is delayed by the stream pipeline. So the game can react instantly, but the viewer sees their action land after the video delay. Feedback should be designed for a several-second lag (unmeasured; must be tested on a real LIVE), for example by naming the viewer on screen so they can spot their own action.
- Temporary stream keys make unattended auto-restart impractical, which is consistent with the policy position against unattended streams.
- LIVE Studio being Windows-only matters if the browser capture runs elsewhere; OBS with a stream key is the portable route but depends on gated access.

### Gaps
- Stream delay between viewer action and on-screen result: no source found. Needs measuring.
- Maximum stream length: no official or reliable figure found.
- Official resolution and bitrate limits: none published that could be read.
- Whether LIVE Studio's browser-source capture and OBS behave differently for moderation ("reprocessed video" flags): only a vendor remark that mirrored text may look like reprocessed video.

## 8. Regulatory context touching TikTok LIVE gifting

### Takeaway
LIVE gifting and minors is an active legal front: Utah's 2024 suit targets LIVE's virtual-currency gifting directly, and the European Commission issued two sets of preliminary DSA findings against TikTok in 2026 (addictive design in February, minors' account settings in July). The practical consequence for a designer is tighter age gating and more aggressive automated moderation of gift-driven streams, not a rule aimed at third-party games.

### Cited Findings
- Utah's Division of Consumer Protection sued TikTok in June 2024, alleging LIVE's monetisation feature incentivised minors to perform sexually explicit acts while TikTok took a cut of virtual-currency payments. — [Utah AG: public complaint, 3 June 2024](https://attorneygeneral.utah.gov/wp-content/uploads/2024/06/2024.06.03-Utah-TikTok-PUBLIC-Complaint.pdf)
- A less-redacted complaint (filed January 2025) says TikTok's internal "Project Meramec" review concluded LIVE enabled "exploitation of live hosts". — [Utah AG: less redacted complaint](https://attorneygeneral.utah.gov/wp-content/uploads/2025/01/2024.01.03-Utah-TikTok-LIVE-Notice-of-Filing-Less-Redacted-Complaint-with-Exhibit-A.pdf); [Utah Commerce: unsealed highlights](https://blog.commerce.utah.gov/wp-content/uploads/2025/01/TikTok-Live-Unsealed-Redaction-Highlights.pdf)
- TikTok's response was that the suit ignores proactive measures it has voluntarily implemented. — [Yahoo News](https://www.yahoo.com/news/tiktok-knew-harm-less-redacted-170844274.html)
- On 24 July 2026 the European Commission sent TikTok preliminary findings that minors' accounts do not meet DSA safety standards, centred on default account visibility, not the LIVE feature. — [IDPC Malta summary](https://idpc.org.mt/news-latest/european-commission-preliminary-finds-tiktok-in-breach-of-digital-services-act-for-failing-to-ensure-safe-accounts-for-minors/); [ASIL](https://asil.org/ilib/eu-commission-finds-tiktok-failed-to-protect-minors-privacy-under-digital-services-act/)
- In February 2026 the Commission issued preliminary findings on addictive design; TikTok called them "categorically false" and "entirely meritless". Preliminary findings are not final; confirmed breaches carry fines of up to 6% of global annual turnover. — [TechTimes, 25 July 2026](https://www.techtimes.com/articles/321556/20260725/eu-charges-tiktok-default-settings-expose-minors-strangers-predators.htm)
- EU creators can take moderation decisions to a certified out-of-court dispute settlement body under the DSA. — [Livecade: fix LIVE restrictions](https://livecade.io/docs/fix-live-restrictions/)
- An academic policy review (2025) covering TikTok LIVE gifting exists. Not read. — [White Rose eprint](https://eprints.whiterose.ac.uk/id/eprint/234003/1/policyreview-2025-3-2014.pdf)

### Inferences
- The "addictive design" finding and the gambling-policy tightening on TikTok Shop point the same way: mechanics that pressure repeated spending (streak-loss, countdown pressure to gift, chance rewards) are the ones regulators and TikTok are both moving against. Zeus World should avoid loss-aversion mechanics tied to gifts.
- Zeus World's own web page collects a TikTok identity and user-built content, so it carries its own data-protection duties (and an age question, since under-18s can watch LIVE and chat even though they cannot gift). No source addressed this; it is flagged as a design consideration.

### Gaps
- Current status of the Utah case (ruling, settlement) as of November 2026: not found.
- Other US state suits concerning LIVE and minors, and UK regulator (Ofcom, ICO) actions specific to LIVE gifting: not researched within budget.
- Whether the EU's February 2026 addictive-design findings mention LIVE gifting specifically: not confirmed.
- Any regulation that treats gift-driven interactive games as gambling: none found.
