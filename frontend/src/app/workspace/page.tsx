'use client';
import { GitHubIntegration } from '@/components/common/GitHubIntegration';
import {githubRequest,GitHubWorkspace} from '@/lib/github';
import {PipelineModal} from '@/components/workspace/PipelineModal';
import type {PipelineResult} from '@/components/workspace/usePipelineRunner';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge, PriorityBadge } from '@/components/ui/Badge';
import { JourneyProgress } from '@/components/common/JourneyProgress';
import { TicketSupport } from '@/components/common/TicketSupport';
import { api } from '@/lib/api/client';
import {
  Enrollment,
  ProjectTicket,
  WorkspaceData,
  TicketStatus,
  AiChatMessage,
} from '@/lib/types';
import {
  Briefcase,
  GitBranch,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  X,
  AlertCircle,
  FileCode,
  Layers,
  ChevronRight,
  Terminal,
  Code2,
  Lightbulb,
  Play,
  Rocket,
  GitPullRequest,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceContent />
    </AuthGuard>
  );
}

interface StarterTemplate {
  filename: string;
  guide: string;
  skeleton: string;
}

const STARTER_TEMPLATES: Record<string, StarterTemplate> = {
  'QK-101': {
    filename: 'ProductController.java',
    guide: 'Implement the product catalog API with pagination and filters for category, minPrice, and maxPrice.',
    skeleton: `@RestController
@RequestMapping("/api/v1/catalog/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductDto>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(page = 0, size = 20, sort = "price") Pageable pageable
    ) {
        PageResponse<ProductDto> products = productService.findProducts(categoryId, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(products);
    }
}`,
  },
  'QK-102': {
    filename: 'CartService.java',
    guide: 'Validate stock availability and hold a 15-minute temporary inventory reservation during checkout.',
    skeleton: `@Service
@RequiredArgsConstructor
public class CartService {

    private final InventoryRepository inventoryRepo;

    @Transactional
    public CartItemResponse addItemToCart(String userId, Long productId, int quantity) {
        Inventory stock = inventoryRepo.findByProductId(productId)
                .orElseThrow(() -> new InsufficientStockException("Product out of stock"));

        if (stock.getAvailableQuantity() < quantity) {
            throw new InsufficientStockException("Requested quantity exceeds available stock");
        }

        // Temporary 15-minute hold on inventory
        stock.reserve(quantity, Duration.ofMinutes(15));
        inventoryRepo.save(stock);

        return CartItemResponse.builder()
                .productId(productId)
                .reservedQuantity(quantity)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
    }
}`,
  },
  'QK-103': {
    filename: 'ProductRepository.java',
    guide: 'Use pessimistic write locking (@Lock(LockModeType.PESSIMISTIC_WRITE)) to eliminate flash-sale race conditions.',
    skeleton: `public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithPessimisticLock(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int decrementStockSafely(@Param("id") Long id, @Param("qty") int qty);
}`,
  },
  'QK-104': {
    filename: 'OrderController.java',
    guide: 'Implement idempotency key header checking to prevent duplicate charge & order submissions on network retries.',
    skeleton: `@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final IdempotencyService idempotencyService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestHeader(value = "Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        if (idempotencyService.hasKey(idempotencyKey)) {
            return ResponseEntity.ok(idempotencyService.getCachedResponse(idempotencyKey));
        }

        OrderResponse order = orderService.createOrder(request);
        idempotencyService.save(idempotencyKey, order);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}`,
  },
  'QK-105': {
    filename: 'RateLimitingFilter.java',
    guide: 'Implement token bucket rate limiting filter to protect endpoints from automated scraping.',
    skeleton: `@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientIp = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createNewBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("{\\"error\\": \\"Rate limit exceeded (10 req/min)\\"}");
        }
    }
}`,
  },
};

function getStarterTemplate(ticket?: ProjectTicket | null): StarterTemplate {
  if (ticket?.generationSource === 'BUILT_IN' || ticket?.targetUserId) {
    const desc = (ticket.description || '').toLowerCase();
    const guide = 'Implement the business requirement in your project repository. Replace the placeholder below, add tests and submit implementation plus test code.';
    if (desc.includes('react') || desc.includes('typescript') || desc.includes('javascript')) return { filename: 'solution.tsx', guide, skeleton: 'export function ResourceList() {\n  // Replace this with your implementation and add tests.\n  throw new Error("Not implemented");\n}\n' };
    if (desc.includes('python') || desc.includes('django')) return { filename: 'solution.py', guide, skeleton: 'def handle_resources(data):\n    # Replace this with your implementation and add tests.\n    raise NotImplementedError()\n' };
    return { filename: 'Solution.java', guide, skeleton: 'public class Solution {\n    public Object execute(Object input) {\n        // Replace this with your implementation and add tests.\n        throw new UnsupportedOperationException("Not implemented");\n    }\n}\n' };
  }
  if (!ticket) {
    return {
      filename: 'Solution.java',
      guide: 'Write your Java implementation satisfying the ticket acceptance criteria.',
      skeleton: '// Write or paste your implementation code here...\n',
    };
  }

  if (STARTER_TEMPLATES[ticket.ticketKey]) {
    return STARTER_TEMPLATES[ticket.ticketKey];
  }

  const title = (ticket.title || '').toLowerCase();
  const criteria = (ticket.acceptanceCriteria || '').toLowerCase();

  if (
    title.includes('validation') ||
    title.includes('exception') ||
    criteria.includes('validation') ||
    criteria.includes('exception') ||
    criteria.includes('@valid')
  ) {
    return {
      filename: 'GlobalExceptionHandler.java',
      guide: 'Implement Jakarta Bean Validation and Global Exception Handling using @RestControllerAdvice and @ExceptionHandler.',
      skeleton: `@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", Instant.now(),
            "status", 404,
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unhandled server exception: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", Instant.now(),
            "status", 500,
            "message", "An unexpected server error occurred."
        ));
    }
}`,
    };
  }

  if (
    title.includes('rest') ||
    title.includes('api') ||
    title.includes('controller') ||
    title.includes('endpoint') ||
    title.includes('pagin') ||
    title.includes('filter') ||
    criteria.includes('pageable') ||
    criteria.includes('pageresponse') ||
    criteria.includes('get endpoint')
  ) {
    return {
      filename: 'ManagementController.java',
      guide: 'Implement the REST API controller with pagination (Pageable), sorting, and query parameter filtering.',
      skeleton: `@RestController
@RequestMapping("/api/v1/management")
@RequiredArgsConstructor
public class ManagementController {

    private final ManagementService managementService;

    // TODO: Implement GET endpoint supporting status, category, date filters, and pagination
    @GetMapping
    public ResponseEntity<PageResponse<ManagementItemDto>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @PageableDefault(page = 0, size = 20, sort = "createdAt") Pageable pageable
    ) {
        PageResponse<ManagementItemDto> response = managementService.findItems(category, status, startDate, endDate, pageable);
        return ResponseEntity.ok(response);
    }
}`,
    };
  }

  if (title.includes('security') || title.includes('jwt') || title.includes('auth')) {
    return {
      filename: 'SecurityConfig.java',
      guide: 'Configure Spring Security filter chain with JWT authentication filter and stateless session management.',
      skeleton: `@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}`,
    };
  }

  const className = (ticket.title || 'Solution')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + 'Service';

  return {
    filename: `${className}.java`,
    guide: `Implement the solution for "${ticket.title}" satisfying the acceptance criteria listed in Requirements.`,
    skeleton: `@Service
@Slf4j
@RequiredArgsConstructor
public class ${className} {

    // TODO: Inject required repositories or dependencies

    /**
     * Implementation satisfying ticket criteria:
${(ticket.acceptanceCriteria || '')
  .split('\n')
  .filter(Boolean)
  .map((c) => `     * ${c.replace(/^-/, '•')}`)
  .join('\n')}
     */
    public void execute() {
        // Implement your solution logic here
    }
}`,
  };
}

const COLUMNS: { id: TicketStatus; label: string; countColor: string }[] = [
  { id: 'TODO', label: 'To Do', countColor: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', countColor: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'IN_REVIEW', label: 'In Review', countColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'DONE', label: 'Done', countColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' },
];

function WorkspaceContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ProjectTicket | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [githubPrUrl, setGithubPrUrl] = useState('');
  const [submissionMode, setSubmissionMode] = useState<'code' | 'github'>('code');
  const [githubRepoReady,setGithubRepoReady] = useState(false);
  const [pipelineRun,setPipelineRun]=useState<{key:number;ticketKey:string;code:string;mode:'code'|'github';run:()=>Promise<PipelineResult>}|null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'guide' | 'submit'>('overview');
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // AI Tech Lead Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'lead'; name: string; text: string; time: string }[]
  >([
    {
      sender: 'lead',
      name: 'Alex Mitchell (Tech Lead)',
      text: "Hey! I'm Alex, your Tech Lead for this project. If you have questions about Java, Spring Boot architecture, unit testing, or specific tickets, ask me here.",
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    try {
      setLoading(true);
      const enrollmentRes = await api.getCurrentEnrollment();
      const enrollment = enrollmentRes.data;

      if (!enrollment) {
        setLoading(false);
        return;
      }

      setCurrentEnrollment(enrollment);
      const wsRes = await api.getWorkspace(enrollment.id);
      setWorkspace(wsRes.data);
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    ticket: ProjectTicket,
    newStatus: TicketStatus,
    overrideNotes?: string
  ) {
    if (!workspace) return;
    try {
      setIsUpdatingStatus(true);
      const notesToSend = overrideNotes !== undefined 
        ? overrideNotes 
        : (submissionNotes || ticket.submissionNotes || undefined);

      const res = await api.updateTicketStatus(workspace.enrollmentId, ticket.id, {
        status: newStatus,
        submissionNotes: notesToSend,
      });

      // Update state locally
      const updatedTickets = workspace.tickets.map((t) =>
        t.id === ticket.id ? res.data : t
      );

      const completed = updatedTickets.filter((t) => t.status === 'DONE').length;
      const total = updatedTickets.length;
      const progress = Math.round((completed / total) * 100);

      setWorkspace({
        ...workspace,
        tickets: updatedTickets,
        completedTickets: completed,
        progressPercentage: progress,
      });

      setSelectedTicket(res.data);
      if (newStatus === 'IN_REVIEW' || newStatus === 'DONE') {
        setModalTab('submit');
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert('Failed to update ticket status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function openTicketModal(ticket: ProjectTicket) {
    setSelectedTicket(ticket);
    const template = getStarterTemplate(ticket);

    if (ticket.submissionNotes && ticket.submissionNotes.includes('Code Snippet:')) {
      const parts = ticket.submissionNotes.split('Developer Notes:');
      const snippetPart = parts[0].replace('Code Snippet:', '').trim();
      const devNotesPart = parts[1] ? parts[1].trim() : '';
      setCodeSnippet(snippetPart);
      setSubmissionNotes(devNotesPart);
    } else {
      setSubmissionNotes(ticket.submissionNotes || '');
      setCodeSnippet(template.skeleton);
    }

    if (ticket.status === 'IN_REVIEW' || ticket.status === 'DONE' || ticket.aiReviewFeedback) {
      setModalTab('submit');
    } else {
      setModalTab('overview');
    }
  }

  async function handleSendChatMessage(overrideMsg?: string) {
    const messageToSend = overrideMsg || inputMessage;
    if (!messageToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      name: user?.profile?.name || 'You',
      text: messageToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideMsg) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await api.chatWithTechLead({
        ticketId: chatTicketId || selectedTicket?.id || undefined,
        message: messageToSend,
      });

      const leadMsg = {
        sender: 'lead' as const,
        name: `${res.data.senderName} (${res.data.senderRole})`,
        text: res.data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, leadMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'lead',
          name: 'Alex Mitchell (Tech Lead)',
          text: 'Sorry, I ran into a network issue reviewing that. Make sure the Spring Boot service layer and DTO tests are passing, and ask me again!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  }

  function copyBranchCommand(ticketKey: string) {
    const branch = `feature/${ticketKey.toLowerCase()}-${workspace?.project?.slug || 'task'}`;
    navigator.clipboard.writeText(`git checkout -b ${branch}`);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  }

  function submitCurrentSolution() {
    if (!selectedTicket || !workspace || pipelineRun) return;
    const ticket=selectedTicket;
    const enrollmentId=workspace.enrollmentId;
    const mode=submissionMode;
    const code=codeSnippet;
    const notes=mode==='code'
      ? 'Code Snippet:\n'+code+'\n\nDeveloper Notes:\n'+submissionNotes
      : 'GitHub PR URL: '+githubPrUrl+'\n\nDeveloper Notes:\n'+submissionNotes;
    const run=async():Promise<PipelineResult>=>{
      let updated:ProjectTicket;
      let githubFeedback:string|undefined;
      let githubApproved=true;
      if(mode==='github'&&githubRepoReady){
        const synced=await githubRequest<GitHubWorkspace>('/projects/'+enrollmentId+'/sync','POST');
        const fresh=await api.getWorkspace(enrollmentId);
        const found=fresh.data.tickets.find(t=>t.id===ticket.id);
        if(!found)throw new Error('Ticket was not found after repository sync.');
        updated=found;
        const pr=synced.pullRequests.find(p=>p.ticket_id===ticket.id);
        githubApproved=!!pr?.approved;
        githubFeedback=pr?.review_body||'Open a PR using this ticket branch, then retry. A matching approved PR is required.';
        setWorkspace(fresh.data);
      }else{
        if(mode==='github'){
          let url:URL;try{url=new URL(githubPrUrl);}catch{throw new Error('Enter a valid GitHub PR URL or set up your GitHub workspace.');}
          if(url.protocol!=='https:'||url.hostname!=='github.com'||!/^\/[^/]+\/[^/]+\/(pull\/\d+|commit\/[a-f0-9]+)\/?$/i.test(url.pathname))throw new Error('Use an HTTPS GitHub pull request or commit URL.');
        }
        const response=await api.updateTicketStatus(enrollmentId,ticket.id,{status:'IN_REVIEW',submissionNotes:notes});
        updated=response.data;
        setWorkspace(current=>{if(!current)return current;const tickets=current.tickets.map(t=>t.id===updated.id?updated:t);const completed=tickets.filter(t=>t.status==='DONE').length;return {...current,tickets,completedTickets:completed,progressPercentage:tickets.length?Math.round(completed/tickets.length*100):0};});
      }
      setSelectedTicket(updated);setModalTab('submit');
      return {approved:updated.status==='DONE'&&githubApproved,feedback:githubFeedback||updated.aiReviewFeedback||'Backend review has not approved the submission. Review ticket acceptance criteria and retry.',score:updated.reviewScore};
    };
    setPipelineRun({key:Date.now(),ticketKey:ticket.ticketKey,code,mode,run});
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading engineering workspace...</p>
      </div>
    );
  }

  if (!workspace || !currentEnrollment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <JourneyProgress />
        <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 space-y-4">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No Active Project Enrolled
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            You need to enroll in a project before opening the engineering workspace. Browse available projects and pick one to begin your simulated internship.
          </p>
          <div className="pt-2">
            <Link href="/projects">
              <Button variant="primary">Browse Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tickets = workspace.tickets || [];

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {pipelineRun&&<PipelineModal key={pipelineRun.key} ticketKey={pipelineRun.ticketKey} code={pipelineRun.code} mode={pipelineRun.mode} run={pipelineRun.run} onClose={()=>setPipelineRun(null)} onRerun={()=>setPipelineRun(current=>current?{...current,key:Date.now()}:null)} onNext={workspace.tickets.some(t=>t.status==='TODO')?()=>{setPipelineRun(null);const next=workspace.tickets.find(t=>t.status==='TODO');if(next)openTicketModal(next);}:undefined}/>}
      <JourneyProgress onSprint={loadWorkspace} />
      <GitHubIntegration enrollmentId={workspace.enrollmentId} onSync={loadWorkspace} onRepositoryChange={setGithubRepoReady}/>
      {/* 1. TOP WORKSPACE BAR */}
      <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
            <span>{workspace.company?.name || "Independent project"}</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">{workspace.project?.name}</span>
            <span>/</span>
            <span>Sprint Board</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Engineering Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track: <strong>{workspace.project.careerTrack?.name || "Software Engineering"}</strong> • Company: <strong>{workspace.company?.name || "Independent project"}</strong>
          </p>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress Mini Card */}
          <div className="min-w-[180px] p-2.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Sprint Progress</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {workspace.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="progress-fill h-full rounded-full"
                style={{ width: `${workspace.progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {workspace.completedTickets} of {workspace.totalTickets} tickets done
              <span className="block mt-1">7-day velocity: {tickets.filter(t=>t.status==='DONE'&&t.completedAt&&new Date(t.completedAt).getTime()>=Date.now()-7*86400000).length} tickets</span>
            </div>
          </div>

          {/* AI Tech Lead Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Tech Lead (Alex)</span>
          </Button>

          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SPRINT BOARD (KANBAN) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {col.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${col.countColor}`}
                >
                  {colTickets.length}
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {colTickets.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">
                    No tickets
                  </div>
                ) : (
                  colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => openTicketModal(ticket)}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 motion-safe:hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer shadow-none space-y-2.5"
                    >
                      {/* Ticket Key & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {ticket.ticketKey}
                        </span>
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      {/* Ticket Title */}
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {ticket.title}
                      </h4>

                      {/* Bottom row: Type & Estimated Hours */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize">{ticket.ticketType.toLowerCase()}</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {ticket.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedTicket.ticketKey}
                </span>
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 capitalize">
                  {selectedTicket.ticketType.toLowerCase()}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> ~{selectedTicket.estimatedHours}h
                </span>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title Bar */}
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {selectedTicket.title}
              </h3>
            </div>

            <TicketSupport key={selectedTicket.id} ticket={selectedTicket} enrollmentId={workspace.enrollmentId} />
            {/* Interactive Tab Navigation */}
            <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-medium">
              <button
                onClick={() => setModalTab('overview')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === 'overview'
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>1. Requirements</span>
              </button>

              <button
                onClick={() => setModalTab('guide')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === 'guide'
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Starter Guide & Code</span>
              </button>

              <button
                onClick={() => setModalTab('submit')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors relative ${
                  modalTab === 'submit'
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Rocket className="w-3.5 h-3.5 text-blue-500" />
                <span>3. Submit & AI Review</span>
                {selectedTicket.status === 'IN_REVIEW' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                {selectedTicket.status === 'DONE' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              {/* TAB 1: REQUIREMENTS */}
              {modalTab === 'overview' && (
                <div className="space-y-4">
                  {/* Business Goal Description */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Business Goal & Description
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Acceptance Criteria Checklist */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Acceptance Criteria (Must Pass)
                      </span>
                      <span className="text-[11px] text-slate-400">All points reviewed by AI Tech Lead</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {selectedTicket.acceptanceCriteria.split('\n').filter(Boolean).map((line, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2 rounded bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Local Git Branch Info (Optional for Git users) */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        Optional: Simulated Git Branch Command
                      </span>
                      <button
                        onClick={() => copyBranchCommand(selectedTicket.ticketKey)}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedBranch ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 select-all">
                      git checkout -b feature/{selectedTicket.ticketKey.toLowerCase()}-{workspace.project?.slug || 'task'}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      💡 <em>Zero-setup tip: You do not need to run Git locally. You can inspect the starter code in Tab 2 and submit your solution directly in Tab 3!</em>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: STARTER GUIDE & CODE SKELETON */}
              {modalTab === 'guide' && (
                <div className="space-y-4">
                  {(() => {
                    const currentTemplate = getStarterTemplate(selectedTicket);
                    return (
                      <>
                        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
                          <span className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            Engineering Guidance from Alex Mitchell
                          </span>
                          <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                            {currentTemplate.guide}
                          </p>
                        </div>

                        {/* Code Block */}
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-200 font-mono text-xs">
                          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-blue-400" />
                              <span className="font-bold text-slate-300 text-xs">
                                {currentTemplate.filename}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentTemplate.skeleton);
                                  setCopiedTemplate(true);
                                  setTimeout(() => setCopiedTemplate(false), 2000);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                              >
                                {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedTemplate ? 'Copied' : 'Copy Skeleton'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setCodeSnippet(currentTemplate.skeleton);
                                  setModalTab('submit');
                                }}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <Rocket className="w-3 h-3" />
                                <span>Use in Submit Tab &rarr;</span>
                              </button>
                            </div>
                          </div>

                          <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono">
                            {currentTemplate.skeleton}
                          </pre>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: SUBMIT SOLUTION & AI REVIEW */}
              {modalTab === 'submit' && (
                <div className="space-y-4">
                  {(() => {
                    const isApproved = Boolean(
                      selectedTicket.aiReviewFeedback &&
                      (selectedTicket.aiReviewFeedback.includes('APPROVED FOR MERGE') || selectedTicket.aiReviewFeedback.includes('✅ APPROVED')) &&
                      !selectedTicket.aiReviewFeedback.includes('CHANGES REQUESTED')
                    );

                    return (
                      <>
                        {/* Status Banner */}
                        {selectedTicket.status === 'DONE' && (
                          <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              ✓
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                Ticket Merged & Completed!
                              </h4>
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                                Submission passed the simulation review. Sprint progress updated. Run tests in your repository to verify the implementation.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* AI Tech Lead Review Card (Visible when review feedback is present) */}
                        {selectedTicket.aiReviewFeedback && (
                          <div className={`p-4 rounded-xl border space-y-3 ${
                            isApproved
                              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                          }`}>
                            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm ${
                                  isApproved ? 'bg-emerald-600' : 'bg-amber-600'
                                }`}>
                                  AM
                                </div>
                                <div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                    Alex Mitchell
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Staff Software Engineer & Tech Lead @ QuickKart
                                  </span>
                                </div>
                              </div>

                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {isApproved ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved for Merge
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5" /> Changes Requested
                                  </>
                                )}
                              </span>
                            </div>

                            <div className={`text-xs leading-relaxed whitespace-pre-line p-3.5 rounded-lg border ${
                              isApproved
                                ? 'text-emerald-950 dark:text-emerald-100 bg-white/90 dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40'
                                : 'text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 border-amber-200 dark:border-amber-900/40'
                            }`}>
                              {selectedTicket.aiReviewFeedback}
                            </div>

                            {!isApproved && selectedTicket.status !== 'DONE' && (
                              <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2 font-medium">
                                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Alex requested changes. Please review the checklist above, update your implementation code below, and click <strong>Revise & Resubmit</strong>.</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Submission Form (When ticket is not yet marked DONE) */}
                        {selectedTicket.status !== 'DONE' && (
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Rocket className="w-4 h-4 text-blue-500" />
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {selectedTicket.aiReviewFeedback && !isApproved
                                    ? 'Revise Your Implementation'
                                    : 'Submit Your Solution for Tech Lead PR Review'}
                                </span>
                              </div>

                              {/* Submission Mode Toggle */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setSubmissionMode('code')}
                                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                    submissionMode === 'code'
                                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  💻 In-Browser Code
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSubmissionMode('github')}
                                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                    submissionMode === 'github'
                                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  🔗 GitHub PR Link
                                </button>
                              </div>
                            </div>

                            {submissionMode === 'code' ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    Your Java / Spring Boot Implementation
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setCodeSnippet(getStarterTemplate(selectedTicket).skeleton)}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Auto-Fill Starter Code</span>
                                  </button>
                                </div>

                                <textarea
                                  rows={8}
                                  value={codeSnippet}
                                  onChange={(e) => setCodeSnippet(e.target.value)}
                                  placeholder="// Write or paste your implementation code here..."
                                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
                                />
                              </div>
                            ) : githubRepoReady ? (
                              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-4 text-sm space-y-2">
                                <p>Push your ticket branch and open a pull request on GitHub. DevSim finds it automatically.</p>
                                <code className="block text-xs">git checkout -b feature/{selectedTicket.ticketKey.toLowerCase()}</code>
                                <p className="text-xs text-slate-500">Submit below syncs your repository and reviews the linked PR. No URL copy-paste is needed.</p>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  GitHub Pull Request / Commit URL
                                </label>
                                <input
                                  type="url"
                                  value={githubPrUrl}
                                  onChange={(e) => setGithubPrUrl(e.target.value)}
                                  placeholder="https://github.com/your-username/quickkart-backend/pull/1"
                                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            {/* Developer Notes / Description */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                PR Description / Solution Summary
                              </label>
                              <textarea
                                rows={2}
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                                placeholder="e.g. Implemented Jakarta Bean Validation with @RestControllerAdvice and custom Exception handler."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <span className="text-[11px] text-slate-400">
                                {selectedTicket.aiReviewFeedback && !isApproved
                                  ? 'Alex will re-evaluate your revised code against Acceptance Criteria'
                                  : 'Instant AI code review will be evaluated by Alex Mitchell'}
                              </span>

                              <Button
                                size="sm"
                                variant="primary"
                                disabled={isUpdatingStatus}
                                onClick={submitCurrentSolution}
                                className={`flex items-center gap-1.5 ${
                                  selectedTicket.aiReviewFeedback && !isApproved
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                    : ''
                                }`}
                              >
                                {isUpdatingStatus ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Alex is Reviewing Your Code...</span>
                                  </>
                                ) : selectedTicket.aiReviewFeedback && !isApproved ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Revise & Resubmit for Review</span>
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="w-3.5 h-3.5" />
                                    <span>Submit for AI Tech Lead Review</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer (Sticky at bottom so actions are always directly visible) */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Status:</span>
                <span
                  className={`font-bold font-mono uppercase px-2 py-0.5 rounded text-[11px] ${
                    selectedTicket.status === 'DONE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : selectedTicket.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. If ticket is TODO: "Start Ticket" */}
                {selectedTicket.status === 'TODO' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      handleStatusChange(selectedTicket, 'IN_PROGRESS');
                      setModalTab('submit');
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Ticket</span>
                  </Button>
                )}

                {/* 2. If ticket is IN_PROGRESS: */}
                {selectedTicket.status === 'IN_PROGRESS' && (
                  <>
                    {modalTab !== 'submit' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setModalTab('submit')}
                        className="flex items-center gap-1.5"
                      >
                        <span>Go to Submit & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isUpdatingStatus}
                        onClick={submitCurrentSolution}
                        className={`flex items-center gap-1.5 ${
                          selectedTicket.aiReviewFeedback && !selectedTicket.aiReviewFeedback.includes('APPROVED')
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : ''
                        }`}
                      >
                        {isUpdatingStatus ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Reviewing...</span>
                          </>
                        ) : selectedTicket.aiReviewFeedback && !selectedTicket.aiReviewFeedback.includes('APPROVED') ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Revise & Resubmit</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-3.5 h-3.5" />
                            <span>Submit Solution for Review</span>
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}

                {/* 3. If ticket is DONE: "Reopen Ticket" */}
                {selectedTicket.status === 'DONE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      handleStatusChange(selectedTicket, 'IN_PROGRESS');
                      setModalTab('submit');
                    }}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reopen Ticket (Practice Again)</span>
                  </Button>
                )}

                {/* Ask Alex About Ticket */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setChatTicketId(selectedTicket.id);
                    setIsChatOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs border-slate-300 dark:border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ask Alex About Ticket</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 4. AI TECH LEAD CHAT DRAWER */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs">
                AM
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Alex Mitchell</h3>
                <p className="text-[11px] text-slate-500">Staff Engineer & Tech Lead</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Context Selector */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Context:</span>
            <select
              value={chatTicketId || 'GENERAL'}
              onChange={(e) => setChatTicketId(e.target.value === 'GENERAL' ? null : e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[260px] truncate"
            >
              <option value="GENERAL">General Engineering / Java / Spring</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ticketKey}: {t.title.slice(0, 28)}...
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendChatMessage('What is Java?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              What is Java?
            </button>
            <button
              onClick={() => handleSendChatMessage('What is Spring Boot and why do we use it?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              What is Spring Boot?
            </button>
            <button
              onClick={() => handleSendChatMessage('Explain 4 pillars of OOP in Java with examples')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              OOP Pillars?
            </button>
            <button
              onClick={() => handleSendChatMessage('How should I structure the controller and service layer?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              Architecture?
            </button>
            <button
              onClick={() => handleSendChatMessage('How should I write unit tests for the service with Mockito?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              Unit tests?
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] text-slate-400 mb-1 px-1">{msg.name}</span>
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[88%] whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                <span>Alex is typing review guidance...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChatMessage();
              }}
              placeholder="Ask Alex a technical or ticket question..."
              className="flex-1 text-xs px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={isSendingMessage || !inputMessage.trim()}
              onClick={() => handleSendChatMessage()}
              className="px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
