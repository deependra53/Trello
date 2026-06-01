# Graph Report - .  (2026-05-29)

## Corpus Check
- 169 files · ~50,584 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1088 nodes · 2074 edges · 70 communities (67 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 30,000 input · 8,945 output

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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 49 edges
2. `NotFound()` - 46 edges
3. `logActivity()` - 39 edges
4. `Button` - 24 edges
5. `compilerOptions` - 19 edges
6. `compilerOptions` - 17 edges
7. `getById()` - 17 edges
8. `Card` - 16 edges
9. `useAuthStore` - 16 edges
10. `api()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Deploy Workflow (Vercel/Render/Railway)` --references--> `Frontend Next.js Package`  [INFERRED]
  .github/workflows/deploy.yml → frontend/package.json
- `No Backdrop Blur Performance Rule` --rationale_for--> `Frontend Next.js Package`  [INFERRED]
  CLAUDE.md → frontend/package.json
- `Deploy Workflow (Vercel/Render/Railway)` --references--> `Backend Express Package`  [INFERRED]
  .github/workflows/deploy.yml → backend/package.json
- `TrelloX Root Monorepo Package` --implements--> `PNPM Workspace Monorepo Architecture`  [INFERRED]
  package.json → pnpm-workspace.yaml
- `Frontend Docker Service` --implements--> `Frontend Next.js Package`  [INFERRED]
  docker-compose.yml → frontend/package.json

## Hyperedges (group relationships)
- **PNPM Workspace Packages** — frontend_package_frontend, backend_package_backend, shared_package_shared, trello_pnpm_workspace_packages [EXTRACTED 1.00]
- **Docker Compose Service Stack** — trello_docker_compose_mongo, trello_docker_compose_redis, trello_docker_compose_backend, trello_docker_compose_frontend [EXTRACTED 1.00]
- **CI/CD GitHub Actions Pipeline** — workflows_frontend_ci_pipeline, workflows_backend_ci_pipeline, workflows_deploy_pipeline, github_dependabot_weekly_npm [EXTRACTED 1.00]

## Communities (70 total, 3 thin omitted)

### Community 0 - "API Routes Layer"
Cohesion: 0.05
Nodes (59): requireBoardRole(), requireListAccess(), requireWorkspaceRole(), Source, validate(), router, router, router (+51 more)

### Community 1 - "Auth & Workspace Services"
Cohesion: 0.06
Nodes (39): next, optionalAuth(), requireAuth(), RefreshTokenDoc, refreshTokenSchema, RefreshTokenType, preferencesSchema, UserDoc (+31 more)

### Community 2 - "Alternate Board Views"
Cohesion: 0.07
Nodes (37): CardChips(), applyCardMove(), applyListMove(), computePosition(), board, cards, lists, out (+29 more)

### Community 3 - "Card Modal Components"
Cohesion: 0.08
Nodes (41): ActivityRow(), AttachmentsSection(), CardModal(), ChecklistItemRow(), ChecklistPopover(), ChecklistSection(), CommentComposer(), CommentRow() (+33 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, class-variance-authority, clsx, cmdk, date-fns, framer-motion, @hello-pangea/dnd, @hookform/resolvers (+31 more)

### Community 5 - "Boards Index Page"
Cohesion: 0.14
Nodes (22): BACKGROUNDS, BG, CreateBoardDialog(), Props, BoardsPage(), CreateTile(), WorkspaceSection(), useCreateBoard() (+14 more)

### Community 6 - "Card Tile & Settings"
Cohesion: 0.12
Nodes (18): CardTile(), dueColor(), Props, ActionBtn(), cn(), getInitials(), SettingsPage(), Avatar (+10 more)

### Community 7 - "Kanban List Column"
Cohesion: 0.13
Nodes (16): benefits, features, AddCardForm(), AddListForm(), ListColumn(), Props, useCreateCard(), useCreateList() (+8 more)

### Community 8 - "Card Controllers"
Cohesion: 0.08
Nodes (24): addChecklist, addChecklistItem, addComment, archive, cardActivity, convertChecklistItem, copy, deleteChecklist (+16 more)

### Community 9 - "Card Service Layer"
Cohesion: 0.22
Nodes (21): logActivity(), addChecklist(), addChecklistItem(), addComment(), archive(), convertChecklistItemToCard(), copy(), create() (+13 more)

### Community 10 - "Root Workspace Config"
Cohesion: 0.08
Nodes (23): description, devDependencies, prettier, typescript, engines, node, name, packageManager (+15 more)

### Community 11 - "Backend Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcrypt, bullmq, compression, cors, dotenv (+15 more)

### Community 12 - "Upload Storage Providers"
Cohesion: 0.11
Nodes (8): buildObjectKey(), CloudinaryProvider, LOCAL_ROOT, LocalProvider, PresignedUpload, S3Provider, StoredFile, UploadProvider

### Community 13 - "App Shell Layout"
Cohesion: 0.15
Nodes (17): AppLayout(), inter, metadata, RootLayout(), useNotificationRealtime(), CommandPalette(), SearchResult, AuthHydrator() (+9 more)

### Community 14 - "Backend Integration Tests"
Cohesion: 0.19
Nodes (14): app, labelId, app, makeBoard(), makeCard(), makeList(), makeUser(), makeWorkspace() (+6 more)

### Community 15 - "Backend TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+13 more)

### Community 16 - "Frontend TS Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 17 - "Repo Documentation Concepts"
Cohesion: 0.18
Nodes (21): Backend Express Package, PNPM Workspace Monorepo Architecture, Real-time Collaboration via Socket.IO, Frontend ESLint Config, Frontend Next.js Package, Frontend TypeScript Config, Dependabot Weekly Updates Config, Shared Types Package (+13 more)

### Community 18 - "List Controller & Authz"
Cohesion: 0.11
Nodes (16): archive, copy, move, remove, update, BoardRequest, requireCardAccess(), ROLE_RANK_BOARD (+8 more)

### Community 19 - "Board Controller"
Cohesion: 0.10
Nodes (20): activity, addMember, close, copy, createAutomation, createLabel, createList, get (+12 more)

### Community 20 - "List & Template Models"
Cohesion: 0.11
Nodes (17): ListDoc, listSchema, ListType, TemplateDoc, templateSchema, TemplateType, createBoardFromTemplate(), DEFAULT_TEMPLATES (+9 more)

### Community 21 - "List Service & Ordering"
Cohesion: 0.20
Nodes (16): emitBoard(), move(), archive(), copy(), create(), getById(), _internal, ListId (+8 more)

### Community 22 - "Board Page & View Switcher"
Cohesion: 0.14
Nodes (12): BoardViewKind, Props, VIEWS, ViewSwitcher(), ALLOWED_VIEWS, BoardPage(), useBoard(), useStarBoard() (+4 more)

### Community 23 - "Notifications UI"
Cohesion: 0.24
Nodes (14): useMarkAllRead(), useMarkRead(), useNotifications(), useUnreadCount(), NotificationsPage(), NotificationsDropdown(), DropdownMenuCheckboxItem, DropdownMenuContent (+6 more)

### Community 24 - "Inbox & Misc Controllers"
Cohesion: 0.11
Nodes (12): boardFromTemplate, inboxCapture, inboxConvert, inboxDelete, inboxList, markAllRead, markRead, notifications (+4 more)

### Community 25 - "Backend DevDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, mongodb-memory-server, supertest, tsx, @types/compression, @types/cors, @types/express (+9 more)

### Community 26 - "Attachments & Automation Services"
Cohesion: 0.19
Nodes (12): addAttachment(), presignAttachment(), registerAttachment(), removeAttachment(), setCover(), run(), update(), deleteComment() (+4 more)

### Community 27 - "Backend App Bootstrap"
Cohesion: 0.23
Nodes (9): Env, parsed, schema, logger, errorHandler(), notFoundHandler(), authLimiter, generalLimiter (+1 more)

### Community 28 - "Automation Engine & Reminders"
Cohesion: 0.16
Nodes (11): runDueReminders(), NotificationDoc, notificationSchema, NotificationType, emitUser(), ActionDef, Condition, evalCondition() (+3 more)

### Community 29 - "Board Service"
Cohesion: 0.22
Nodes (12): addMember(), close(), copy(), create(), CreateBoardInput, getById(), getFull(), remove() (+4 more)

### Community 30 - "Password Reset Pages"
Cohesion: 0.20
Nodes (7): FormData, schema, FormData, schema, Input, InputProps, Label

### Community 31 - "Login/Signup Pages"
Cohesion: 0.19
Nodes (9): ApiError, FormData, LoginPage(), schema, AuthField, AuthFieldProps, FormData, schema (+1 more)

### Community 32 - "Realtime Socket Client"
Cohesion: 0.24
Nodes (8): IncomingBoardEvent, getAccessToken(), isPendingMove(), pending, trackPendingMove(), getSocket(), joinBoard(), leaveBoard()

### Community 33 - "Email Verify & API Client"
Cohesion: 0.23
Nodes (8): api(), clearTokens(), getRefreshToken(), refreshAccessToken(), RequestOptions, setTokens(), disconnectSocket(), AuthState

### Community 34 - "Frontend DevDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/leaflet, @types/node (+4 more)

### Community 35 - "Auth Layout & Hero"
Cohesion: 0.18
Nodes (4): AuthHero(), Card, COLUMNS, TONE

### Community 36 - "Inbox Page"
Cohesion: 0.27
Nodes (7): InboxItem, useCaptureInbox(), useDeleteInbox(), useInbox(), InboxPage(), Textarea, TextareaProps

### Community 37 - "Shared Types Package"
Cohesion: 0.17
Nodes (11): ApiError, BoardEventBase, BoardRole, CardMovedPayload, ID, ListMovedPayload, NormalizedPayload, Paginated (+3 more)

### Community 38 - "Workspace Controller"
Cohesion: 0.17
Nodes (11): addMember, boards, create, createBoard, get, list, remove, removeMember (+3 more)

### Community 39 - "Board Model & Search"
Cohesion: 0.17
Nodes (8): backgroundSchema, BOARD_ROLES, BoardDoc, BoardRole, boardSchema, BoardType, customFieldSchema, memberSchema

### Community 40 - "Inbox Items Backend"
Cohesion: 0.18
Nodes (5): createCard, InboxItemDoc, inboxItemSchema, InboxItemType, convert()

### Community 41 - "Frontend Package Metadata"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 42 - "Auth Controller"
Cohesion: 0.18
Nodes (9): forgotPassword, login, logout, me, refresh, resetPassword, signup, verifyEmail (+1 more)

### Community 43 - "Backend Realtime Bus"
Cohesion: 0.27
Nodes (6): BoardEvent, Bus, UserEvent, presence, Socket, SocketUser

### Community 44 - "Upload Controller"
Cohesion: 0.22
Nodes (8): MultipartRequest, presignCardAttachment, registerCardAttachment, remove, setCover, sign, upload, asyncHandler()

### Community 45 - "Backend Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, seed, start, test, test:watch (+1 more)

### Community 46 - "Labels Model & Service"
Cohesion: 0.22
Nodes (4): LabelDoc, labelSchema, LabelType, update()

### Community 47 - "Shared Package Exports"
Cohesion: 0.22
Nodes (8): exports, ./types, main, name, private, type, types, version

### Community 48 - "Card Model Schema"
Cohesion: 0.25
Nodes (7): attachmentSchema, CardDoc, cardSchema, CardType, checklistItemSchema, checklistSchema, coverSchema

### Community 49 - "Background Job Queue"
Cohesion: 0.25
Nodes (5): BullQueueLike, BullWorkerLike, JobQueue, queues, RedisConnection

### Community 50 - "Automation Model"
Cohesion: 0.29
Nodes (6): actionSchema, AutomationDoc, automationSchema, AutomationType, conditionSchema, triggerSchema

### Community 51 - "Auth Test Suite"
Cohesion: 0.29
Nodes (5): app, refresh, refreshToken, token, u

### Community 52 - "Realtime Test Suite"
Cohesion: 0.29
Nodes (5): app, events, evt, notif, userEvents

### Community 53 - "Server Entrypoint"
Cohesion: 0.52
Nodes (6): connectDB(), startDueReminderCron(), startAutomationEngine(), setupSockets(), createApp(), main()

### Community 54 - "Backend Build TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, declaration, noEmit, sourceMap, exclude, extends

### Community 55 - "Backend Package Metadata"
Cohesion: 0.33
Nodes (5): main, name, private, type, version

### Community 56 - "Leaflet Map View"
Cohesion: 0.33
Nodes (3): DEFAULT_ICON, LocCard, Props

### Community 57 - "Comment Model"
Cohesion: 0.40
Nodes (4): CommentDoc, commentSchema, CommentType, reactionSchema

### Community 58 - "Sample Upload Artifacts"
Cohesion: 0.60
Nodes (5): Local Disk Uploads Storage Provider, Card Attachment hello world 3, Card Attachment hello world 4, Card Attachment hello world 2, Card Attachment hello world 1

### Community 59 - "Frontend ESLint Rules"
Cohesion: 0.50
Nodes (3): extends, rules, @next/next/no-html-link-for-pages

### Community 60 - "Activity Model"
Cohesion: 0.50
Nodes (3): ActivityDoc, activitySchema, ActivityType

## Knowledge Gaps
- **474 isolated node(s):** `name`, `version`, `private`, `description`, `packageManager` (+469 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Dependencies` to `Frontend Package Metadata`, `Auth & Workspace Services`?**
  _High betweenness centrality (0.424) - this node is a cross-community bridge._
- **Why does `next` connect `Auth & Workspace Services` to `Frontend Dependencies`?**
  _High betweenness centrality (0.388) - this node is a cross-community bridge._
- **Why does `cn()` connect `Card Tile & Settings` to `Alternate Board Views`, `Card Modal Components`, `Inbox Page`, `Boards Index Page`, `Frontend Dependencies`, `Kanban List Column`, `App Shell Layout`, `Board Page & View Switcher`, `Notifications UI`, `Password Reset Pages`?**
  _High betweenness centrality (0.382) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _475 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.0517503805175038 - nodes in this community are weakly interconnected._
- **Should `Auth & Workspace Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06334841628959276 - nodes in this community are weakly interconnected._
- **Should `Alternate Board Views` be split into smaller, more focused modules?**
  _Cohesion score 0.06547619047619048 - nodes in this community are weakly interconnected._