// scripts/classify-category.ts — keyword-based agent category classifier.
// Used by mirror-local.ts to assign meaningful categories to mirrored agents.

export const CATEGORIES = [
  'Frontend Development',
  'Backend & APIs',
  'Testing & QA',
  'Security',
  'DevOps & CI/CD',
  'Git & Pull Requests',
  'Documentation',
  'Code Review & Quality',
  'AI & Agent Building',
  'Skill Development',
  'Data Science & ML',
  'Release Management',
  'Debugging',
  'Productivity & Planning',
  'Automation & Workflows',
  'Python',
  'Rust',
  'Marketing & SEO',
  'Sales & Marketing',
  'Cloud & Infrastructure',
  'Mobile Development',
  'Go',
  'Java & JVM',
  'Design & UI/UX',
  'CLI & Terminal',
  'Office & Documents',
] as const;

export type Category = (typeof CATEGORIES)[number];

interface Rule {
  category: Category;
  weight: number;
  keywords: RegExp;
}

// Order matters — first match with highest weight wins.
// Keywords are matched against `name + ' ' + description` (lowercased).
const RULES: Rule[] = [
  // Language-specific (check early — these are unambiguous)
  { category: 'Rust', weight: 10, keywords: /\b(rust|cargo|crate|rustfmt|clippy|tokio|wasm-pack)\b/ },
  { category: 'Go', weight: 10, keywords: /\b(golang|go\s+(?:module|package|test|lint)|goroutine|gofmt|gomod)\b/ },
  { category: 'Go', weight: 6, keywords: /(?:^|\/)go[-\s]|^go\b/ },
  { category: 'Python', weight: 10, keywords: /\b(python|pip|pypi|pytest|django|flask|fastapi|pydantic|conda|jupyter|notebook|pandas|numpy)\b/ },
  { category: 'Java & JVM', weight: 10, keywords: /\b(java|jvm|kotlin|scala|gradle|maven|spring\s*boot|springboot|junit|tomcat)\b/ },

  // Security
  { category: 'Security', weight: 10, keywords: /\b(security|vulnerability|vuln|cve|penetration|pentest|owasp|threat|malware|encrypt|auth[oz]|identity|keyvault|credential|ssl|tls|firewall|soc2|gdpr|compliance|audit|hardening|zero.?trust|rbac|iam)\b/ },

  // Testing & QA
  { category: 'Testing & QA', weight: 10, keywords: /\b(test|testing|qa|vitest|jest|playwright|cypress|mocha|selenium|e2e|unit.?test|integration.?test|tdd|bdd|coverage|assertion|mock|stub|fixture|browserstack)\b/ },

  // Git & Pull Requests
  { category: 'Git & Pull Requests', weight: 10, keywords: /\b(git|github|gitlab|bitbucket|pull.?request|pr\b|merge|commit|branch|rebase|diff|changelog|conventional.?commit|version.?control)\b/ },

  // DevOps & CI/CD
  { category: 'DevOps & CI/CD', weight: 10, keywords: /\b(devops|ci.?cd|pipeline|deploy|deployment|docker|container|kubernetes|k8s|helm|terraform|ansible|jenkins|github.?actions|gitlab.?ci|argocd|infra.?as.?code|iac|monitoring|observability|prometheus|grafana|datadog|nginx|caddy|load.?balanc)\b/ },

  // Cloud & Infrastructure
  { category: 'Cloud & Infrastructure', weight: 10, keywords: /\b(aws|azure|gcp|cloud|s3|ec2|lambda|cloudflare|vercel|netlify|heroku|serverless|cdn|cosmos.?db|dynamodb|eventhub|redis|supabase|firebase|neon|planetscale)\b/ },

  // AI & Agent Building
  { category: 'AI & Agent Building', weight: 10, keywords: /\b(ai\b|agent|llm|gpt|openai|claude|gemini|anthropic|langchain|voltagent|mcp|model|prompt.?engineering|rag|embedding|fine.?tun|neural|transformer|copilot|chatbot|conversational|multimodal|vision|speech|nlp|natural.?language)\b/ },

  // Skill Development
  { category: 'Skill Development', weight: 12, keywords: /\b(skill.?creat|skill.?build|skill.?develop|skill.?template|create.?skill|build.?skill|mcp.?builder|skill.?factory)\b/ },

  // Data Science & ML
  { category: 'Data Science & ML', weight: 10, keywords: /\b(data.?science|machine.?learning|ml\b|dataset|analytics|statistics|visualization|chart|graph|sql|database|postgres|mysql|sqlite|clickhouse|duckdb|bigquery|etl|data.?pipeline|data.?warehouse|tableau|looker|csv)\b/ },

  // Mobile Development
  { category: 'Mobile Development', weight: 10, keywords: /\b(mobile|ios|android|react.?native|flutter|swift|swiftui|xcode|expo|ionic|capacitor|app.?store)\b/ },

  // Frontend Development
  { category: 'Frontend Development', weight: 10, keywords: /\b(frontend|front.?end|react|vue|angular|svelte|next\.?js|nuxt|tailwind|css|sass|scss|html|dom|component|responsive|spa|pwa|webpack|vite|browser|web.?app|jsx|tsx|styled|animation|canvas)\b/ },

  // Backend & APIs
  { category: 'Backend & APIs', weight: 10, keywords: /\b(backend|back.?end|api|rest|graphql|grpc|endpoint|server|microservice|middleware|route|controller|express|fastify|hono|stripe|payment|webhook|oauth|jwt|session|socket|websocket|cors)\b/ },

  // Design & UI/UX
  { category: 'Design & UI/UX', weight: 10, keywords: /\b(design|ui|ux|figma|sketch|wireframe|prototype|mockup|layout|typography|color.?palette|icon|illustration|accessibility|a11y|aria|brand|logo|theme|visual|aesthetic|creative)\b/ },

  // Documentation
  { category: 'Documentation', weight: 10, keywords: /\b(document|documentation|readme|docs|technical.?writ|api.?doc|jsdoc|typedoc|storybook|wiki|knowledge.?base|tutorial|guide|manual|reference|spec|rfc)\b/ },

  // Code Review & Quality
  { category: 'Code Review & Quality', weight: 10, keywords: /\b(code.?review|review|refactor|lint|eslint|prettier|format|code.?quality|code.?style|code.?standard|static.?analysis|sonar|complexity|clean.?code|best.?practice|architecture|pattern|solid|dry|kiss)\b/ },

  // Release Management
  { category: 'Release Management', weight: 10, keywords: /\b(release|version|semver|bump|publish|package|npm|registry|changelog|migration|upgrade|update|deprecat|rollback|canary|beta|alpha|staging)\b/ },

  // Debugging
  { category: 'Debugging', weight: 10, keywords: /\b(debug|debugg|error|exception|stack.?trace|breakpoint|inspect|troubleshoot|diagnos|crash|memory.?leak|performance|profil|bottleneck|latency|slow|optimize|benchmark)\b/ },

  // Marketing & SEO
  { category: 'Marketing & SEO', weight: 10, keywords: /\b(marketing|seo|search.?engine|keyword|content.?market|social.?media|campaign|email.?market|newsletter|growth|funnel|conversion|landing.?page|copywriting|blog|ab.?test|analytics.?track|aeo|app.?store.?optim|aso)\b/ },

  // Sales & Marketing
  { category: 'Sales & Marketing', weight: 10, keywords: /\b(sales|crm|pipeline|forecast|revenue|quota|customer.?success|account.?manag|lead|prospect|outreach|cold.?email|pitch|proposal|deal|negotiat|pricing|competitive|market.?research)\b/ },

  // Office & Documents
  { category: 'Office & Documents', weight: 10, keywords: /\b(office|document|pdf|docx|xlsx|pptx|excel|word|powerpoint|slides|spreadsheet|presentation|report|memo|letter|invoice|contract|legal|redlin|board.?deck|board.?meeting|board.?prep|brief|executive|c.?level|ceo|cfo|cto)\b/ },

  // CLI & Terminal
  { category: 'CLI & Terminal', weight: 10, keywords: /\b(cli|terminal|command.?line|shell|bash|zsh|powershell|script|dotfile|tmux|vim|neovim|emacs|editor|ide|vscode)\b/ },

  // Productivity & Planning
  { category: 'Productivity & Planning', weight: 10, keywords: /\b(productivity|planning|project.?manag|agile|scrum|kanban|sprint|jira|atlassian|notion|asana|trello|roadmap|backlog|standup|retrospective|okr|goal|todo|task|workflow|time.?manag|calendar|meeting|schedule)\b/ },

  // Automation & Workflows
  { category: 'Automation & Workflows', weight: 8, keywords: /\b(automat|workflow|orchestrat|pipeline|cron|scheduler|trigger|hook|integration|zapier|n8n|make\.com|ifttt|scrape|crawl|firecrawl|notification|email|sms|push|batch|queue|worker|job)\b/ },
];

export function classifyAgent(name: string, description: string): Category {
  const text = `${name} ${description}`.toLowerCase();

  let bestCategory: Category = 'Automation & Workflows'; // default fallback
  let bestWeight = -1;

  for (const rule of RULES) {
    if (rule.keywords.test(text) && rule.weight > bestWeight) {
      bestCategory = rule.category;
      bestWeight = rule.weight;
    }
  }

  return bestCategory;
}
