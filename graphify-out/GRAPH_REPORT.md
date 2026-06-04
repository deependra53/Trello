# Graph Report - Trello  (2026-06-04)

## Corpus Check
- 227 files · ~321,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1577 nodes · 3395 edges · 96 communities (85 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aee8e60a`
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
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 97 edges
2. `NotFound()` - 47 edges
3. `logActivity()` - 40 edges
4. `useAuthStore` - 38 edges
5. `Button` - 35 edges
6. `Input` - 22 edges
7. `api()` - 21 edges
8. `useWorkspaces()` - 19 edges
9. `compilerOptions` - 19 edges
10. `BadRequest()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `PlannerPage()` --calls--> `format`  [INFERRED]
  frontend/src/app/(app)/planner/page.tsx → package.json
- `dayKey()` --calls--> `format`  [INFERRED]
  frontend/src/components/board/views/calendar-view.tsx → package.json
- `CalendarView()` --calls--> `format`  [INFERRED]
  frontend/src/components/board/views/calendar-view.tsx → package.json
- `CardChips()` --calls--> `format`  [INFERRED]
  frontend/src/components/card/card-modal.tsx → package.json
- `ChecklistItemRow()` --calls--> `format`  [INFERRED]
  frontend/src/components/card/card-modal.tsx → package.json

## Hyperedges (group relationships)
- **PNPM Workspace Packages** — frontend_package_frontend, backend_package_backend, shared_package_shared, trello_pnpm_workspace_packages [EXTRACTED 1.00]
- **Docker Compose Service Stack** — trello_docker_compose_mongo, trello_docker_compose_redis, trello_docker_compose_backend, trello_docker_compose_frontend [EXTRACTED 1.00]
- **CI/CD GitHub Actions Pipeline** — workflows_frontend_ci_pipeline, workflows_backend_ci_pipeline, workflows_deploy_pipeline, github_dependabot_weekly_npm [EXTRACTED 1.00]

## Communities (96 total, 11 thin omitted)

### Community 0 - "API Routes Layer"
Cohesion: 0.16
Nodes (17): router, acceptBoardInviteSchema, addBoardMemberSchema, backgroundSchema, copyBoardSchema, createBoardInviteSchema, customFieldSchema, shareLinkSchema (+9 more)

### Community 1 - "Auth & Workspace Services"
Cohesion: 0.11
Nodes (32): AppLayout(), ChatApp(), ChatNotificationsView(), useChatAccess(), useOrgChatRealtime(), useChannels(), useUnread(), NotificationPage (+24 more)

### Community 2 - "Alternate Board Views"
Cohesion: 0.10
Nodes (21): CardChips(), HOURS, PlannerPage(), format, BoardFull, Card, Label, List (+13 more)

### Community 3 - "Card Modal Components"
Cohesion: 0.07
Nodes (45): ActivityRow(), AttachmentsSection(), CardModal(), ChecklistItemRow(), ChecklistPopover(), ChecklistSection(), CommentComposer(), CommentRow() (+37 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, class-variance-authority, clsx, cmdk, date-fns, framer-motion, @hello-pangea/dnd, @hookform/resolvers (+38 more)

### Community 5 - "Boards Index Page"
Cohesion: 0.05
Nodes (56): BoardSkeleton(), BoardCard(), BoardEntry, BoardSwitcherDialog(), Props, SectionLabel(), SORT_LABELS, SortKey (+48 more)

### Community 6 - "Card Tile & Settings"
Cohesion: 0.09
Nodes (37): NotificationKey, ProfilePatch, useChangePassword(), useUpdateProfile(), useUploadAvatar(), useTemplates(), AppearanceSection(), THEMES (+29 more)

### Community 7 - "Kanban List Column"
Cohesion: 0.07
Nodes (26): addMembers, createChannel, createDm, deleteMessage, editMessage, getChannel, joinChannel, leaveChannel (+18 more)

### Community 8 - "Card Controllers"
Cohesion: 0.08
Nodes (24): addChecklist, addChecklistItem, addComment, archive, cardActivity, convertChecklistItem, copy, deleteChecklist (+16 more)

### Community 9 - "Card Service Layer"
Cohesion: 0.16
Nodes (29): emitBoard(), logActivity(), addChecklist(), addChecklistItem(), addComment(), archive(), CardExtras, convertChecklistItemToCard() (+21 more)

### Community 10 - "Root Workspace Config"
Cohesion: 0.08
Nodes (23): description, devDependencies, prettier, typescript, engines, node, name, packageManager (+15 more)

### Community 11 - "Backend Dependencies"
Cohesion: 0.52
Nodes (6): connectDB(), startDueReminderCron(), startAutomationEngine(), setupSockets(), createApp(), main()

### Community 12 - "Upload Storage Providers"
Cohesion: 0.11
Nodes (9): buildObjectKey(), CloudinaryProvider, contentDisposition(), LOCAL_ROOT, LocalProvider, PresignedUpload, S3Provider, StoredFile (+1 more)

### Community 13 - "App Shell Layout"
Cohesion: 0.07
Nodes (39): EmailInviteSection(), ROLE_LABEL, ShareLinkSection(), FormData, schema, useAcceptBoardInvite(), useAutoJoinBoardIfAuthed(), useBoardInvitePreview() (+31 more)

### Community 14 - "Backend Integration Tests"
Cohesion: 0.13
Nodes (18): app, labelId, app, guestToken, newToken, token, app, makeBoard() (+10 more)

### Community 15 - "Backend TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+13 more)

### Community 16 - "Frontend TS Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 18 - "List Controller & Authz"
Cohesion: 0.10
Nodes (18): ConversationWelcome(), WelcomeMember, appendMessageToCache(), MessageCache, MessagePage, patchMessageInCaches(), reconcileChannelMessages(), RepliesCache (+10 more)

### Community 19 - "Board Controller"
Cohesion: 0.07
Nodes (28): acceptInvite, activity, addMember, close, copy, createAutomation, createInvite, createLabel (+20 more)

### Community 20 - "List & Template Models"
Cohesion: 0.09
Nodes (20): LabelDoc, labelSchema, LabelType, ListDoc, listSchema, ListType, TemplateDoc, templateSchema (+12 more)

### Community 21 - "List Service & Ordering"
Cohesion: 0.27
Nodes (9): archive(), copy(), create(), getById(), _internal, ListId, nextPosition(), remove() (+1 more)

### Community 22 - "Board Page & View Switcher"
Cohesion: 0.10
Nodes (19): BoardBottomNav(), Props, applyBoardFilter(), BoardFilter, emptyFilter, isFilterActive(), BoardShareDialog(), BoardViewKind (+11 more)

### Community 23 - "Notifications UI"
Cohesion: 0.16
Nodes (13): benefits, features, AddCardForm(), useUpdateWorkspace(), useCreateCard(), VISIBILITIES, WorkspaceSection(), ThemeToggle() (+5 more)

### Community 24 - "Inbox & Misc Controllers"
Cohesion: 0.15
Nodes (23): CreateChannelInput, isMember(), joinChannel(), listChannelsFor(), listDmsFor(), listMessages(), listPins(), listRecentMessages() (+15 more)

### Community 25 - "Backend DevDependencies"
Cohesion: 0.12
Nodes (18): inter, metadata, RootLayout(), idbDel(), idbGet(), idbRequest(), idbSet(), openDB() (+10 more)

### Community 26 - "Attachments & Automation Services"
Cohesion: 0.13
Nodes (12): ActivityInput, addAttachment(), presignAttachment(), registerAttachment(), removeAttachment(), setCover(), run(), update() (+4 more)

### Community 27 - "Backend App Bootstrap"
Cohesion: 0.10
Nodes (16): Env, parsed, schema, base, devLine, logger, Meta, BullQueueLike (+8 more)

### Community 28 - "Automation Engine & Reminders"
Cohesion: 0.09
Nodes (18): actionSchema, AutomationDoc, automationSchema, AutomationType, conditionSchema, triggerSchema, CommentDoc, commentSchema (+10 more)

### Community 29 - "Board Service"
Cohesion: 0.12
Nodes (16): acceptInvite, addMember, boards, create, createBoard, createInvite, get, list (+8 more)

### Community 30 - "Password Reset Pages"
Cohesion: 0.16
Nodes (15): AddToBoardDialog(), swatchStyle(), components, MessageBody(), withMentions(), MessageItem(), useBoardLists(), useWritableBoards() (+7 more)

### Community 31 - "Login/Signup Pages"
Cohesion: 0.09
Nodes (27): AvatarRequest, changePassword, forgotPassword, inviteInfo, login, logout, me, refresh (+19 more)

### Community 32 - "Realtime Socket Client"
Cohesion: 0.13
Nodes (16): IncomingBoardEvent, IncomingCommentEvent, getAccessToken(), isPendingMove(), pending, trackPendingMove(), disconnectSocket(), emitTyping() (+8 more)

### Community 33 - "Email Verify & API Client"
Cohesion: 0.08
Nodes (23): activeFilterCount(), ActivityFilter, BoardFilterPopover(), CheckboxRow(), DueFilter, ExpandableRow(), LabelRow(), MatchMode (+15 more)

### Community 34 - "Frontend DevDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/leaflet, @types/node (+4 more)

### Community 35 - "Auth Layout & Hero"
Cohesion: 0.11
Nodes (7): AuthHero(), Card, CHAT, ChatMsg, COLUMNS, Tone, View

### Community 36 - "Inbox Page"
Cohesion: 0.21
Nodes (13): anyOrgMember, router, upload, addChannelMembersSchema, attachmentSchema, createChannelSchema, createDmSchema, editMessageSchema (+5 more)

### Community 37 - "Shared Types Package"
Cohesion: 0.17
Nodes (11): ApiError, BoardEventBase, BoardRole, CardMovedPayload, ID, ListMovedPayload, NormalizedPayload, Paginated (+3 more)

### Community 38 - "Workspace Controller"
Cohesion: 0.20
Nodes (16): AddMembersDialog(), CreateChannelDialog(), InvitePeopleDialog(), StartDmDialog(), MemberPicker(), useAddChannelMembers(), useCreateChannel(), useCreateInvite() (+8 more)

### Community 39 - "Board Model & Search"
Cohesion: 0.06
Nodes (41): BOARD_ROLES, BOARD_INVITE_KINDS, BOARD_INVITE_STATUSES, BoardInviteDoc, BoardInviteKind, boardInviteSchema, BoardInviteStatus, BoardInviteType (+33 more)

### Community 40 - "Inbox Items Backend"
Cohesion: 0.22
Nodes (8): archive, copy, createCard, createCardFromMessage, move, remove, update, Forbidden()

### Community 41 - "Frontend Package Metadata"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 42 - "Auth Controller"
Cohesion: 0.19
Nodes (14): Source, validate(), router, upload, addCardLabelSchema, addCardMemberSchema, checklistItemSchema, checklistSchema (+6 more)

### Community 43 - "Backend Realtime Bus"
Cohesion: 0.12
Nodes (10): activity, app, channelEvents, entry, ids1, ids2, newMsg, payload (+2 more)

### Community 44 - "Upload Controller"
Cohesion: 0.20
Nodes (9): MultipartRequest, presignCardAttachment, registerCardAttachment, remove, setCover, sign, upload, BoardRequest (+1 more)

### Community 45 - "Backend Scripts"
Cohesion: 0.08
Nodes (26): AuthResult, forgotPassword(), getMe(), login(), refresh(), RequestContext, resetPassword(), signup() (+18 more)

### Community 46 - "Labels Model & Service"
Cohesion: 0.23
Nodes (12): smartTime(), ThreadsView(), UserAvatar(), useUserThreads(), avatarColor(), channelLabel(), formatDayLabel(), formatTime() (+4 more)

### Community 47 - "Shared Package Exports"
Cohesion: 0.22
Nodes (8): exports, ./types, main, name, private, type, types, version

### Community 48 - "Card Model Schema"
Cohesion: 0.25
Nodes (7): attachmentSchema, CardDoc, cardSchema, CardType, checklistItemSchema, checklistSchema, coverSchema

### Community 49 - "Background Job Queue"
Cohesion: 0.15
Nodes (17): AddListForm(), CardTile(), dueColor(), Props, instantDropStyle(), ListColumn(), Props, useCreateList() (+9 more)

### Community 50 - "Automation Model"
Cohesion: 0.12
Nodes (13): ChannelRequest, requireBoardRole(), requireCardAccess(), requireChannelAccess(), requireWorkspaceRole(), ROLE_RANK_BOARD, ROLE_RANK_WS, memberSchema (+5 more)

### Community 51 - "Auth Test Suite"
Cohesion: 0.16
Nodes (9): errorHandler(), notFoundHandler(), requestLogger(), app, refresh, refreshToken, token, u (+1 more)

### Community 52 - "Realtime Test Suite"
Cohesion: 0.17
Nodes (13): runDueReminders(), emitUser(), runAction(), leaveChannel(), markRead(), CHAT_TYPES, create(), CreateNotificationInput (+5 more)

### Community 53 - "Server Entrypoint"
Cohesion: 0.12
Nodes (11): backgroundSchema, BoardDoc, BoardRole, boardSchema, BoardType, customFieldSchema, memberSchema, preferencesSchema (+3 more)

### Community 54 - "Backend Build TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, declaration, noEmit, sourceMap, exclude, extends

### Community 55 - "Backend Package Metadata"
Cohesion: 0.20
Nodes (14): addMember(), attachCardCounts(), close(), copy(), create(), CreateBoardInput, getById(), getFull() (+6 more)

### Community 56 - "Leaflet Map View"
Cohesion: 0.33
Nodes (3): DEFAULT_ICON, LocCard, Props

### Community 57 - "Comment Model"
Cohesion: 0.22
Nodes (11): RightPanel, PinsPanel(), SearchPanel(), ThreadPanel(), useChatBootstrap(), useDms(), usePins(), useReplies() (+3 more)

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
Cohesion: 0.21
Nodes (10): ChannelRail(), ChannelSummary, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+2 more)

### Community 69 - "Models Barrel"
Cohesion: 0.22
Nodes (8): CHANNEL_KINDS, CHANNEL_MEMBER_ROLES, ChannelDoc, ChannelKind, ChannelMemberRole, channelMemberSchema, channelSchema, ChannelType

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): IndiHive, Never use `backdrop-blur` (or `backdrop-filter: blur(...)`) on large, fullscreen, or scrollable surfaces, Performance rules

### Community 71 - "Community 71"
Cohesion: 0.23
Nodes (11): MembersDialog(), Conversation(), MessageListSkeleton(), ROWS, useChannelRealtime(), useChannel(), useJoinChannel(), useLeaveChannel() (+3 more)

### Community 72 - "Community 72"
Cohesion: 0.22
Nodes (7): next, AuthedRequest, optionalAuth(), requireAuth(), router, router, fromTemplateSchema

### Community 73 - "Community 73"
Cohesion: 0.25
Nodes (6): app, events, evt, notif, payload, userEvents

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (3): RefreshTokenDoc, refreshTokenSchema, RefreshTokenType

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (7): applyCardMove(), applyListMove(), computePosition(), board, cards, lists, out

### Community 79 - "Community 79"
Cohesion: 0.24
Nodes (8): BoardEvent, Bus, ChannelEvent, UserEvent, WorkspaceEvent, presence, Socket, SocketUser

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (9): requireListAccess(), router, createCardFromMessageSchema, createCardSchema, copyListSchema, createListSchema, moveListSchema, updateListSchema (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.18
Nodes (10): Branch protection (recommended), code:bash (# 1. Install dependencies), code:block2 (indihive/), IndiHive, License, Phase plan, Quick start, Repository layout (+2 more)

### Community 82 - "Community 82"
Cohesion: 0.27
Nodes (11): emitChannel(), assertChannelAccess(), deleteMessage(), editMessage(), getMessageForCard(), listReplies(), loadOwnMessage(), serializeMessage() (+3 more)

### Community 83 - "Community 83"
Cohesion: 0.20
Nodes (8): boardFromTemplate, markAllRead, markRead, notifications, planner, search, templates, unreadCount

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (8): router, createBoardSchema, acceptInviteSchema, addMemberSchema, createInviteSchema, createWorkspaceSchema, updateMemberSchema, updateWorkspaceSchema

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (7): Composer(), PendingAttachment, ToolbarButton(), uploadChatFile(), useSendMessage(), REACTION_EMOJIS, ChatAttachment

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (8): emitWorkspace(), addMembers(), createChannel(), dmKeyFor(), getChannel(), getOrCreateDm(), notifyChannelMembersAdded(), updateChannel()

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (5): attachmentSchema, MessageDoc, messageSchema, MessageType, reactionSchema

## Knowledge Gaps
- **595 isolated node(s):** `Never use `backdrop-blur` (or `backdrop-filter: blur(...)`) on large, fullscreen, or scrollable surfaces`, `Stack`, `code:bash (# 1. Install dependencies)`, `code:block2 (indihive/)`, `Scripts (root)` (+590 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Dependencies` to `Community 72`, `Frontend Package Metadata`?**
  _High betweenness centrality (0.435) - this node is a cross-community bridge._
- **Why does `cn()` connect `Email Verify & API Client` to `Auth & Workspace Services`, `Alternate Board Views`, `Card Modal Components`, `Frontend Dependencies`, `Boards Index Page`, `Card Tile & Settings`, `App Shell Layout`, `List Controller & Authz`, `Board Page & View Switcher`, `Notifications UI`, `Backend DevDependencies`, `Password Reset Pages`, `Workspace Controller`, `Labels Model & Service`, `Background Job Queue`, `Comment Model`, `Test Setup`, `Community 71`, `Community 85`?**
  _High betweenness centrality (0.427) - this node is a cross-community bridge._
- **Why does `next` connect `Community 72` to `Frontend Dependencies`?**
  _High betweenness centrality (0.399) - this node is a cross-community bridge._
- **What connects `Never use `backdrop-blur` (or `backdrop-filter: blur(...)`) on large, fullscreen, or scrollable surfaces`, `Stack`, `code:bash (# 1. Install dependencies)` to the rest of the system?**
  _595 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Workspace Services` be split into smaller, more focused modules?**
  _Cohesion score 0.10628019323671498 - nodes in this community are weakly interconnected._
- **Should `Alternate Board Views` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
- **Should `Card Modal Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._