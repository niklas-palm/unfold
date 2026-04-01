import type { DiagramSlide, SlideDef } from 'unfoldjs'
import { carry } from 'unfoldjs'

// ============================================================
// Layout Strategy
//
// Pre-compact (slides 1-3): large nodes, single row
//   [kubectl] --> [API Server] --> [etcd]
//   Below: [Scheduler] [Controller Mgr]   in Control Plane region
//
// Post-compact (slides 4+): h:48 nodes, multi-row
//   Row 1 (y:70):   [kubectl] outside cluster
//   Row 1 (y:70):   [API Server] .............. [etcd]         Control Plane
//   Row 2 (y:155):  ......... [Scheduler] [Controller Mgr]     Control Plane
//   Row 3 (y:295):  [kubelet] [kube-proxy] [Runtime]           Worker Node
//   Row 4 (y:410):  [Svc] [Pod A] [Pod B] [Pod C]             Worker Node
//
// Scheduler/Ctrl Mgr are shifted right (x:300+) to leave a clear
// vertical corridor from API Server (x:150) down to kubelet (x:100)
// for the "pod specs" arrow.
//
// After the single compact transition, nodes stay fixed.
// Only new nodes appear, arrows/annotations change per slide.
// ============================================================

// --- Slide 0: Title ---
const slide0: SlideDef = {
  type: 'title',
  title: 'How Kubernetes Works',
  subtitle: 'From kubectl to running pods —<br />the declarative orchestration model',
  hint: 'Use arrow keys to navigate',
  notes: 'Kubernetes automates deployment, scaling, and management of containerized apps. This presentation walks through the architecture from the outside in.',
}

// --- Slide 1: Declarative model — kubectl to API Server ---
const slide1: DiagramSlide = {
  type: 'diagram',
  heading: 'Everything starts with a declaration',
  subheading: 'You tell Kubernetes what you want, not how to do it',
  nodes: [
    { id: 'kubectl', label: 'kubectl', x: 80, y: 210, w: 150, h: 70, color: 'slate' },
    { id: 'api', label: 'API Server', sub: 'kube-apiserver', x: 370, y: 210, w: 200, h: 70, color: 'sea' },
  ],
  arrows: [
    { from: 'kubectl', to: 'api', label: 'desired state' },
  ],
  annotations: [
    {
      type: 'text-block', x: 610, y: 200, w: 270,
      text: '**Declarative, not imperative.** You describe the desired state (e.g., "3 replicas of nginx"), and Kubernetes continuously works to make it real.',
    },
  ],
  notes: 'The declarative model is the core idea. You never say "start 3 containers" — you say "I want 3 replicas." Kubernetes closes the gap between desired and actual state.',
}

// --- Slide 2: State persistence — add etcd ---
const slide2 = carry(slide1, {
  heading: 'State is stored in etcd',
  subheading: 'A distributed key-value store holds every object',
  nodes: [
    { id: 'etcd', label: 'etcd', sub: 'cluster state', x: 680, y: 210, w: 130, h: 65, color: 'warm' },
  ],
  arrows: [
    { from: 'kubectl', to: 'api', label: 'desired state' },
    { from: 'api', to: 'etcd', label: 'persist' },
  ],
  annotations: [
    {
      type: 'text-block', x: 610, y: 310, w: 270,
      text: 'The API Server is the **only** component that talks to etcd. All state — pods, services, secrets — is stored as protocol buffers.',
      onClick: 'etcd-details',
    },
  ],
  notes: 'etcd is a distributed key-value store using Raft consensus. It holds the entire cluster state. The API Server is the sole gateway — no other component accesses etcd directly.',
})

// --- Slide 3: Control plane — add Scheduler + Controller Manager ---
const slide3 = carry(slide2, {
  heading: 'The control plane makes decisions',
  subheading: 'Scheduler places pods, controllers enforce desired state',
  nodes: [
    { id: 'scheduler', label: 'Scheduler', x: 370, y: 360, w: 150, h: 60, color: 'sage' },
    { id: 'ctrl-mgr', label: 'Controller Mgr', x: 570, y: 360, w: 160, h: 60, color: 'sage' },
  ],
  arrows: [
    { from: 'kubectl', to: 'api', label: 'desired state' },
    { from: 'api', to: 'etcd', label: 'persist' },
    { from: 'api', to: 'scheduler', label: 'watch' },
    { from: 'api', to: 'ctrl-mgr', label: 'watch' },
  ],
  regions: [
    { id: 'control-plane', label: 'Control Plane', contains: ['api', 'etcd', 'scheduler', 'ctrl-mgr'], padding: 28 },
  ],
  annotations: [
    {
      type: 'text-block', x: 100, y: 460, w: 420,
      text: 'Controllers follow **watch → compare → act**: watch for changes, compare desired vs actual state, take the minimum action to converge.',
    },
  ],
  notes: 'The scheduler watches for unscheduled pods and assigns them to nodes. The controller manager runs reconciliation loops for Deployments, ReplicaSets, DaemonSets, Jobs, and more.',
})

// --- Slide 4: COMPACT TRANSITION + Worker nodes ---
// Scheduler/Ctrl Mgr shifted right so api→kubelet arrow has a clear path.
const slide4 = carry(slide3, {
  heading: 'Worker nodes run the workloads',
  subheading: 'kubelet, kube-proxy, and the container runtime',
  nodes: [
    // Compact all existing nodes
    { id: 'kubectl', label: 'kubectl', sub: '', x: 5, y: 70, w: 90, h: 48, color: 'slate' },
    { id: 'api', label: 'API Server', sub: '', x: 185, y: 70, w: 140, h: 48, color: 'sea' },
    { id: 'etcd', label: 'etcd', sub: '', x: 400, y: 70, w: 100, h: 48, color: 'warm' },
    { id: 'scheduler', label: 'Scheduler', sub: '', x: 300, y: 155, w: 120, h: 48, color: 'sage' },
    { id: 'ctrl-mgr', label: 'Controller Mgr', sub: '', x: 460, y: 155, w: 130, h: 48, color: 'sage' },
    // New: Worker node components
    { id: 'kubelet', label: 'kubelet', x: 100, y: 295, w: 110, h: 48, color: 'mist' },
    { id: 'kube-proxy', label: 'kube-proxy', x: 250, y: 295, w: 115, h: 48, color: 'stone' },
    { id: 'runtime', label: 'Container Runtime', x: 400, y: 295, w: 130, h: 48, color: 'clay' },
  ],
  arrows: [
    { from: 'api', to: 'kubelet', label: 'pod specs' },
  ],
  regions: [
    { id: 'control-plane', label: 'Control Plane', contains: ['api', 'etcd', 'scheduler', 'ctrl-mgr'], padding: 28 },
    { id: 'worker-node', label: 'Worker Node', contains: ['kubelet', 'kube-proxy', 'runtime'], padding: 28 },
  ],
  annotations: [
    {
      type: 'card-list', x: 600, y: 280, direction: 'column',
      cards: [
        { label: 'kubelet', detail: 'Node agent — watches for assigned pods, manages containers, reports status' },
        { label: 'kube-proxy', detail: 'Maintains iptables/IPVS rules for Service routing' },
        { label: 'Container Runtime', detail: 'containerd or CRI-O — actually starts and stops containers via CRI' },
      ],
    },
  ],
  notes: 'Every worker node runs three components: kubelet (the node agent), kube-proxy (Service networking), and a container runtime (usually containerd). The kubelet receives pod specs from the API server and ensures the containers are running.',
})

// --- Slide 5: Pods ---
const slide5 = carry(slide4, {
  heading: 'Pods are the smallest deployable unit',
  subheading: 'One or more containers sharing network and storage',
  nodes: [
    { id: 'pod-a', label: 'Pod', sub: 'nginx-abc12', x: 160, y: 410, w: 100, h: 48, color: 'blush' },
    { id: 'pod-b', label: 'Pod', sub: 'nginx-def34', x: 300, y: 410, w: 100, h: 48, color: 'blush' },
    { id: 'pod-c', label: 'Pod', sub: 'nginx-ghi56', x: 440, y: 410, w: 100, h: 48, color: 'blush' },
  ],
  arrows: [
    { from: 'api', to: 'kubelet', label: 'pod specs' },
    { from: 'kubelet', to: 'pod-a', label: 'runs' },
    { from: 'kubelet', to: 'pod-b' },
    { from: 'kubelet', to: 'pod-c' },
  ],
  regions: [
    { id: 'control-plane', label: 'Control Plane', contains: ['api', 'etcd', 'scheduler', 'ctrl-mgr'], padding: 28 },
    { id: 'worker-node', label: 'Worker Node', contains: ['kubelet', 'kube-proxy', 'runtime', 'pod-a', 'pod-b', 'pod-c'], padding: 28 },
  ],
  annotations: [
    {
      type: 'card-list', x: 600, y: 310, direction: 'column',
      cards: [
        { label: 'Shared network', detail: 'All containers in a pod share one IP address' },
        { label: 'Shared storage', detail: 'Volumes can be mounted by any container in the pod' },
        { label: 'Co-scheduled', detail: 'Always on the same node, started and stopped together' },
      ],
    },
  ],
  notes: 'Pods are the atomic unit. You almost never create pods directly — controllers do it for you. Each pod gets a unique IP, and containers within a pod communicate via localhost.',
})

// --- Slide 6: Inside a Pod (focus expansion) ---
const slide6 = carry(slide5, {
  heading: 'Inside a pod',
  subheading: 'Containers share network namespace and storage volumes',
  focus: {
    nodeId: 'pod-b',
    x: 200, y: 80,
    w: 420, h: 340,
    items: [
      { label: 'App Container', sub: 'Main application process (e.g., nginx, Node.js)', color: 'blush' },
      { label: 'Sidecar Container', sub: 'Envoy proxy, log shipper, or config reloader', color: 'stone' },
      { label: 'Init Container', sub: 'Runs to completion before main containers start', color: 'sage' },
    ],
    footnote: 'All containers share one IP — communicate via localhost',
    footnoteOnClick: 'pod-internals',
  },
  arrows: [],
  annotations: [],
  notes: 'Pods can hold multiple containers. The sidecar pattern is common — a helper container runs alongside the main app. Init containers handle setup tasks like migrations or config downloads before the main containers start.',
})

// --- Slide 7: Controllers manage pods ---
const slide7 = carry(slide6, {
  heading: 'Controllers manage pod lifecycles',
  subheading: 'Deployment → ReplicaSet → Pod — a hierarchy of reconciliation',
  arrows: [
    { from: 'ctrl-mgr', to: 'pod-a', label: 'reconciles', labelOffset: { dx: 40, dy: -25 } },
    { from: 'api', to: 'kubelet' },
  ],
  regions: [
    { id: 'control-plane', label: 'Control Plane', contains: ['api', 'etcd', 'scheduler', 'ctrl-mgr'], padding: 28 },
    { id: 'worker-node', label: 'Worker Node', contains: ['kubelet', 'kube-proxy', 'runtime', 'pod-a', 'pod-b', 'pod-c'], padding: 28 },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 600, y: 140, color: 'sage',
      items: [
        { title: 'Deployment', detail: 'Declares image, replicas, update strategy' },
        { title: 'ReplicaSet', detail: 'Ensures N identical pods exist' },
        { title: 'Pod', detail: 'Actual running instance on a worker node' },
      ],
    },
    {
      type: 'text-block', x: 600, y: 340, w: 280,
      text: 'Controllers follow **watch → compare → act**. They watch the API server, compare desired vs actual state, and take corrective action.',
      onClick: 'scheduling-process',
    },
  ],
  notes: 'You rarely create pods directly. A Deployment creates a ReplicaSet, which creates Pods. The controller manager continuously reconciles — if a pod dies, the ReplicaSet creates a replacement.',
})

// --- Slide 8: Services route traffic ---
// Service placed on the same row as pods (far left) to avoid
// arrows crossing through intermediate pods.
const slide8 = carry(slide7, {
  heading: 'Services provide stable endpoints',
  subheading: 'A fixed IP that routes to healthy pods — even as they come and go',
  nodes: [
    { id: 'service', label: 'Service', sub: 'ClusterIP', x: 35, y: 410, w: 100, h: 48, color: 'sky' },
  ],
  arrows: [
    { from: 'kube-proxy', to: 'service', label: 'routing rules' },
    { from: 'service', to: 'pod-a' },
  ],
  regions: [
    { id: 'control-plane', label: 'Control Plane', contains: ['api', 'etcd', 'scheduler', 'ctrl-mgr'], padding: 28 },
    { id: 'worker-node', label: 'Worker Node', contains: ['kubelet', 'kube-proxy', 'runtime', 'service', 'pod-a', 'pod-b', 'pod-c'], padding: 28 },
  ],
  annotations: [
    {
      type: 'card-list', x: 600, y: 250, direction: 'column',
      cards: [
        { label: 'ClusterIP', detail: 'Internal-only virtual IP (default type)', borderColor: 'sky', onClick: 'service-types' },
        { label: 'NodePort', detail: 'Exposes on every node at port 30000-32767', borderColor: 'sky', onClick: 'service-types' },
        { label: 'LoadBalancer', detail: 'Provisions a cloud load balancer', borderColor: 'sky', onClick: 'service-types' },
      ],
    },
    {
      type: 'text-block', x: 600, y: 440, w: 280,
      text: '**Label selectors** match pods to services. The Service IP never changes — traffic is load-balanced across all matching pods.',
    },
  ],
  notes: 'Services use label selectors to find backend pods. kube-proxy programs iptables or IPVS rules so that traffic to the Service ClusterIP is load-balanced across healthy pods. Three external types: NodePort, LoadBalancer, ExternalName.',
})

// --- Slide 9: Reconciliation loop ---
const slide9 = carry(slide8, {
  heading: 'The reconciliation loop',
  subheading: 'Desired state vs actual state — the core mechanism',
  arrows: [
    { from: 'kubectl', to: 'api', label: 'desired state' },
    { from: 'api', to: 'etcd', label: 'persist' },
    { from: 'ctrl-mgr', to: 'api', label: 'watch', dashed: true },
    { from: 'ctrl-mgr', to: 'pod-a' },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 600, y: 120, color: 'sea',
      items: [
        { title: 'Watch', detail: 'Controller subscribes to API server events' },
        { title: 'Compare', detail: 'Desired state (spec) vs actual state (status)' },
        { title: 'Act', detail: 'Create, update, or delete resources to converge' },
        { title: 'Repeat', detail: 'Every change or every 10s resync' },
      ],
    },
    {
      type: 'text-block', x: 600, y: 380, w: 280,
      text: 'This is why Kubernetes is **self-healing**: the loop runs continuously. If a pod crashes, the controller detects the discrepancy and creates a replacement.',
    },
  ],
  notes: 'The reconciliation loop is the fundamental mechanism. Every controller watches its resources, compares desired vs actual state, and takes corrective action. This powers self-healing, scaling, and rolling updates.',
})

// --- Slide 10: Self-healing ---
const slide10 = carry(slide9, {
  heading: 'Self-healing through probes',
  subheading: 'Liveness, readiness, and startup probes detect and respond to failures',
  arrows: [
    { from: 'kubelet', to: 'pod-a', label: 'probes' },
    { from: 'kubelet', to: 'pod-b' },
    { from: 'kubelet', to: 'pod-c' },
  ],
  annotations: [
    {
      type: 'card-list', x: 600, y: 140, direction: 'column',
      cards: [
        { label: 'Liveness probe', detail: 'Is the container alive? Failure → restart the container' },
        { label: 'Readiness probe', detail: 'Can it serve traffic? Failure → remove from Service endpoints' },
        { label: 'Startup probe', detail: 'Has it finished starting? Blocks other probes until success' },
      ],
    },
    {
      type: 'text-block', x: 600, y: 380, w: 280,
      text: 'Container crashes trigger **exponential backoff** restarts: 10s, 20s, 40s... up to 5 minutes. Unreachable nodes trigger pod rescheduling after 5 minutes.',
    },
  ],
  notes: 'kubelet executes probes (HTTP, TCP, exec, gRPC) and takes action on failure. Liveness failures restart containers. Readiness failures remove pods from Service endpoints. Startup probes gate the other probes for slow-starting apps.',
})

// --- Slide 11: Scaling ---
// HPA explained via annotations rather than a node — avoids arrow
// routing complexity and keeps the diagram clean.
const slide11 = carry(slide10, {
  heading: 'Horizontal scaling',
  subheading: 'The HPA adjusts replica count based on observed metrics',
  arrows: [
    { from: 'ctrl-mgr', to: 'pod-a' },
    { from: 'ctrl-mgr', to: 'pod-b' },
    { from: 'ctrl-mgr', to: 'pod-c' },
  ],
  annotations: [
    {
      type: 'text-block', x: 600, y: 120, w: 280,
      text: 'The **Horizontal Pod Autoscaler** watches metrics and adjusts Deployment replica counts through the API server.',
    },
    {
      type: 'numbered-list', x: 600, y: 220, color: 'sky',
      items: [
        { title: 'Metrics Server scrapes', detail: 'CPU and memory from kubelets every 15s' },
        { title: 'HPA computes', detail: 'Current utilization vs target percentage' },
        { title: 'Deployment scales', detail: 'Replica count adjusted up or down' },
        { title: 'Scheduler places', detail: 'New pods on nodes with capacity' },
      ],
    },
  ],
  notes: 'HPA supports CPU, memory, custom metrics, and external metrics (e.g., SQS queue depth). VPA adjusts resource requests/limits instead of replica count. Cluster Autoscaler adds or removes nodes when pods cannot be scheduled.',
})

// --- Slide 12: Complete picture ---
const slide12 = carry(slide11, {
  heading: 'The complete picture',
  subheading: 'All components working together',
  nodes: [
    { id: 'api', label: 'API Server', sub: '', x: 185, y: 70, w: 140, h: 48, color: 'sea', onClick: 'api-request-lifecycle' },
  ],
  arrows: [
    { from: 'kubectl', to: 'api' },
    { from: 'api', to: 'etcd' },
    { from: 'api', to: 'scheduler', dashed: true },
    { from: 'api', to: 'ctrl-mgr', dashed: true },
    { from: 'api', to: 'kubelet' },
    { from: 'kubelet', to: 'pod-a' },
    { from: 'kubelet', to: 'pod-b' },
    { from: 'kubelet', to: 'pod-c' },
    { from: 'kube-proxy', to: 'service' },
    { from: 'service', to: 'pod-a' },
  ],
  annotations: [
    {
      type: 'text-block', x: 600, y: 100, w: 280,
      text: 'Explore the **API request lifecycle**',
      onClick: 'api-request-lifecycle',
    },
    {
      type: 'text-block', x: 600, y: 160, w: 280,
      text: 'View **service types**',
      onClick: 'service-types',
    },
    {
      type: 'text-block', x: 600, y: 220, w: 280,
      text: 'See the **scheduling process**',
      onClick: 'scheduling-process',
    },
    {
      type: 'text-block', x: 600, y: 280, w: 280,
      text: 'Read a **deployment manifest**',
      onClick: 'deployment-manifest',
    },
  ],
  notes: 'The full architecture. Click any drilldown link to explore deeper. The API Server is the hub — every component communicates through it.',
})

// --- Slide 13: Key Takeaways ---
const slide13: SlideDef = {
  type: 'list',
  eyebrow: 'Summary',
  heading: 'Key Takeaways',
  itemBorderColor: 'sea',
  items: [
    { title: 'Declarative model', desc: 'You describe what you want — Kubernetes continuously reconciles to make it real' },
    { title: 'Control plane + worker nodes', desc: 'Brain and muscle separated by a clean API boundary through the API server' },
    { title: 'Pods are the unit of deployment', desc: 'One or more containers sharing a network namespace and storage volumes' },
    { title: 'Controllers are reconciliation loops', desc: 'Watch-compare-act running continuously — the mechanism behind self-healing and scaling' },
    { title: 'Services decouple networking', desc: 'Stable endpoints that survive pod churn, backed by label selectors' },
    { title: 'Self-healing and auto-scaling', desc: 'Probes detect failures automatically; the HPA adjusts replicas to match demand' },
  ],
  notes: 'Six core concepts that capture how Kubernetes works under the hood.',
}

export const slides: SlideDef[] = [
  slide0, slide1, slide2, slide3, slide4, slide5, slide6,
  slide7, slide8, slide9, slide10, slide11, slide12, slide13,
]
