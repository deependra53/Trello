# Graph Report - Trello  (2026-06-04)

## Corpus Check
- 227 files · ~321,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1337 nodes · 2464 edges · 79 communities (75 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3de9bcb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes Layer|API Routes Layer]]
- [[_COMMUNITY_Auth & Workspace Services|Auth & Workspace Services]]
- [[_COMMUNITY_Alternate Board Views|Alternate Board Views]]
- [[_COMMUNITY_Card Modal Components|Card Modal Components]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Boards Index Page|Boards Index Page]]
- [[_COMMUNITY_Card Tile & Settings|Card Tile & Settings]]
- [[_COMMUNITY_Kanban List Column|Kanban List Column]]
- [[_COMMUNITY_Card Controllers|Card Controllers]]
- [[_COMMUNITY_Card Service Layer|Card Service Layer]]
- [[_COMMUNITY_Root Workspace Config|Root Workspace Config]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Upload Storage Providers|Upload Storage Providers]]
- [[_COMMUNITY_App Shell Layout|App Shell Layout]]
- [[_COMMUNITY_Backend Integration Tests|Backend Integration Tests]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Frontend TS Config|Frontend TS Config]]
- [[_COMMUNITY_Repo Documentation Concepts|Repo Documentation Concepts]]
- [[_COMMUNITY_List Controller & Authz|List Controller & Authz]]
- [[_COMMUNITY_Board Controller|Board Controller]]
- [[_COMMUNITY_List & Template Models|List & Template Models]]
- [[_COMMUNITY_List Service & Ordering|List Service & Ordering]]
- [[_COMMUNITY_Board Page & View Switcher|Board Page & View Switcher]]
- [[_COMMUNITY_Notifications UI|Notifications UI]]
- [[_COMMUNITY_Inbox & Misc Controllers|Inbox & Misc Controllers]]
- [[_COMMUNITY_Backend DevDependencies|Backend DevDependencies]]
- [[_COMMUNITY_Attachments & Automation Services|Attachments & Automation Services]]
- [[_COMMUNITY_Backend App Bootstrap|Backend App Bootstrap]]
- [[_COMMUNITY_Automation Engine & Reminders|Automation Engine & Reminders]]
- [[_COMMUNITY_Board Service|Board Service]]
- [[_COMMUNITY_Password Reset Pages|Password Reset Pages]]
- [[_COMMUNITY_LoginSignup Pages|Login/Signup Pages]]
- [[_COMMUNITY_Realtime Socket Client|Realtime Socket Client]]
- [[_COMMUNITY_Email Verify & API Client|Email Verify & API Client]]
- [[_COMMUNITY_Frontend DevDependencies|Frontend DevDependencies]]
- [[_COMMUNITY_Auth Layout & Hero|Auth Layout & Hero]]
- [[_COMMUNITY_Inbox Page|Inbox Page]]
- [[_COMMUNITY_Shared Types Package|Shared Types Package]]
- [[_COMMUNITY_Workspace Controller|Workspace Controller]]
- [[_COMMUNITY_Board Model & Search|Board Model & Search]]
- [[_COMMUNITY_Inbox Items Backend|Inbox Items Backend]]
- [[_COMMUNITY_Frontend Package Metadata|Frontend Package Metadata]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Backend Realtime Bus|Backend Realtime Bus]]
- [[_COMMUNITY_Upload Controller|Upload Controller]]
- [[_COMMUNITY_Backend Scripts|Backend Scripts]]
- [[_COMMUNITY_Labels Model & Service|Labels Model & Service]]
- [[_COMMUNITY_Shared Package Exports|Shared Package Exports]]
- [[_COMMUNITY_Card Model Schema|Card Model Schema]]
- [[_COMMUNITY_Background Job Queue|Background Job Queue]]
- [[_COMMUNITY_Automation Model|Automation Model]]
- [[_COMMUNITY_Auth Test Suite|Auth Test Suite]]
- [[_COMMUNITY_Realtime Test Suite|Realtime Test Suite]]
- [[_COMMUNITY_Server Entrypoint|Server Entrypoint]]
- [[_COMMUNITY_Backend Build TS Config|Backend Build TS Config]]
- [[_COMMUNITY_Backend Package Metadata|Backend Package Metadata]]
- [[_COMMUNITY_Leaflet Map View|Leaflet Map View]]
- [[_COMMUNITY_Comment Model|Comment Model]]
- [[_COMMUNITY_Sample Upload Artifacts|Sample Upload Artifacts]]
- [[_COMMUNITY_Frontend ESLint Rules|Frontend ESLint Rules]]
- [[_COMMUNITY_Activity Model|Activity Model]]
- [[_COMMUNITY_TS Config Concepts|TS Config Concepts]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Test Setup|Test Setup]]
- [[_COMMUNITY_Models Barrel|Models Barrel]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `NotFound()` - 47 edges
3. `logActivity()` - 40 edges
4. `Button` - 25 edges
5. `compilerOptions` - 19 edges
6. `BadRequest()` - 19 edges
7. `createApp()` - 17 edges
8. `getById()` - 17 edges
9. `Card` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Deploy Workflow (Vercel/Render/Railway)` --references--> `Frontend Next.js Package`  [INFERRED]
  .github/workflows/deploy.yml → frontend/package.json
- `TrelloX Root Monorepo Package` --implements--> `PNPM Workspace Monorepo Architecture`  [INFERRED]
  package.json → pnpm-workspace.yaml
- `Frontend Docker Service` --implements--> `Frontend Next.js Package`  [INFERRED]
  docker-compose.yml → frontend/package.json
- `Dependabot Weekly Updates Config` --references--> `Frontend Next.js Package`  [EXTRACTED]
  .github/dependabot.yml → frontend/package.json
- `createApp()` --calls--> `compression`  [INFERRED]
  src/app.ts → package.json

## Hyperedges (group relationships)
- **PNPM Workspace Packages** — frontend_package_frontend, backend_package_backend, shared_package_shared, trello_pnpm_workspace_packages [EXTRACTED 1.00]
- **Docker Compose Service Stack** — trello_docker_compose_mongo, trello_docker_compose_redis, trello_docker_compose_backend, trello_docker_compose_frontend [EXTRACTED 1.00]
- **CI/CD GitHub Actions Pipeline** — workflows_frontend_ci_pipeline, workflows_backend_ci_pipeline, workflows_deploy_pipeline, github_dependabot_weekly_npm [EXTRACTED 1.00]

## Communities (79 total, 4 thin omitted)

### Community 0 - "API Routes Layer"
Cohesion: 0.06
Nodes (51): requireListAccess(), Source, validate(), router, router, upload, router, router (+43 more)

### Community 1 - "Auth & Workspace Services"
Cohesion: 0.38
Nodes (11): getTransporter(), resolveFrom(), sendBoardAddedEmail(), sendBoardInviteEmail(), sendChannelAddedEmail(), sendInviteEmail(), sendMail(), SendMailParams (+3 more)

### Community 2 - "Alternate Board Views"
Cohesion: 0.09
Nodes (26): applyCardMove(), applyListMove(), computePosition(), board, cards, lists, out, Attachment (+18 more)

### Community 3 - "Card Modal Components"
Cohesion: 0.08
Nodes (41): ActivityRow(), AttachmentsSection(), CardModal(), ChecklistItemRow(), ChecklistPopover(), ChecklistSection(), CommentComposer(), CommentRow() (+33 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, class-variance-authority, clsx, cmdk, date-fns, framer-motion, @hello-pangea/dnd, @hookform/resolvers (+31 more)

### Community 5 - "Boards Index Page"
Cohesion: 0.06
Nodes (45): Props, BACKGROUNDS, BG, CreateBoardDialog(), Props, BoardsPage(), CreateTile(), WorkspaceSection() (+37 more)

### Community 6 - "Card Tile & Settings"
Cohesion: 0.11
Nodes (19): inter, metadata, RootLayout(), ActionBtn(), CardChips(), cn(), HOURS, PlannerPage() (+11 more)

### Community 7 - "Kanban List Column"
Cohesion: 0.07
Nodes (26): addMembers, createChannel, createDm, deleteMessage, editMessage, getChannel, joinChannel, leaveChannel (+18 more)

### Community 8 - "Card Controllers"
Cohesion: 0.08
Nodes (24): addChecklist, addChecklistItem, addComment, archive, cardActivity, convertChecklistItem, copy, deleteChecklist (+16 more)

### Community 9 - "Card Service Layer"
Cohesion: 0.21
Nodes (22): logActivity(), addChecklist(), addChecklistItem(), addComment(), archive(), CardExtras, convertChecklistItemToCard(), copy() (+14 more)

### Community 10 - "Root Workspace Config"
Cohesion: 0.15
Nodes (13): scripts, build, build:backend, build:frontend, dev, dev:backend, dev:frontend, format:check (+5 more)

### Community 11 - "Backend Dependencies"
Cohesion: 0.10
Nodes (23): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcrypt, bullmq, compression, cors, dotenv (+15 more)

### Community 12 - "Upload Storage Providers"
Cohesion: 0.11
Nodes (9): buildObjectKey(), CloudinaryProvider, contentDisposition(), LOCAL_ROOT, LocalProvider, PresignedUpload, S3Provider, StoredFile (+1 more)

### Community 13 - "App Shell Layout"
Cohesion: 0.11
Nodes (22): AppLayout(), useNotificationRealtime(), ApiError, FormData, LoginPage(), schema, AuthField, CommandPalette() (+14 more)

### Community 14 - "Backend Integration Tests"
Cohesion: 0.13
Nodes (18): app, labelId, app, guestToken, newToken, token, app, makeBoard() (+10 more)

### Community 15 - "Backend TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+13 more)

### Community 16 - "Frontend TS Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 17 - "Repo Documentation Concepts"
Cohesion: 0.16
Nodes (19): PNPM Workspace Monorepo Architecture, Real-time Collaboration via Socket.IO, Frontend ESLint Config, Frontend Next.js Package, Frontend TypeScript Config, Dependabot Weekly Updates Config, Shared Types Package, Backend Docker Service (+11 more)

### Community 18 - "List Controller & Authz"
Cohesion: 0.29
Nodes (6): memberSchema, WORKSPACE_ROLES, WorkspaceDoc, WorkspaceRole, workspaceSchema, WorkspaceType

### Community 19 - "Board Controller"
Cohesion: 0.07
Nodes (28): acceptInvite, activity, addMember, close, copy, createAutomation, createInvite, createLabel (+20 more)

### Community 20 - "List & Template Models"
Cohesion: 0.11
Nodes (17): ListDoc, listSchema, ListType, TemplateDoc, templateSchema, TemplateType, createBoardFromTemplate(), DEFAULT_TEMPLATES (+9 more)

### Community 21 - "List Service & Ordering"
Cohesion: 0.18
Nodes (17): runDueReminders(), emitBoard(), move(), archive(), copy(), create(), getById(), _internal (+9 more)

### Community 22 - "Board Page & View Switcher"
Cohesion: 0.15
Nodes (13): BoardBottomNav(), Props, BoardFilter, emptyFilter, BoardSwitcherDialog(), ALLOWED_VIEWS, BoardPage(), useBoard() (+5 more)

### Community 23 - "Notifications UI"
Cohesion: 0.15
Nodes (20): benefits, features, useMarkAllRead(), useMarkRead(), useNotifications(), useUnreadCount(), NotificationsPage(), NotificationsDropdown() (+12 more)

### Community 24 - "Inbox & Misc Controllers"
Cohesion: 0.05
Nodes (66): boardFromTemplate, markAllRead, markRead, notifications, planner, search, templates, unreadCount (+58 more)

### Community 25 - "Backend DevDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, mongodb-memory-server, supertest, tsx, @types/compression, @types/cors, @types/express (+9 more)

### Community 26 - "Attachments & Automation Services"
Cohesion: 0.18
Nodes (11): ActivityInput, addAttachment(), presignAttachment(), registerAttachment(), removeAttachment(), setCover(), run(), update() (+3 more)

### Community 27 - "Backend App Bootstrap"
Cohesion: 0.11
Nodes (20): connectDB(), Env, parsed, schema, base, devLine, logger, Meta (+12 more)

### Community 28 - "Automation Engine & Reminders"
Cohesion: 0.08
Nodes (19): actionSchema, AutomationDoc, automationSchema, AutomationType, conditionSchema, triggerSchema, CommentDoc, commentSchema (+11 more)

### Community 29 - "Board Service"
Cohesion: 0.08
Nodes (30): acceptInvite, addMember, boards, create, createBoard, createInvite, get, list (+22 more)

### Community 30 - "Password Reset Pages"
Cohesion: 0.17
Nodes (11): INVITE_ROLES, INVITE_STATUSES, InviteDoc, InviteRole, inviteSchema, InviteStatus, InviteType, acceptInvite() (+3 more)

### Community 31 - "Login/Signup Pages"
Cohesion: 0.21
Nodes (13): avatarUpload, router, changePasswordSchema, forgotPasswordSchema, LoginInput, loginSchema, password, refreshSchema (+5 more)

### Community 32 - "Realtime Socket Client"
Cohesion: 0.22
Nodes (9): IncomingBoardEvent, getAccessToken(), isPendingMove(), pending, trackPendingMove(), disconnectSocket(), getSocket(), joinBoard() (+1 more)

### Community 33 - "Email Verify & API Client"
Cohesion: 0.09
Nodes (10): activeFilterCount(), ActivityFilter, applyBoardFilter(), BoardFilterPopover(), DueFilter, isFilterActive(), MatchMode, Props (+2 more)

### Community 34 - "Frontend DevDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/leaflet, @types/node (+4 more)

### Community 35 - "Auth Layout & Hero"
Cohesion: 0.18
Nodes (4): AuthHero(), Card, COLUMNS, TONE

### Community 36 - "Inbox Page"
Cohesion: 0.21
Nodes (13): anyOrgMember, router, upload, addChannelMembersSchema, attachmentSchema, createChannelSchema, createDmSchema, editMessageSchema (+5 more)

### Community 37 - "Shared Types Package"
Cohesion: 0.17
Nodes (11): ApiError, BoardEventBase, BoardRole, CardMovedPayload, ID, ListMovedPayload, NormalizedPayload, Paginated (+3 more)

### Community 38 - "Workspace Controller"
Cohesion: 0.15
Nodes (12): main, name, private, type, version, description, engines, node (+4 more)

### Community 39 - "Board Model & Search"
Cohesion: 0.06
Nodes (30): backgroundSchema, BOARD_ROLES, BoardDoc, BoardRole, boardSchema, BoardType, customFieldSchema, memberSchema (+22 more)

### Community 40 - "Inbox Items Backend"
Cohesion: 0.22
Nodes (8): archive, copy, createCard, createCardFromMessage, move, remove, update, Forbidden()

### Community 41 - "Frontend Package Metadata"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 42 - "Auth Controller"
Cohesion: 0.13
Nodes (13): AvatarRequest, changePassword, forgotPassword, inviteInfo, login, logout, me, refresh (+5 more)

### Community 43 - "Backend Realtime Bus"
Cohesion: 0.09
Nodes (18): BoardEvent, Bus, ChannelEvent, UserEvent, WorkspaceEvent, presence, Socket, SocketUser (+10 more)

### Community 44 - "Upload Controller"
Cohesion: 0.20
Nodes (9): MultipartRequest, presignCardAttachment, registerCardAttachment, remove, setCover, sign, upload, BoardRequest (+1 more)

### Community 45 - "Backend Scripts"
Cohesion: 0.14
Nodes (15): signup(), deleteComment(), updateComment(), addMember(), AddMemberInput, create(), CreateInput, getById() (+7 more)

### Community 46 - "Labels Model & Service"
Cohesion: 0.15
Nodes (9): AuthResult, forgotPassword(), getMe(), RequestContext, resetPassword(), SignupOptions, updateAvatar(), verifyEmail() (+1 more)

### Community 47 - "Shared Package Exports"
Cohesion: 0.22
Nodes (8): exports, ./types, main, name, private, type, types, version

### Community 48 - "Card Model Schema"
Cohesion: 0.25
Nodes (7): attachmentSchema, CardDoc, cardSchema, CardType, checklistItemSchema, checklistSchema, coverSchema

### Community 49 - "Background Job Queue"
Cohesion: 0.16
Nodes (12): AddCardForm(), AddListForm(), ListColumn(), Props, useCreateCard(), useCreateList(), useMoveCard(), useMoveList() (+4 more)

### Community 50 - "Automation Model"
Cohesion: 0.20
Nodes (7): ChannelRequest, requireBoardRole(), requireCardAccess(), requireChannelAccess(), requireWorkspaceRole(), ROLE_RANK_BOARD, ROLE_RANK_WS

### Community 51 - "Auth Test Suite"
Cohesion: 0.29
Nodes (5): app, refresh, refreshToken, token, u

### Community 52 - "Realtime Test Suite"
Cohesion: 0.25
Nodes (9): CardTile(), dueColor(), Props, CoverPopover(), useUpdateCard(), Avatar, AvatarFallback, AvatarImage (+1 more)

### Community 53 - "Server Entrypoint"
Cohesion: 0.29
Nodes (3): DashboardView(), PALETTE, Props

### Community 54 - "Backend Build TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, declaration, noEmit, sourceMap, exclude, extends

### Community 55 - "Backend Package Metadata"
Cohesion: 0.40
Nodes (4): BoardViewKind, Props, VIEWS, ViewSwitcher()

### Community 56 - "Leaflet Map View"
Cohesion: 0.33
Nodes (3): DEFAULT_ICON, LocCard, Props

### Community 57 - "Comment Model"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, seed, start, test, test:watch (+1 more)

### Community 58 - "Sample Upload Artifacts"
Cohesion: 0.60
Nodes (5): Local Disk Uploads Storage Provider, Card Attachment hello world 3, Card Attachment hello world 4, Card Attachment hello world 2, Card Attachment hello world 1

### Community 59 - "Frontend ESLint Rules"
Cohesion: 0.50
Nodes (3): extends, rules, @next/next/no-html-link-for-pages

### Community 60 - "Activity Model"
Cohesion: 0.50
Nodes (3): ActivityDoc, activitySchema, ActivityType

### Community 68 - "Test Setup"
Cohesion: 0.22
Nodes (4): LabelDoc, labelSchema, LabelType, update()

### Community 69 - "Models Barrel"
Cohesion: 0.22
Nodes (8): CHANNEL_KINDS, CHANNEL_MEMBER_ROLES, ChannelDoc, ChannelKind, ChannelMemberRole, channelMemberSchema, channelSchema, ChannelType

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): Never use `backdrop-blur` (or `backdrop-filter: blur(...)`) on large, fullscreen, or scrollable surfaces, Performance rules, Trello

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (5): BullQueueLike, BullWorkerLike, JobQueue, queues, RedisConnection

### Community 72 - "Community 72"
Cohesion: 0.32
Nodes (7): next, AuthedRequest, optionalAuth(), requireAuth(), login(), refresh(), Unauthorized()

### Community 73 - "Community 73"
Cohesion: 0.25
Nodes (6): app, events, evt, notif, payload, userEvents

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (3): RefreshTokenDoc, refreshTokenSchema, RefreshTokenType

### Community 76 - "Community 76"
Cohesion: 0.67
Nodes (3): devDependencies, prettier, typescript

## Knowledge Gaps
- **579 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+574 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Dependencies` to `Community 72`, `Frontend Package Metadata`?**
  _High betweenness centrality (0.285) - this node is a cross-community bridge._
- **Why does `next` connect `Community 72` to `Frontend Dependencies`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Why does `requireAuth()` connect `Community 72` to `API Routes Layer`, `Inbox Page`, `Login/Signup Pages`?**
  _High betweenness centrality (0.259) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _579 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05734767025089606 - nodes in this community are weakly interconnected._
- **Should `Alternate Board Views` be split into smaller, more focused modules?**
  _Cohesion score 0.09206349206349207 - nodes in this community are weakly interconnected._
- **Should `Card Modal Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08421985815602837 - nodes in this community are weakly interconnected._