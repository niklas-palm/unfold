import type { DrilldownDef } from 'unfold-ai'

// --- API Request Lifecycle (sequence) ---

const apiRequestLifecycle: DrilldownDef = {
  type: 'sequence',
  id: 'api-request-lifecycle',
  title: 'API Request Lifecycle',
  subtitle: 'What happens when kubectl sends a request to the API server',
  actors: [
    { id: 'client', label: 'kubectl', color: 'slate' },
    { id: 'authn', label: 'Authentication', color: 'sea' },
    { id: 'authz', label: 'Authorization', sub: 'RBAC', color: 'sea' },
    { id: 'admission', label: 'Admission', color: 'sage' },
    { id: 'etcd', label: 'etcd', color: 'warm' },
  ],
  phases: [
    {
      name: 'Authentication',
      messages: [
        { from: 'client', to: 'authn', label: 'TLS + Bearer token' },
        { actor: 'authn', text: 'Verify certificate or token\nIdentify user (CN or JWT sub)' },
      ],
    },
    {
      name: 'Authorization',
      messages: [
        { from: 'authn', to: 'authz', label: 'Authenticated identity' },
        { actor: 'authz', text: 'Check RBAC rules:\nRole + RoleBinding → permit/deny' },
      ],
    },
    {
      name: 'Admission Control',
      messages: [
        { from: 'authz', to: 'admission', label: 'Authorized request' },
        { actor: 'admission', text: 'Mutating webhooks → modify object\nValidating webhooks → accept/reject' },
      ],
    },
    {
      name: 'Persistence',
      messages: [
        { from: 'admission', to: 'etcd', label: 'Validated object' },
        { actor: 'etcd', text: 'Raft consensus → write to quorum\nReturn confirmation' },
        { from: 'etcd', to: 'client', label: 'Success response', dashed: true },
      ],
    },
  ],
}

// --- etcd Details (content) ---

const etcdDetails: DrilldownDef = {
  type: 'content',
  id: 'etcd-details',
  title: 'etcd — The Cluster Database',
  subtitle: 'Raft consensus, quorum, and the single source of truth',
  sections: [
    {
      columns: [
        {
          heading: 'Raft Consensus',
          badge: { text: 'Protocol', color: 'warm' },
          body: 'etcd uses Raft to replicate data. A leader accepts writes and replicates to followers. Writes succeed only when a quorum (majority) acknowledges.',
          items: [
            { label: '3-node cluster', detail: 'Tolerates 1 failure (quorum = 2)' },
            { label: '5-node cluster', detail: 'Tolerates 2 failures (quorum = 3)' },
            { label: 'Even numbers', detail: 'No benefit — 4 nodes still only tolerate 1 failure' },
          ],
        },
        {
          heading: 'Operations',
          badge: { text: 'Critical', color: 'sea' },
          body: 'etcd is the single source of truth. Data loss means cluster state is gone.',
          items: [
            { label: 'Storage', detail: 'B+ tree (bbolt), max 8 GB recommended' },
            { label: 'Data format', detail: 'Protocol Buffers (binary)' },
            { label: 'Ports', detail: '2379 (client), 2380 (peer)' },
            { label: 'Backups', detail: 'etcdctl snapshot save — schedule regularly' },
          ],
        },
      ],
    },
    {
      heading: 'Why Only the API Server Talks to etcd',
      body: 'By funneling all access through the API server, Kubernetes centralizes authentication, authorization, validation, and admission control. No other component can bypass these checks. This is the key architectural decision that makes the API server the single point of control.',
    },
  ],
}

// --- Scheduling Process (content) ---

const schedulingProcess: DrilldownDef = {
  type: 'content',
  id: 'scheduling-process',
  title: 'The Scheduling Process',
  subtitle: 'How the scheduler decides where each pod runs',
  sections: [
    {
      columns: [
        {
          heading: 'Filtering',
          badge: { text: 'Step 1', color: 'sage' },
          body: 'Eliminate nodes that cannot run the pod.',
          items: [
            { label: 'Resources', detail: 'Does the node have enough CPU and memory?' },
            { label: 'Node selector', detail: 'Does the pod require specific node labels?' },
            { label: 'Taints', detail: 'Does the pod tolerate the node\'s taints?' },
            { label: 'Affinity', detail: 'Do pod affinity/anti-affinity rules allow this?' },
            { label: 'Volume topology', detail: 'Is a required PersistentVolume accessible?' },
          ],
        },
        {
          heading: 'Scoring',
          badge: { text: 'Step 2', color: 'sage' },
          body: 'Rank the feasible nodes by preference.',
          items: [
            { label: 'Spread', detail: 'Prefer spreading pods across nodes and zones' },
            { label: 'Image locality', detail: 'Prefer nodes with images already cached' },
            { label: 'Resource balance', detail: 'Prefer nodes that balance utilization' },
            { label: 'Topology', detail: 'Respect topology spread constraints' },
          ],
        },
      ],
    },
    {
      heading: 'Binding',
      body: 'The scheduler assigns the pod to the highest-scoring node by writing a Binding object to the API server. The kubelet on that node then picks it up and starts the containers.',
    },
    {
      note: {
        title: 'Pluggable',
        body: 'The scheduler is extensible via scheduling profiles and plugins. Custom schedulers can replace or extend the default filtering and scoring behavior.',
      },
    },
  ],
}

// --- Service Types (content) ---

const serviceTypes: DrilldownDef = {
  type: 'content',
  id: 'service-types',
  title: 'Kubernetes Service Types',
  subtitle: 'Four ways to expose applications',
  sections: [
    {
      columns: [
        {
          heading: 'ClusterIP',
          badge: { text: 'Internal', color: 'sky' },
          body: 'Default type. Assigns a virtual IP reachable only within the cluster. Used for internal service-to-service communication.',
          items: [
            { label: 'Scope', detail: 'Cluster-internal only' },
            { label: 'Use case', detail: 'Backend services, databases, caches' },
          ],
        },
        {
          heading: 'NodePort',
          badge: { text: 'External', color: 'sky' },
          body: 'Exposes the service on a static port (30000-32767) on every node\'s IP address. Builds on ClusterIP.',
          items: [
            { label: 'Scope', detail: 'External via node IP + port' },
            { label: 'Use case', detail: 'Development, non-cloud environments' },
          ],
        },
      ],
    },
    {
      columns: [
        {
          heading: 'LoadBalancer',
          badge: { text: 'Cloud', color: 'sky' },
          body: 'Provisions a cloud load balancer (AWS ELB, GCP LB, Azure LB) that forwards to the service. Builds on NodePort which builds on ClusterIP.',
          items: [
            { label: 'Scope', detail: 'External via cloud load balancer' },
            { label: 'Use case', detail: 'Production public-facing services' },
          ],
        },
        {
          heading: 'ExternalName',
          badge: { text: 'DNS Alias', color: 'stone' },
          body: 'Returns a CNAME record pointing to an external DNS name. No proxying, no ClusterIP — pure DNS redirection.',
          items: [
            { label: 'Scope', detail: 'DNS-level alias' },
            { label: 'Use case', detail: 'Referencing external databases or APIs' },
          ],
        },
      ],
    },
    {
      heading: 'Type Hierarchy',
      body: 'LoadBalancer includes NodePort which includes ClusterIP. A LoadBalancer Service gets all three: a ClusterIP (internal), a NodePort (on every node), and an external load balancer.',
    },
  ],
}

// --- Pod Internals (content) ---

const podInternals: DrilldownDef = {
  type: 'content',
  id: 'pod-internals',
  title: 'Pod Internals',
  subtitle: 'Lifecycle phases, multi-container patterns, and networking',
  sections: [
    {
      heading: 'Lifecycle Phases',
      items: [
        { label: 'Pending', detail: 'Accepted but not yet running — waiting for scheduling, image pull, or volume mount' },
        { label: 'Running', detail: 'At least one container is running or starting/restarting' },
        { label: 'Succeeded', detail: 'All containers exited with code 0 (Jobs)' },
        { label: 'Failed', detail: 'At least one container exited with non-zero code' },
        { label: 'Unknown', detail: 'Node unreachable — kubelet stopped reporting' },
      ],
    },
    {
      columns: [
        {
          heading: 'Sidecar Pattern',
          badge: { text: 'Common', color: 'blush' },
          body: 'A helper container that extends the main container. Runs alongside it for the pod\'s entire lifetime.',
          items: [
            { label: 'Examples', detail: 'Envoy proxy, log collector, config reloader' },
          ],
        },
        {
          heading: 'Init Container',
          badge: { text: 'Setup', color: 'sage' },
          body: 'Runs to completion before main containers start. Multiple init containers run sequentially.',
          items: [
            { label: 'Examples', detail: 'Database migration, config download, dependency wait' },
          ],
        },
      ],
    },
    {
      heading: 'Networking',
      body: 'Every pod gets its own unique cluster IP. Containers within a pod share this IP and communicate via localhost. Pods can reach any other pod by IP without NAT — a fundamental Kubernetes networking rule enforced by the CNI plugin.',
    },
  ],
}

// --- Deployment Manifest (code) ---

const deploymentManifest: DrilldownDef = {
  type: 'code',
  id: 'deployment-manifest',
  title: 'Deployment Manifest',
  subtitle: 'A complete YAML declaration for a stateless application',
  language: 'yaml',
  code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: web-app:1.4.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5`,
  callouts: [
    {
      title: 'Declarative, not imperative',
      body: 'This manifest says "I want 3 replicas of web-app:1.4.0 with these resources and probes." Kubernetes continuously reconciles to make this true.',
    },
    {
      title: 'Rolling update strategy',
      body: 'maxUnavailable:1 means at most 1 pod is down during updates. maxSurge:1 means at most 1 extra pod exists during rollout. Updates are zero-downtime.',
    },
    {
      title: 'Resource requests and limits',
      body: 'Requests (250m CPU, 256Mi memory) are the guaranteed minimum — the scheduler uses these to find a node. Limits (500m, 512Mi) are the ceiling — CPU is throttled, memory over-limit triggers OOM kill.',
    },
  ],
}

export const drilldowns: DrilldownDef[] = [
  apiRequestLifecycle,
  etcdDetails,
  schedulingProcess,
  serviceTypes,
  podInternals,
  deploymentManifest,
]
