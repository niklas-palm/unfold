# How Kubernetes Works — Technical Reference

> Kubernetes is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications. Originally designed by Google and based on 15 years of experience running production workloads with an internal system called Borg, Kubernetes was donated to the Cloud Native Computing Foundation (CNCF) in 2015. It operates as a distributed system with a declarative API — operators describe the desired state of their applications, and Kubernetes continuously works to make the actual state match. The architecture separates the cluster into a control plane (the brain) and worker nodes (the muscle), communicating over a well-defined API boundary.

**Version:** 1.0
**Date:** 2026-03-31

---

## Table of Contents

1. [Why Kubernetes Exists](#1-why-kubernetes-exists)
2. [Architecture Overview](#2-architecture-overview)
3. [The Control Plane](#3-the-control-plane)
4. [Worker Nodes](#4-worker-nodes)
5. [Pods](#5-pods)
6. [Workload Controllers](#6-workload-controllers)
7. [Services and Service Discovery](#7-services-and-service-discovery)
8. [Networking Model](#8-networking-model)
9. [Ingress and Gateway API](#9-ingress-and-gateway-api)
10. [Storage](#10-storage)
11. [Configuration and Secrets](#11-configuration-and-secrets)
12. [Scheduling](#12-scheduling)
13. [Scaling](#13-scaling)
14. [Health Checks and Self-Healing](#14-health-checks-and-self-healing)
15. [Rolling Updates and Deployment Strategies](#15-rolling-updates-and-deployment-strategies)
16. [Namespaces and Resource Management](#16-namespaces-and-resource-management)
17. [RBAC and Security](#17-rbac-and-security)
18. [DNS in Kubernetes](#18-dns-in-kubernetes)
19. [Observability](#19-observability)
20. [Helm and Package Management](#20-helm-and-package-management)
- [Appendix A: Technical Constants](#appendix-a-technical-constants)
- [Appendix B: Key API Resources Reference](#appendix-b-key-api-resources-reference)

---

## 1. Why Kubernetes Exists

Before containers, applications were deployed directly on physical or virtual machines. Each machine ran a single application (or a few), leading to low utilization and slow provisioning. Containers solved the packaging problem — a container image bundles an application with all its dependencies into a portable unit that runs identically anywhere.

But containers created a new problem: **orchestration**. When you have hundreds or thousands of containers across dozens of machines, you need something to decide where each container runs, restart it when it fails, scale it when demand increases, route traffic to it, and manage its storage and configuration.

**What Kubernetes automates:**

| Problem | Without Kubernetes | With Kubernetes |
|---------|-------------------|-----------------|
| **Placement** | Manual selection of which server runs what | Scheduler automatically places containers based on resource requirements and constraints |
| **Scaling** | Manual process, often slow | Automatic horizontal scaling based on CPU, memory, or custom metrics |
| **Failure recovery** | Pager alerts, manual restart | Automatic detection and restart within seconds |
| **Deployments** | Downtime during updates, manual rollbacks | Zero-downtime rolling updates with automatic rollback |
| **Service discovery** | Static configuration files, manual DNS updates | Automatic DNS entries and load balancing for every service |
| **Configuration** | Files baked into images or manually distributed | Centralized ConfigMaps and Secrets injected at runtime |
| **Storage** | Manual volume attachment and management | Dynamic provisioning and attachment of persistent storage |

**Scale of adoption (2026):** Kubernetes runs in production at over 80% of organizations using containers. Every major cloud provider offers a managed Kubernetes service (EKS on AWS, GKE on Google Cloud, AKS on Azure). The CNCF ecosystem includes over 1,000 projects built around Kubernetes.

---

## 2. Architecture Overview

A Kubernetes cluster consists of two types of machines: **control plane nodes** (which manage the cluster) and **worker nodes** (which run application workloads).

### 2.1 High-Level Architecture

```
┌─ Control Plane ──────────────────────────────────┐
│                                                   │
│  API Server ◄──── kubectl / client libraries      │
│    │                                              │
│    ├──► etcd (cluster state database)             │
│    │                                              │
│    ├──► Scheduler (assigns pods to nodes)         │
│    │                                              │
│    ├──► Controller Manager (reconciliation loops) │
│    │                                              │
│    └──► Cloud Controller Manager (cloud API glue) │
│                                                   │
└───────────────────────────────────────────────────┘
        │                    │                  │
        │  kubelet API       │                  │
        ▼                    ▼                  ▼
┌── Node 1 ──────┐  ┌── Node 2 ──────┐  ┌── Node 3 ──────┐
│                 │  │                 │  │                 │
│  kubelet        │  │  kubelet        │  │  kubelet        │
│  kube-proxy     │  │  kube-proxy     │  │  kube-proxy     │
│  container      │  │  container      │  │  container      │
│  runtime (CRI)  │  │  runtime (CRI)  │  │  runtime (CRI)  │
│                 │  │                 │  │                 │
│  ┌─Pod─┐ ┌─Pod─┐│  │  ┌─Pod─┐       │  │  ┌─Pod─┐ ┌─Pod─┐│
│  │ C1  │ │ C2  ││  │  │ C3  │       │  │  │ C4  │ │ C5  ││
│  └─────┘ └─────┘│  │  └─────┘       │  │  └─────┘ └─────┘│
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Declarative Model

Kubernetes uses a **declarative** model, not imperative. You don't say "start 3 containers." You say "I want 3 replicas of this container." Kubernetes continuously compares the desired state (what you declared) against the actual state (what's running) and takes corrective action to close the gap. This reconciliation loop runs constantly — it's the fundamental mechanism behind self-healing, scaling, and rolling updates.

```yaml
# Desired state: "I want 3 replicas of nginx running"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
```

If a node crashes and takes one replica down, the Deployment controller detects the discrepancy (2 running vs 3 desired) and schedules a replacement on a healthy node — without human intervention.

### 2.3 Everything is an API Object

Every concept in Kubernetes — Pods, Services, Deployments, ConfigMaps, Secrets, Namespaces — is an **API object** stored in etcd and managed through the API server. Each object has:

| Field | Purpose |
|-------|---------|
| `apiVersion` | API group and version (e.g., `apps/v1`, `v1`) |
| `kind` | Object type (e.g., `Deployment`, `Service`, `Pod`) |
| `metadata` | Name, namespace, labels, annotations, UID |
| `spec` | Desired state (what you want) |
| `status` | Actual state (what Kubernetes observes) — read-only, updated by controllers |

---

## 3. The Control Plane

The control plane makes global decisions about the cluster. In production, it runs on multiple nodes for high availability (typically 3 or 5 for etcd quorum).

### 3.1 API Server (kube-apiserver)

The API server is the **only** component that talks to etcd directly. Every other component — the scheduler, controllers, kubelet, kubectl — communicates exclusively through the API server via RESTful HTTP.

**Responsibilities:**
- Authenticates and authorizes all requests (TLS, tokens, certificates, RBAC)
- Validates and persists API objects to etcd
- Serves watch streams — clients can watch for changes to objects in real time
- Implements admission control — a pipeline of webhooks and built-in plugins that can mutate or reject objects before they're persisted

**API request lifecycle:**

```
Client (kubectl, SDK)
  │
  ├── Authentication  (who are you? — certificates, tokens, OIDC)
  ├── Authorization   (can you do this? — RBAC, ABAC, webhook)
  ├── Admission       (should we allow/modify this? — mutating → validating webhooks)
  ├── Validation      (is the object schema valid?)
  ├── Persist to etcd
  └── Return response
```

### 3.2 etcd

A distributed key-value store that holds the **entire cluster state** — every object, every configuration, every secret. etcd uses the Raft consensus algorithm to replicate data across multiple nodes. Writes require majority agreement (quorum).

| Property | Value |
|----------|-------|
| Consensus | Raft |
| Storage | B+ tree (bbolt) |
| Quorum | (N/2) + 1 nodes |
| Typical cluster size | 3 or 5 nodes |
| Default port | 2379 (client), 2380 (peer) |
| Max recommended DB size | 8 GB |
| Data format | Protocol Buffers (binary) |

**Why 3 or 5 nodes?** A 3-node cluster tolerates 1 failure (quorum = 2). A 5-node cluster tolerates 2 failures (quorum = 3). Even numbers provide no additional fault tolerance — a 4-node cluster still only tolerates 1 failure (quorum = 3).

**etcd is the single source of truth.** If etcd loses data, the cluster state is gone. Regular backups are critical.

### 3.3 Scheduler (kube-scheduler)

Watches for newly created Pods that have no assigned node, then selects the best node for each Pod.

**Scheduling process:**

```
New Pod (unscheduled)
  │
  ├── Filtering  — Eliminate nodes that can't run the Pod
  │   ├── Does the node have enough CPU/memory?
  │   ├── Does the Pod's nodeSelector match?
  │   ├── Do taints/tolerations allow scheduling?
  │   ├── Is there a matching PersistentVolume on this node?
  │   └── Does pod affinity/anti-affinity permit this?
  │
  ├── Scoring  — Rank remaining feasible nodes
  │   ├── Spread Pods evenly across nodes
  │   ├── Prefer nodes with requested images already cached
  │   ├── Balance resource utilization
  │   └── Respect topology spread constraints
  │
  └── Binding  — Assign Pod to the highest-scoring node
```

The scheduler is pluggable — custom schedulers can replace or extend the default behavior using scheduling profiles and plugins.

### 3.4 Controller Manager (kube-controller-manager)

Runs a collection of **controllers** — each a reconciliation loop that watches a specific resource type and takes action to match desired state.

| Controller | Watches | Actions |
|-----------|---------|---------|
| **Deployment** | Deployment objects | Creates/updates ReplicaSets, manages rollouts |
| **ReplicaSet** | ReplicaSet objects | Creates/deletes Pods to match replica count |
| **StatefulSet** | StatefulSet objects | Ordered Pod creation, stable identities |
| **DaemonSet** | DaemonSet objects | Ensures a Pod runs on every (or selected) node |
| **Job** | Job objects | Runs Pods to completion |
| **CronJob** | CronJob objects | Creates Jobs on a schedule |
| **Node** | Node heartbeats | Detects failed nodes, evicts Pods |
| **Endpoint** | Services + Pods | Maintains endpoint lists for Services |
| **Namespace** | Namespace objects | Cleans up resources when namespace deleted |
| **ServiceAccount** | ServiceAccount objects | Creates default service accounts and tokens |

Every controller follows the same pattern: **watch → compare → act**. Watch the API server for changes to relevant objects, compare desired state against actual state, take the minimum action needed to converge.

### 3.5 Cloud Controller Manager

Integrates Kubernetes with cloud provider APIs. It handles cloud-specific operations that the core controllers can't:

| Responsibility | Example |
|---------------|---------|
| **Node lifecycle** | Detect when a cloud VM is terminated and remove the Node object |
| **Routes** | Configure cloud networking routes for pod-to-pod communication |
| **Load balancers** | Create cloud load balancers when a `type: LoadBalancer` Service is created |
| **Zones** | Add topology labels (region, zone) to Nodes |

In managed Kubernetes (EKS, GKE, AKS), the cloud controller manager is built into the service.

---

## 4. Worker Nodes

Worker nodes run application workloads. Each node runs three essential components.

### 4.1 kubelet

An agent that runs on every node. It ensures the containers described in Pod specs are running and healthy.

**What kubelet does:**
1. Registers the node with the API server
2. Watches for Pods assigned to its node (via the API server)
3. Pulls container images via the container runtime
4. Starts and monitors containers
5. Reports Pod and node status back to the API server
6. Executes liveness, readiness, and startup probes
7. Manages volumes — mounts ConfigMaps, Secrets, PersistentVolumes into containers

kubelet does **not** manage containers that were not created by Kubernetes. It only manages Pods assigned to it by the scheduler.

### 4.2 kube-proxy

Maintains network rules on each node that implement Kubernetes Services. When a Pod sends traffic to a Service's ClusterIP, kube-proxy ensures it reaches one of the Service's backend Pods.

**Modes:**

| Mode | Mechanism | Performance |
|------|-----------|-------------|
| **iptables** (default) | Kernel iptables rules, random backend selection | Good for < 10,000 Services |
| **IPVS** | Kernel IP Virtual Server, hash-based load balancing | Better for large clusters, multiple LB algorithms |
| **nftables** | Modern netfilter replacement for iptables | Newer, improved performance |

In some deployments (especially with eBPF-based CNIs like Cilium), kube-proxy is replaced entirely — the CNI handles service routing at the kernel level.

### 4.3 Container Runtime

The software that actually runs containers. Kubernetes communicates with the runtime through the **Container Runtime Interface (CRI)**, a standard gRPC API.

| Runtime | Description |
|---------|-------------|
| **containerd** | Industry standard, used by Docker, EKS, GKE. Most common in production. |
| **CRI-O** | Lightweight, purpose-built for Kubernetes. Used by OpenShift. |
| **kata-containers** | Runs containers inside lightweight VMs for stronger isolation. |

Docker itself is no longer a supported Kubernetes runtime (removed in v1.24). containerd — which Docker uses internally — is used directly instead.

---

## 5. Pods

A Pod is the **smallest deployable unit** in Kubernetes. It represents one or more containers that share the same network namespace, storage volumes, and lifecycle.

### 5.1 Why Pods, Not Containers?

Containers are isolated processes. But some processes need to share resources tightly — a web server and a log shipper, an application and its sidecar proxy. A Pod wraps these co-located containers and guarantees:

- **Shared network** — All containers in a Pod share the same IP address and port space. They communicate via `localhost`.
- **Shared storage** — Volumes defined in the Pod spec can be mounted by any container in the Pod.
- **Co-scheduling** — All containers in a Pod are scheduled to the same node and start/stop together.

### 5.2 Pod Lifecycle

| Phase | Description |
|-------|-------------|
| **Pending** | Pod accepted by the cluster but not yet running. Waiting for scheduling, image pull, or volume mount. |
| **Running** | At least one container is running or starting/restarting. |
| **Succeeded** | All containers terminated successfully (exit code 0). Applies to Jobs. |
| **Failed** | At least one container terminated with a non-zero exit code. |
| **Unknown** | Node communication failure — kubelet isn't reporting status. |

### 5.3 Multi-Container Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Sidecar** | Helper container that extends the main container's functionality | Envoy proxy, log collector, config reloader |
| **Init container** | Runs to completion before the main containers start | Database migration, config download, dependency wait |
| **Ambassador** | Proxy that simplifies access to external services | Connection pooling, protocol adaptation |
| **Adapter** | Transforms the main container's output | Log format normalization, metrics export |

Init containers run sequentially — each must complete before the next starts. The main containers only start after all init containers succeed.

### 5.4 Pod Networking

Every Pod gets its own unique IP address within the cluster. Containers within a Pod share this IP and communicate via `localhost`. Pods can communicate with any other Pod in the cluster using the target Pod's IP — no NAT required (this is a fundamental Kubernetes networking rule).

```
Pod A (10.244.1.5)                    Pod B (10.244.2.8)
┌─────────────────────┐              ┌──────────────────┐
│  Container 1        │              │  Container 1     │
│  (localhost:8080)    │   direct IP  │  (localhost:3000) │
│                     │ ──────────► │                  │
│  Container 2        │  10.244.2.8  │                  │
│  (localhost:9090)    │              │                  │
└─────────────────────┘              └──────────────────┘
    share localhost                      own IP address
```

---

## 6. Workload Controllers

You almost never create Pods directly. Instead, you use **controllers** that manage Pod lifecycles for you.

### 6.1 Deployment

The most common controller. Manages stateless applications by maintaining a set of identical Pods.

**What a Deployment does:**
- Creates a ReplicaSet, which in turn creates Pods
- Performs rolling updates when the Pod template changes
- Maintains revision history for rollbacks
- Scales up and down by adjusting the replica count

**Deployment → ReplicaSet → Pod hierarchy:**

```
Deployment (nginx-deploy)
  │
  ├── ReplicaSet (nginx-deploy-7b4c9f8d) ← current
  │     ├── Pod (nginx-deploy-7b4c9f8d-abc12)
  │     ├── Pod (nginx-deploy-7b4c9f8d-def34)
  │     └── Pod (nginx-deploy-7b4c9f8d-ghi56)
  │
  └── ReplicaSet (nginx-deploy-5a2e1c7b) ← previous (scaled to 0)
```

### 6.2 StatefulSet

Manages stateful applications that need stable identities and persistent storage.

**Guarantees over Deployment:**

| Feature | Deployment | StatefulSet |
|---------|-----------|-------------|
| Pod names | Random hash (`nginx-7b4c-abc12`) | Ordinal index (`mysql-0`, `mysql-1`, `mysql-2`) |
| Startup order | All at once | Sequential (0 → 1 → 2) |
| Storage | Shared or none | Per-Pod PersistentVolumeClaim |
| Network identity | Ephemeral | Stable DNS (`mysql-0.mysql-headless.ns.svc.cluster.local`) |
| Deletion order | Any order | Reverse ordinal (2 → 1 → 0) |

StatefulSets require a **Headless Service** (ClusterIP: None) to provide stable DNS names for each Pod.

### 6.3 DaemonSet

Ensures a copy of a Pod runs on **every node** (or a subset matching a node selector). When a new node joins the cluster, the DaemonSet automatically schedules a Pod on it.

**Common uses:**
- Log collection agents (Fluentd, Filebeat)
- Monitoring agents (Prometheus Node Exporter, Datadog Agent)
- Network plugins (CNI, kube-proxy)
- Storage drivers (CSI node plugins)

### 6.4 Job and CronJob

**Job:** Runs one or more Pods to completion. The Job tracks successful completions and retries failed Pods up to a configurable backoff limit.

| Parameter | Description |
|-----------|-------------|
| `completions` | Number of successful completions required |
| `parallelism` | Number of Pods running concurrently |
| `backoffLimit` | Max retry count before marking the Job as failed |
| `activeDeadlineSeconds` | Timeout for the entire Job |

**CronJob:** Creates Jobs on a schedule using standard cron syntax.

```yaml
schedule: "0 2 * * *"  # Daily at 2 AM
```

### 6.5 ReplicaSet

Maintains a stable set of replica Pods at any given time. Deployments manage ReplicaSets — you rarely create ReplicaSets directly. The ReplicaSet ensures that the specified number of Pods are running. If a Pod is deleted or fails, the ReplicaSet creates a replacement.

---

## 7. Services and Service Discovery

Pods are ephemeral — they come and go, their IPs change. **Services** provide a stable network endpoint (a fixed IP and DNS name) that routes traffic to a dynamic set of Pods.

### 7.1 How Services Work

A Service uses a **label selector** to identify which Pods receive traffic. The Service's IP (ClusterIP) never changes, even as Pods behind it are created and destroyed.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app      # Routes to all Pods with label app=my-app
  ports:
  - port: 80          # Service port
    targetPort: 8080   # Container port
  type: ClusterIP
```

**Traffic flow:**

```
Client Pod ──► my-app.default.svc.cluster.local:80
                     │
                     ▼
              Service (ClusterIP: 10.96.0.15)
                     │
              kube-proxy / iptables / eBPF
                     │
            ┌────────┼────────┐
            ▼        ▼        ▼
         Pod A     Pod B     Pod C
        :8080     :8080     :8080
```

### 7.2 Service Types

| Type | Scope | How It Works |
|------|-------|-------------|
| **ClusterIP** | Internal only | Assigns a virtual IP reachable only within the cluster. Default type. |
| **NodePort** | External via node IP | Exposes the Service on a static port (30000–32767) on every node's IP. |
| **LoadBalancer** | External via cloud LB | Provisions a cloud load balancer (AWS ELB, GCP LB, Azure LB) that forwards to the Service. |
| **ExternalName** | DNS alias | Returns a CNAME record pointing to an external DNS name. No proxying. |

**Relationship between types:**

```
LoadBalancer ──includes──► NodePort ──includes──► ClusterIP

A LoadBalancer Service gets:
  1. A ClusterIP (internal)
  2. A NodePort (on every node)
  3. An external load balancer (cloud-provisioned)
```

### 7.3 Endpoints and EndpointSlices

When you create a Service with a selector, Kubernetes automatically creates **EndpointSlice** objects that list the IP addresses of all matching Pods. kube-proxy reads these EndpointSlices to program routing rules.

EndpointSlices replaced the older Endpoints resource for better scalability — each EndpointSlice holds up to 100 endpoints by default, allowing the system to update portions of a large Service without rewriting the entire endpoint list.

### 7.4 Headless Services

A Service with `clusterIP: None` is headless. Instead of a virtual IP, a DNS query for the Service name returns the individual Pod IPs directly. Used by StatefulSets for stable per-Pod DNS and by applications that handle load balancing themselves (e.g., database clients with connection pooling).

```
dig my-headless-svc.default.svc.cluster.local

# Returns:
# 10.244.1.5  (Pod 0)
# 10.244.2.8  (Pod 1)
# 10.244.3.3  (Pod 2)
```

---

## 8. Networking Model

Kubernetes networking is built on three fundamental rules:

1. **Every Pod gets its own IP address** — no sharing, no NAT between Pods.
2. **All Pods can communicate with all other Pods** without NAT — across nodes.
3. **Agents on a node can communicate with all Pods on that node.**

The implementation of these rules is delegated to **CNI (Container Network Interface)** plugins.

### 8.1 CNI Plugins

| Plugin | Mechanism | Notable Features |
|--------|-----------|-----------------|
| **Calico** | BGP routing or VXLAN overlay | Network policies, eBPF dataplane option |
| **Cilium** | eBPF (kernel-level packet processing) | Advanced network policies, observability, service mesh |
| **Flannel** | VXLAN overlay | Simple, minimal features |
| **AWS VPC CNI** | Native VPC networking (each Pod gets a VPC IP) | No overlay, direct VPC routing |
| **Weave Net** | Encrypted VXLAN overlay | Automatic mesh, encryption |

### 8.2 Overlay vs Native Networking

| Approach | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **Overlay** (VXLAN, Geneve) | Encapsulates Pod packets inside node-to-node packets | Works on any infrastructure, portable | Overhead from encapsulation, slightly higher latency |
| **Native** (BGP, VPC CNI) | Pods use real routable IPs from the underlying network | No encapsulation overhead, cloud integration | Depends on infrastructure, may exhaust IPs |

### 8.3 Network Policies

By default, all Pods can communicate with all other Pods. **NetworkPolicy** objects restrict this — they're firewall rules for Pod-to-Pod traffic.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-restrict
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
```

This policy says: only Pods with label `app: backend` can connect to Pods with label `app: database` on port 5432. All other ingress traffic to the database is denied.

**Important:** NetworkPolicy is only enforced if the CNI plugin supports it. Flannel does not. Calico and Cilium do.

---

## 9. Ingress and Gateway API

Services expose applications within the cluster (ClusterIP) or via raw TCP/UDP (NodePort, LoadBalancer). For HTTP(S) traffic with routing rules, TLS termination, and virtual hosting, you need **Ingress** or the newer **Gateway API**.

### 9.1 Ingress

An Ingress object defines HTTP routing rules — mapping hostnames and URL paths to backend Services.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-cert
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

An **Ingress Controller** — a reverse proxy running inside the cluster — watches Ingress objects and configures itself to route traffic accordingly.

| Ingress Controller | Based On |
|-------------------|----------|
| **ingress-nginx** | NGINX |
| **Traefik** | Traefik proxy |
| **HAProxy Ingress** | HAProxy |
| **AWS ALB Ingress** | AWS Application Load Balancer |
| **Istio Ingress Gateway** | Envoy |

### 9.2 Gateway API

The successor to Ingress. Provides more expressive routing, multi-tenancy support, and a cleaner separation of concerns between infrastructure operators and application developers.

| Concept | Ingress | Gateway API |
|---------|---------|-------------|
| Who manages infrastructure | Implicit | GatewayClass (infra provider) |
| Who manages the listener | Ingress object | Gateway (cluster operator) |
| Who manages routing | Ingress object | HTTPRoute (app developer) |
| Protocol support | HTTP(S) only | HTTP, gRPC, TCP, UDP, TLS |
| Traffic splitting | Not native | Built-in (weight-based) |

---

## 10. Storage

Containers have ephemeral filesystems — data is lost when a container restarts. Kubernetes provides a volume system for persistent and shared storage.

### 10.1 Volume Types

| Volume Type | Persistence | Use Case |
|-------------|-------------|----------|
| **emptyDir** | Pod lifetime only | Scratch space, shared data between containers in a Pod |
| **hostPath** | Node lifetime | Accessing node-level data (system logs, Docker socket) |
| **PersistentVolumeClaim** | Beyond Pod lifetime | Databases, file storage, anything that must survive Pod restarts |
| **configMap / secret** | Managed by Kubernetes | Configuration files, credentials |
| **projected** | Managed by Kubernetes | Combines multiple sources (ConfigMaps, Secrets, downwardAPI) into one mount |

### 10.2 Persistent Volumes (PV) and Claims (PVC)

The PV/PVC model decouples storage provisioning from consumption:

```
Administrator / StorageClass (provisions)
            │
            ▼
    PersistentVolume (PV)
        "10Gi of gp3 SSD"
            ▲
            │ bound
            │
    PersistentVolumeClaim (PVC)
        "I need 10Gi of SSD"
            ▲
            │ references
            │
        Pod spec
```

| Concept | Role |
|---------|------|
| **PersistentVolume (PV)** | A piece of storage in the cluster — an EBS volume, NFS share, or cloud disk. Provisioned by an admin or dynamically. |
| **PersistentVolumeClaim (PVC)** | A request for storage by a user. Specifies size, access mode, and StorageClass. |
| **StorageClass** | Defines a provisioner and parameters for dynamic volume creation. Eliminates manual PV creation. |

### 10.3 Dynamic Provisioning

With a StorageClass configured, Kubernetes automatically creates PVs when PVCs are submitted:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

When a Pod with a PVC referencing `storageClassName: fast-ssd` is scheduled, the CSI driver provisions an EBS gp3 volume, creates a PV, binds the PVC, and attaches the volume to the node.

### 10.4 Access Modes

| Mode | Abbreviation | Description |
|------|-------------|-------------|
| **ReadWriteOnce** | RWO | Mounted read-write by a single node |
| **ReadOnlyMany** | ROX | Mounted read-only by many nodes |
| **ReadWriteMany** | RWX | Mounted read-write by many nodes |
| **ReadWriteOncePod** | RWOP | Mounted read-write by a single Pod (v1.29+) |

Block storage (EBS, Azure Disk, GCE PD) typically supports only RWO. File storage (EFS, NFS, Azure Files) supports RWX.

### 10.5 Container Storage Interface (CSI)

CSI is the standard plugin interface that allows storage vendors to expose their systems to Kubernetes without modifying the core codebase. Every cloud provider and major storage vendor provides a CSI driver.

---

## 11. Configuration and Secrets

### 11.1 ConfigMaps

Store non-sensitive configuration data as key-value pairs. Pods consume ConfigMaps as environment variables or mounted files.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: "postgres.default.svc.cluster.local"
  LOG_LEVEL: "info"
  config.yaml: |
    server:
      port: 8080
      timeout: 30s
```

**Consumption methods:**

| Method | How | Use When |
|--------|-----|----------|
| **Environment variable** | `envFrom` or `env.valueFrom.configMapKeyRef` | Simple key-value settings |
| **Mounted file** | `volumeMounts` with `configMap` volume | Config files (YAML, properties, JSON) |

### 11.2 Secrets

Store sensitive data (passwords, tokens, certificates). Secrets are base64-encoded (not encrypted) by default. For encryption at rest, you must configure an EncryptionConfiguration or use a KMS provider.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=          # base64("admin")
  password: cDRzc3cwcmQ=      # base64("p4ssw0rd")
```

**Secret types:**

| Type | Purpose |
|------|---------|
| `Opaque` | Arbitrary key-value data (default) |
| `kubernetes.io/tls` | TLS certificate and key |
| `kubernetes.io/dockerconfigjson` | Container registry credentials |
| `kubernetes.io/service-account-token` | Service account JWT token |

**Security considerations:**
- Secrets are stored in etcd — encrypt etcd at rest
- Secrets are transmitted in plaintext to nodes — use TLS for all kubelet communication (default)
- RBAC should restrict who can read Secrets
- External secrets managers (AWS Secrets Manager, HashiCorp Vault) can inject Secrets via CSI driver or operators

---

## 12. Scheduling

The scheduler determines which node each Pod runs on. It considers resource requirements, constraints, affinities, and topology.

### 12.1 Resource Requests and Limits

Every container can declare resource **requests** (guaranteed minimum) and **limits** (maximum allowed).

```yaml
resources:
  requests:
    cpu: "250m"       # 250 millicores = 0.25 CPU
    memory: "256Mi"   # 256 mebibytes
  limits:
    cpu: "500m"
    memory: "512Mi"
```

| Concept | Effect |
|---------|--------|
| **Request** | The scheduler uses requests to find a node with enough capacity. The container is guaranteed at least this much. |
| **Limit** | The container cannot exceed this. CPU is throttled. Memory over-limit triggers OOM kill. |

**CPU units:** `1` = 1 vCPU/core. `100m` = 100 millicores = 0.1 CPU.
**Memory units:** `Mi` (mebibytes), `Gi` (gibibytes). `256Mi` = 268,435,456 bytes.

### 12.2 Node Selection

| Mechanism | Strength | Use Case |
|-----------|----------|----------|
| **nodeSelector** | Simple key-value match | "Run on GPU nodes" (`gpu: "true"`) |
| **nodeAffinity** | Expressive rules (In, NotIn, Exists, etc.) | "Prefer us-east-1a, but allow us-east-1b" |
| **podAffinity** | Co-locate Pods | "Run cache next to the web server" |
| **podAntiAffinity** | Spread Pods | "Don't put two replicas on the same node" |
| **Taints and tolerations** | Node-side rejection | "Only GPU workloads on GPU nodes" |
| **Topology spread constraints** | Even distribution | "Spread evenly across availability zones" |

### 12.3 Taints and Tolerations

Taints are applied to nodes. A taint **repels** Pods unless the Pod has a matching toleration.

```bash
# Taint a node
kubectl taint nodes gpu-node-1 gpu=true:NoSchedule
```

```yaml
# Pod tolerates the taint
tolerations:
- key: "gpu"
  operator: "Equal"
  value: "true"
  effect: "NoSchedule"
```

| Taint Effect | Behavior |
|-------------|----------|
| **NoSchedule** | New Pods won't be scheduled here (existing Pods stay) |
| **PreferNoSchedule** | Scheduler tries to avoid this node, but will use it if needed |
| **NoExecute** | Evicts existing Pods that don't tolerate the taint |

### 12.4 Priority and Preemption

Pods can have priority classes. When the cluster is full, a high-priority Pod can **preempt** (evict) lower-priority Pods to free resources.

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: critical
value: 1000000
globalDefault: false
preemptionPolicy: PreemptLowerPriority
```

---

## 13. Scaling

### 13.1 Horizontal Pod Autoscaler (HPA)

Automatically adjusts the number of Pod replicas based on observed metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**How HPA works:**

```
Metrics Server
    │ scrapes metrics every 15s
    ▼
HPA Controller (runs every 15s)
    │ computes desired replicas:
    │   desired = ceil(current × (currentMetric / targetMetric))
    ▼
Deployment
    │ adjusts replicas
    ▼
Scheduler → new Pods
```

**Scaling metrics:**

| Metric Type | Examples |
|-------------|---------|
| **Resource** | CPU utilization, memory utilization |
| **Pods** | Custom per-Pod metrics (requests/second) |
| **Object** | Metrics from other Kubernetes objects (queue length) |
| **External** | Metrics from outside the cluster (SQS queue depth, Pub/Sub backlog) |

### 13.2 Vertical Pod Autoscaler (VPA)

Adjusts resource requests and limits for individual Pods. Instead of adding more Pods, it makes existing Pods bigger or smaller. VPA is useful for workloads that don't scale horizontally (single-instance databases, batch jobs).

**Modes:**

| Mode | Behavior |
|------|----------|
| **Off** | Only recommends — doesn't change anything |
| **Initial** | Sets resources only at Pod creation time |
| **Auto** | Updates running Pods (requires Pod restart) |

**Note:** HPA and VPA should not target the same metric on the same workload. They will fight — one scaling out while the other scales up.

### 13.3 Cluster Autoscaler

Adjusts the number of **nodes** in the cluster. When Pods can't be scheduled because no node has enough resources, the Cluster Autoscaler provisions new nodes from the cloud provider. When nodes are underutilized, it drains and removes them.

```
Unschedulable Pod (insufficient resources)
    │
    ▼
Cluster Autoscaler detects pending Pod
    │
    ▼
Cloud provider API: create new node
    │
    ▼
New node joins cluster
    │
    ▼
Scheduler places Pod on new node
```

**Karpenter** (AWS-native) is a newer alternative to Cluster Autoscaler with faster provisioning and more flexible node selection.

---

## 14. Health Checks and Self-Healing

Kubernetes uses **probes** to detect and respond to container failures.

### 14.1 Probe Types

| Probe | Purpose | Failure Action |
|-------|---------|---------------|
| **Liveness** | Is the container alive? | Restart the container |
| **Readiness** | Can the container serve traffic? | Remove from Service endpoints (stop sending traffic) |
| **Startup** | Has the container finished starting? | Block liveness/readiness checks until startup succeeds |

### 14.2 Probe Mechanisms

| Mechanism | Description |
|-----------|-------------|
| **httpGet** | HTTP GET to a path. Success = 200–399 status code. |
| **tcpSocket** | TCP connection attempt. Success = connection established. |
| **exec** | Execute a command inside the container. Success = exit code 0. |
| **grpc** | gRPC health check (v1.27+). |

### 14.3 Probe Configuration

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15    # Wait before first check
  periodSeconds: 10          # Check every 10 seconds
  timeoutSeconds: 3          # Timeout per check
  failureThreshold: 3        # Restart after 3 consecutive failures
  successThreshold: 1        # 1 success = healthy again

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

### 14.4 Self-Healing Behaviors

| Failure | Kubernetes Response |
|---------|-------------------|
| Container crashes (exit code != 0) | kubelet restarts it with exponential backoff (10s, 20s, 40s, ... up to 5 minutes) |
| Liveness probe fails 3 times | kubelet kills and restarts the container |
| Readiness probe fails | Pod is removed from Service endpoints — no traffic |
| Node becomes unreachable | After 5 minutes (configurable), Pods are rescheduled to healthy nodes |
| Pod deleted | ReplicaSet/Deployment creates a replacement |

---

## 15. Rolling Updates and Deployment Strategies

### 15.1 Rolling Update (Default)

Gradually replaces old Pods with new ones. At no point during the update are zero Pods available.

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1     # At most 1 Pod down at a time
      maxSurge: 1           # At most 1 extra Pod at a time
```

**Update sequence (3 replicas, maxUnavailable=1, maxSurge=1):**

```
Step 1: 3 old running. Create 1 new.          [old old old | new(starting)]
Step 2: New is ready. Terminate 1 old.         [old old     | new]
Step 3: Create 1 new.                          [old old     | new new(starting)]
Step 4: New is ready. Terminate 1 old.         [old         | new new]
Step 5: Create 1 new.                          [old         | new new new(starting)]
Step 6: New is ready. Terminate last old.      [            | new new new]
```

### 15.2 Recreate

Terminates all old Pods before creating new ones. Simple but causes downtime.

```yaml
spec:
  strategy:
    type: Recreate
```

**Use when:** The application cannot run two versions simultaneously (e.g., exclusive database lock, non-backwards-compatible schema change).

### 15.3 Blue-Green and Canary

Kubernetes doesn't have built-in blue-green or canary strategies, but they're implemented through Service label selectors or Ingress traffic splitting.

**Blue-Green:** Deploy the new version alongside the old one. Switch the Service selector to point to the new version. Instant cutover, instant rollback.

**Canary:** Route a small percentage of traffic to the new version. Gradually increase if metrics look good. Implemented with weighted routing (Istio, Gateway API, Argo Rollouts).

### 15.4 Rollbacks

Every Deployment change creates a new ReplicaSet revision. Roll back to any previous version:

```bash
# View rollout history
kubectl rollout history deployment/my-app

# Roll back to the previous version
kubectl rollout undo deployment/my-app

# Roll back to a specific revision
kubectl rollout undo deployment/my-app --to-revision=3
```

---

## 16. Namespaces and Resource Management

### 16.1 Namespaces

Namespaces provide **virtual clusters** within a physical cluster. They partition resources, scope RBAC rules, and enable multi-tenancy.

| Default Namespace | Purpose |
|-------------------|---------|
| `default` | Resources with no explicit namespace |
| `kube-system` | Control plane components (DNS, metrics server, kube-proxy) |
| `kube-public` | Readable by all users, typically empty |
| `kube-node-lease` | Node heartbeat leases |

Most resources are namespaced (Pods, Services, Deployments, ConfigMaps). Some are cluster-scoped (Nodes, PersistentVolumes, ClusterRoles, Namespaces themselves).

### 16.2 Resource Quotas

Limit aggregate resource consumption within a namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "50"
    services: "10"
    persistentvolumeclaims: "20"
```

When the quota is exceeded, new resource creation is rejected.

### 16.3 LimitRanges

Set default and maximum resource values for individual containers:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: container-limits
  namespace: team-a
spec:
  limits:
  - type: Container
    default:
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    max:
      cpu: "2"
      memory: "4Gi"
```

If a Pod doesn't specify resource requests/limits, the LimitRange defaults are applied automatically.

---

## 17. RBAC and Security

### 17.1 Role-Based Access Control (RBAC)

RBAC controls who can do what in the cluster. It's built on four object types:

| Object | Scope | Purpose |
|--------|-------|---------|
| **Role** | Namespace | Defines permissions within a single namespace |
| **ClusterRole** | Cluster-wide | Defines permissions across all namespaces or for cluster-scoped resources |
| **RoleBinding** | Namespace | Grants a Role to a user/group/service account within a namespace |
| **ClusterRoleBinding** | Cluster-wide | Grants a ClusterRole cluster-wide |

```yaml
# A Role that allows reading Pods in the "production" namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]

---
# Bind the Role to a user
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### 17.2 Service Accounts

Every Pod runs with a **ServiceAccount** identity. Service accounts are namespaced and can be granted RBAC permissions. This is how Pods authenticate to the Kubernetes API.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
```

Pods reference service accounts in their spec. The kubelet mounts a projected volume with a short-lived JWT token that the Pod uses to authenticate with the API server.

### 17.3 Pod Security

**Pod Security Standards** (replacing the deprecated PodSecurityPolicy) define three security profiles:

| Profile | Description |
|---------|-------------|
| **Privileged** | No restrictions |
| **Baseline** | Prevents known privilege escalations (no hostNetwork, no privileged containers) |
| **Restricted** | Heavily restricted (must run as non-root, read-only root filesystem, drop all capabilities) |

Applied via namespace labels:

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 17.4 Security Context

Per-container or per-Pod security settings:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

---

## 18. DNS in Kubernetes

Kubernetes runs a DNS service (CoreDNS) that provides name resolution for Services and Pods within the cluster.

### 18.1 Service DNS Records

| Query | Resolves To |
|-------|------------|
| `my-service.my-namespace.svc.cluster.local` | Service ClusterIP |
| `my-service.my-namespace.svc.cluster.local` (headless) | Set of Pod IPs |
| `_http._tcp.my-service.my-namespace.svc.cluster.local` | SRV record (port + host) |

### 18.2 Pod DNS Records

| Query | Resolves To |
|-------|------------|
| `10-244-1-5.my-namespace.pod.cluster.local` | Pod IP (dashes replace dots) |
| `pod-0.my-headless-svc.my-namespace.svc.cluster.local` | StatefulSet Pod IP |

### 18.3 DNS Search Domains

Every Pod's `/etc/resolv.conf` includes search domains that allow short names:

```
nameserver 10.96.0.10
search my-namespace.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```

Within the same namespace, `my-service` resolves to `my-service.my-namespace.svc.cluster.local`. Cross-namespace: `my-service.other-namespace`.

**The `ndots:5` setting:** A query with fewer than 5 dots (e.g., `api.example.com` has 2 dots) tries the search domains first before querying external DNS. This can cause unnecessary DNS lookups for external domains. Tuning `ndots` or using fully qualified names (trailing dot) mitigates this.

### 18.4 External DNS Resolution

Queries that don't match any cluster Service or Pod are forwarded to upstream DNS resolvers configured in CoreDNS (typically the node's `/etc/resolv.conf` or cloud-provider DNS).

---

## 19. Observability

### 19.1 Metrics

**Metrics Server** is a cluster add-on that collects CPU and memory metrics from kubelets. It powers `kubectl top` and the HPA. It is not a long-term metrics store.

**Prometheus** is the standard for Kubernetes monitoring. It scrapes metrics from:
- kubelets (`/metrics/cadvisor` for container metrics)
- The API server (`/metrics`)
- Application Pods (custom `/metrics` endpoints)
- kube-state-metrics (translates Kubernetes object state into Prometheus metrics)

### 19.2 Logging

Kubernetes does not have a built-in log aggregation system. Container stdout/stderr is captured by the container runtime and stored on the node. Common patterns:

| Pattern | How |
|---------|-----|
| **Node-level agent** | DaemonSet runs a log collector (Fluentd, Fluent Bit, Filebeat) on every node |
| **Sidecar** | A log-shipping container in every Pod |
| **Direct push** | Application sends logs directly to a backend (Loki, Elasticsearch, CloudWatch) |

### 19.3 Tracing

Distributed tracing (OpenTelemetry, Jaeger, Zipkin) is application-level — Kubernetes doesn't provide built-in tracing. Service meshes (Istio, Linkerd) can add tracing transparently via sidecar proxies.

### 19.4 Events

Kubernetes emits **Events** for significant state changes:

```bash
kubectl get events --sort-by=.lastTimestamp
```

Events cover: Pod scheduling, image pulls, container starts/stops, probe failures, scaling decisions, volume attachments. They have a default TTL of 1 hour.

---

## 20. Helm and Package Management

### 20.1 What Helm Is

Helm is the package manager for Kubernetes. A **chart** is a collection of templated YAML manifests plus default values. Helm renders templates with values and applies the result to the cluster.

```
Chart (package)
├── Chart.yaml         # Metadata (name, version, dependencies)
├── values.yaml        # Default configuration values
├── templates/         # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl   # Template functions
└── charts/            # Dependencies (sub-charts)
```

### 20.2 Key Concepts

| Concept | Description |
|---------|-------------|
| **Chart** | A package — templated Kubernetes manifests + values |
| **Release** | An installed instance of a chart with a specific name |
| **Repository** | A registry hosting charts (like npm for Kubernetes) |
| **Values** | Configuration that customizes a chart for a specific deployment |

### 20.3 Common Commands

```bash
# Add a chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Search for charts
helm search repo postgres

# Install a chart (creates a release)
helm install my-db bitnami/postgresql --values custom-values.yaml

# Upgrade a release
helm upgrade my-db bitnami/postgresql --values custom-values.yaml

# Rollback to a previous revision
helm rollback my-db 1

# List releases
helm list

# Uninstall a release
helm uninstall my-db
```

### 20.4 Alternatives

| Tool | Approach |
|------|----------|
| **Kustomize** | Overlay-based patching of plain YAML (no templates). Built into kubectl (`kubectl apply -k`). |
| **Jsonnet / cdk8s / Pulumi** | Programmatic manifest generation using real programming languages |
| **ArgoCD / Flux** | GitOps — desired state in Git, continuously synced to the cluster |

---

## Appendix A: Technical Constants

| Constant | Value | Context |
|----------|-------|---------|
| API server default port | 6443 (HTTPS) | Control plane |
| kubelet default port | 10250 (HTTPS) | Worker node |
| etcd client port | 2379 | Control plane |
| etcd peer port | 2380 | Control plane |
| DNS service default IP | 10.96.0.10 (cluster-dependent) | CoreDNS |
| DNS port | 53 (UDP/TCP) | CoreDNS |
| Default Service CIDR | 10.96.0.0/12 | ClusterIP range |
| Default Pod CIDR | 10.244.0.0/16 | Pod IP range (CNI-dependent) |
| NodePort range | 30000–32767 | Service type NodePort |
| Max Pods per node | 110 (default) | kubelet configurable |
| Max nodes per cluster | 5,000 (tested) | Kubernetes scalability SLO |
| Max Pods per cluster | 150,000 (tested) | Kubernetes scalability SLO |
| Max Services per cluster | 10,000 (tested) | Kubernetes scalability SLO |
| Max namespaces per cluster | 10,000 (tested) | Kubernetes scalability SLO |
| Endpoints per EndpointSlice | 100 (default) | Configurable |
| HPA default sync period | 15 seconds | Controller manager flag |
| Node heartbeat interval | 10 seconds | kubelet → API server (Lease) |
| Node monitor grace period | 40 seconds | Controller manager default |
| Pod eviction timeout | 5 minutes | After node unreachable |
| Container restart backoff | 10s, 20s, 40s, ... up to 5 min | CrashLoopBackOff exponential |
| Event default TTL | 1 hour | kube-apiserver configurable |
| etcd max recommended DB size | 8 GB | Performance limit |
| etcd Raft quorum | (N/2) + 1 | Consensus |
| Label key max length | 63 chars (name), 253 chars (prefix) | Kubernetes naming |
| Label value max length | 63 chars | Kubernetes naming |
| Namespace name max length | 63 chars | DNS-compatible |
| ConfigMap max size | 1 MiB | etcd object size limit |
| Secret max size | 1 MiB | etcd object size limit |
| Default ndots | 5 | Pod DNS configuration |
| Kubernetes release cycle | ~3 releases per year | ~4 months between minors |
| Version support window | 14 months per minor version | Security patches |
| Container Runtime Interface | gRPC | CRI protocol |
| Container Network Interface | Binary exec | CNI protocol |
| Container Storage Interface | gRPC | CSI protocol |

---

## Appendix B: Key API Resources Reference

| Resource | API Group | Namespaced | Short Name | Description |
|----------|-----------|-----------|------------|-------------|
| Pod | core (v1) | Yes | `po` | Smallest deployable unit |
| Service | core (v1) | Yes | `svc` | Stable network endpoint |
| ConfigMap | core (v1) | Yes | `cm` | Non-sensitive configuration |
| Secret | core (v1) | Yes | — | Sensitive data (base64) |
| Namespace | core (v1) | No | `ns` | Virtual cluster partition |
| Node | core (v1) | No | `no` | Worker machine |
| PersistentVolume | core (v1) | No | `pv` | Cluster storage resource |
| PersistentVolumeClaim | core (v1) | Yes | `pvc` | Storage request |
| ServiceAccount | core (v1) | Yes | `sa` | Pod identity |
| Deployment | apps/v1 | Yes | `deploy` | Stateless workload controller |
| ReplicaSet | apps/v1 | Yes | `rs` | Pod replica manager |
| StatefulSet | apps/v1 | Yes | `sts` | Stateful workload controller |
| DaemonSet | apps/v1 | Yes | `ds` | Per-node Pod controller |
| Job | batch/v1 | Yes | — | Run-to-completion workload |
| CronJob | batch/v1 | Yes | `cj` | Scheduled Job |
| Ingress | networking.k8s.io/v1 | Yes | `ing` | HTTP routing rules |
| NetworkPolicy | networking.k8s.io/v1 | Yes | `netpol` | Pod-to-Pod firewall |
| StorageClass | storage.k8s.io/v1 | No | `sc` | Dynamic volume provisioner |
| HorizontalPodAutoscaler | autoscaling/v2 | Yes | `hpa` | Replica count autoscaler |
| Role | rbac.authorization.k8s.io/v1 | Yes | — | Namespaced permissions |
| ClusterRole | rbac.authorization.k8s.io/v1 | No | — | Cluster-wide permissions |
| RoleBinding | rbac.authorization.k8s.io/v1 | Yes | — | Binds Role to subject |
| ClusterRoleBinding | rbac.authorization.k8s.io/v1 | No | — | Binds ClusterRole cluster-wide |
| PriorityClass | scheduling.k8s.io/v1 | No | `pc` | Pod scheduling priority |
| ResourceQuota | core (v1) | Yes | `quota` | Namespace resource limits |
| LimitRange | core (v1) | Yes | `limits` | Container default resources |
