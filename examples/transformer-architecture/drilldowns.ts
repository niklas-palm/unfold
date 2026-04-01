import type { DrilldownDef } from 'unfold-ai'

// --- Attention Math (content) ---

const attentionMathDrilldown: DrilldownDef = {
  type: 'content',
  id: 'attention-math',
  title: 'Scaled Dot-Product Attention',
  subtitle: 'The core mathematical operation behind all Transformer models',
  sections: [
    {
      heading: 'The Formula',
      body: 'Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V',
      items: [
        { label: 'Q (Query)', detail: 'Matrix [n x d_k] — what each token is searching for' },
        { label: 'K (Key)', detail: 'Matrix [n x d_k] — what each token advertises about itself' },
        { label: 'V (Value)', detail: 'Matrix [n x d_v] — the actual content each token carries' },
        { label: 'QK^T', detail: '[n x n] raw attention scores — how well each query matches each key' },
        { label: '1/sqrt(d_k)', detail: 'Scaling factor — prevents large dot products from pushing softmax into near-zero gradient regions' },
      ],
    },
    {
      heading: 'Computational Complexity',
      items: [
        { label: 'Attention scores (QK^T)', detail: 'O(n^2 * d_k)' },
        { label: 'Softmax normalization', detail: 'O(n^2)' },
        { label: 'Weighted sum with V', detail: 'O(n^2 * d_v)' },
        { label: 'Total per layer', detail: 'O(n^2 * d_model)' },
      ],
      note: {
        title: 'Why O(n^2) matters',
        body: 'Doubling sequence length quadruples computation. At 128K tokens, the full attention matrix has 16 billion entries. This bottleneck drives all efficiency research: FlashAttention, sparse attention, and grouped-query attention.',
      },
    },
    {
      heading: 'Multi-Head Attention',
      body: 'Rather than computing one set of attention weights, the Transformer runs h parallel attention heads, each with its own Q, K, V projections in a reduced dimension d_k = d_model / h.',
      items: [
        { label: 'Original paper', detail: 'h=8 heads, d_model=512, d_k=64 per head' },
        { label: 'Head specialization', detail: 'Different heads learn syntax, coreference, local context, and semantic similarity' },
        { label: 'Output projection', detail: 'Concatenated head outputs are projected through W_O back to d_model' },
      ],
    },
  ],
}

// --- Encoder Layers (sequence) ---

const encoderLayersDrilldown: DrilldownDef = {
  type: 'sequence',
  id: 'encoder-layers',
  title: 'Inside the Encoder Stack',
  subtitle: 'How representations refine from surface features to deep semantics',
  actors: [
    { id: 'input', label: 'Input', sub: 'Embeddings + PE' },
    { id: 'early', label: 'Layer 1', sub: 'Early', color: 'sage' },
    { id: 'mid', label: 'Layers 2-5', sub: 'Middle', color: 'sage' },
    { id: 'late', label: 'Layer N', sub: 'Late', color: 'sage' },
    { id: 'output', label: 'Output', sub: 'Contextualized' },
  ],
  phases: [
    {
      name: 'Surface Features',
      messages: [
        { from: 'input', to: 'early', label: 'Token embeddings + positional' },
        { actor: 'early', text: 'Multi-Head Self-Attention\n+ Add & LayerNorm\nFFN + Add & LayerNorm' },
        { actor: 'early', text: 'Learns: token identity,\nPOS tags, local context' },
      ],
    },
    {
      name: 'Syntactic Structure',
      messages: [
        { from: 'early', to: 'mid', label: 'Refined representations' },
        { actor: 'mid', text: 'Same two sublayers\nrepeated N-2 times' },
        { actor: 'mid', text: 'Learns: parse trees,\nsubject-object relationships,\ndependency arcs' },
      ],
    },
    {
      name: 'Semantic Content',
      messages: [
        { from: 'mid', to: 'late', label: 'Deep representations' },
        { actor: 'late', text: 'Final refinement pass' },
        { actor: 'late', text: 'Learns: coreference,\nentity types, world knowledge,\nlong-range relationships' },
      ],
    },
    {
      name: 'Encoder Output',
      messages: [
        { from: 'late', to: 'output', label: '[n x d_model] contextualized vectors' },
        { actor: 'output', text: 'One vector per input token\nFully contextualized by\nall other tokens' },
      ],
    },
  ],
}

// --- Decoder Internals (content) ---

const decoderInternalsDrilldown: DrilldownDef = {
  type: 'content',
  id: 'decoder-internals',
  title: 'The Decoder in Detail',
  subtitle: 'Three sublayers per layer — masked attention, cross-attention, and FFN',
  sections: [
    {
      columns: [
        {
          heading: 'Masked Self-Attention',
          badge: { text: 'Sublayer 1', color: 'slate' },
          body: 'Identical to encoder self-attention, but with a causal mask that prevents each position from attending to future positions. This makes generation autoregressive — each token depends only on previous tokens.',
          items: [
            { label: 'Mask type', detail: 'Lower triangular matrix (upper triangle set to -inf before softmax)' },
            { label: 'Purpose', detail: 'Prevent information leakage from future tokens during training' },
          ],
        },
        {
          heading: 'Cross-Attention',
          badge: { text: 'Sublayer 2', color: 'mist' },
          body: 'The bridge between encoder and decoder. Queries come from the decoder; keys and values come from the encoder output. This lets each decoder position selectively pull information from the input.',
          items: [
            { label: 'Q source', detail: 'Decoder hidden state' },
            { label: 'K, V source', detail: 'Encoder output' },
            { label: 'Matrix shape', detail: '[decoder_len x encoder_len] (not square)' },
          ],
        },
        {
          heading: 'Feed-Forward Network',
          badge: { text: 'Sublayer 3', color: 'sand' },
          body: 'Same position-wise expand-contract MLP as in the encoder. Each sublayer is wrapped in a residual connection + LayerNorm.',
          items: [
            { label: 'Structure', detail: 'd_model -> d_ff -> d_model (typically 4x expansion)' },
            { label: 'Activation', detail: 'ReLU (original), GeLU (BERT/GPT), SwiGLU (modern LLMs)' },
          ],
        },
      ],
    },
    {
      heading: 'Autoregressive Generation',
      body: 'The decoder generates one token at a time. At step t, the input is all previously generated tokens [1..t-1]. The output is a probability distribution over the vocabulary for position t. During training, the full target sequence is provided at once (teacher forcing) — the causal mask ensures the model cannot cheat by looking ahead.',
    },
  ],
}

// --- Masking Detail (content) ---

const maskingDetailDrilldown: DrilldownDef = {
  type: 'content',
  id: 'masking-detail',
  title: 'Masking Strategies',
  subtitle: 'Controlling which tokens can attend to which',
  sections: [
    {
      columns: [
        {
          heading: 'Causal Mask',
          badge: { text: 'Decoder', color: 'slate' },
          body: 'Prevents position i from attending to positions j > i. Creates a lower triangular attention pattern — each token sees only itself and earlier tokens. Applied in the decoder\'s self-attention.',
          items: [
            { label: 'Shape', detail: '[n x n] lower triangular matrix' },
            { label: 'Implementation', detail: 'Upper triangle set to -inf before softmax, producing near-zero weights' },
            { label: 'Effect', detail: 'Makes the Transformer causal — output at position t depends only on inputs at positions <= t' },
          ],
        },
        {
          heading: 'Padding Mask',
          badge: { text: 'Both', color: 'sage' },
          body: 'Prevents tokens from attending to padding positions. Batched sequences are padded to equal length with a [PAD] token — attending to these positions would corrupt the representations with meaningless information.',
          items: [
            { label: 'Shape', detail: '[batch x n] broadcast to attention matrix' },
            { label: 'Implementation', detail: 'Padded positions set to -inf in attention logits' },
            { label: 'Applied in', detail: 'Both encoder and decoder attention layers' },
          ],
        },
      ],
    },
    {
      note: {
        title: 'Combined masking',
        body: 'In decoder self-attention, both masks are applied simultaneously — the causal mask prevents looking ahead, and the padding mask prevents attending to [PAD] tokens. The masks are combined with element-wise minimum before the softmax operation.',
      },
    },
  ],
}

// --- Output Sampling (content) ---

const outputSamplingDrilldown: DrilldownDef = {
  type: 'content',
  id: 'output-sampling',
  title: 'Sampling Strategies',
  subtitle: 'Converting probability distributions into generated tokens',
  sections: [
    {
      columns: [
        {
          heading: 'Greedy',
          badge: { text: 'Deterministic', color: 'sage' },
          body: 'Always pick the highest-probability token (argmax). Simple and fast, but often produces repetitive, generic text.',
        },
        {
          heading: 'Temperature',
          badge: { text: 'T parameter', color: 'mist' },
          body: 'Divide logits by temperature T before softmax. T < 1 sharpens the distribution (more deterministic). T > 1 flattens it (more random). T = 0 is equivalent to greedy.',
        },
        {
          heading: 'Top-k',
          badge: { text: 'Fixed cutoff', color: 'sand' },
          body: 'Sample only from the k highest-probability tokens. Prevents selection of extremely unlikely tokens while maintaining diversity.',
        },
      ],
    },
    {
      columns: [
        {
          heading: 'Top-p (Nucleus)',
          badge: { text: 'Adaptive', color: 'mist' },
          body: 'Sample from the smallest set of tokens whose cumulative probability >= p. Adapts the vocabulary size dynamically — broad when the model is uncertain, narrow when confident.',
          items: [
            { label: 'Typical p', detail: '0.9 — 0.95' },
          ],
        },
        {
          heading: 'Beam Search',
          badge: { text: 'Multi-path', color: 'warm' },
          body: 'Maintain k candidate sequences (beams) in parallel. At each step, extend all beams and keep the top-k by total log probability. Best for deterministic tasks like translation.',
          items: [
            { label: 'Typical k', detail: '4 — 8 beams' },
          ],
        },
      ],
    },
  ],
}

// --- Variants Detail (content) ---

const variantsDetailDrilldown: DrilldownDef = {
  type: 'content',
  id: 'variants-detail',
  title: 'Architectural Variants',
  subtitle: 'Three families from one design — each optimized for different tasks',
  sections: [
    {
      columns: [
        {
          heading: 'Encoder-Only',
          badge: { text: 'BERT', color: 'sage' },
          body: 'Bidirectional attention — all tokens see all other tokens. Trained with masked language modeling (predict [MASK] tokens from context). Excels at understanding tasks.',
          items: [
            { label: 'Models', detail: 'BERT, RoBERTa, ALBERT, DeBERTa' },
            { label: 'Attention', detail: 'Bidirectional (no causal mask)' },
            { label: 'Best for', detail: 'Classification, NER, semantic similarity, retrieval' },
          ],
        },
        {
          heading: 'Decoder-Only',
          badge: { text: 'GPT', color: 'slate' },
          body: 'Causal attention — each token sees only previous tokens. Trained with next-token prediction. The dominant architecture for modern large language models.',
          items: [
            { label: 'Models', detail: 'GPT series, Claude, Llama, Mistral, Falcon' },
            { label: 'Attention', detail: 'Unidirectional (causal mask)' },
            { label: 'Best for', detail: 'Text generation, chat, code, reasoning' },
          ],
        },
        {
          heading: 'Encoder-Decoder',
          badge: { text: 'T5', color: 'warm' },
          body: 'Full architecture with cross-attention bridge. Text-to-text framing — any task expressed as input text to output text. Best for structured sequence-to-sequence tasks.',
          items: [
            { label: 'Models', detail: 'T5, BART, mBART, Flan-T5' },
            { label: 'Attention', detail: 'Mixed (bidirectional encoder + causal decoder)' },
            { label: 'Best for', detail: 'Translation, summarization, structured generation' },
          ],
        },
      ],
    },
    {
      heading: 'Efficiency Improvements',
      body: 'Modern production models use several techniques to manage the O(n^2) attention cost and the memory demands of long-context inference.',
      items: [
        { label: 'FlashAttention', detail: 'IO-aware tiling in GPU SRAM — exact same result, 2-4x faster, O(n) memory instead of O(n^2)' },
        { label: 'Grouped-Query Attention (GQA)', detail: 'Share K/V projections across groups of heads — reduces KV cache size by 4-8x' },
        { label: 'KV Cache', detail: 'Store previously computed K/V tensors during autoregressive generation — each step costs O(n) instead of O(n^2)' },
        { label: 'Sparse Attention', detail: 'Restrict attention to local windows + global tokens (Longformer, BigBird) — O(n) complexity' },
      ],
    },
  ],
}

// --- Scaling & Efficiency (content) ---

const scalingEfficiencyDrilldown: DrilldownDef = {
  type: 'content',
  id: 'scaling-efficiency',
  title: 'Scaling Laws & Efficiency',
  subtitle: 'Performance scales predictably with compute, data, and parameters',
  sections: [
    {
      heading: 'Chinchilla Scaling Laws',
      body: 'Hoffmann et al. (2022) established that for a given compute budget C, optimal allocation is roughly: model size N proportional to sqrt(C), training tokens D proportional to sqrt(C). The practical rule: train on ~20x as many tokens as the model has parameters.',
      items: [
        { label: 'GPT-3 (2020)', detail: '175B params, 300B tokens — significantly undertrained' },
        { label: 'Chinchilla (2022)', detail: '70B params, 1.4T tokens — same compute, better performance' },
        { label: 'Llama 2 (2023)', detail: '7-70B params, 2T tokens — follows Chinchilla-optimal ratios' },
      ],
    },
    {
      heading: 'Neural Scaling Laws',
      body: 'Performance (measured by loss) follows a power law: L(N) is proportional to N^(-alpha). The exponents are approximately 0.07-0.095. These power laws hold across many orders of magnitude — no plateau observed to date.',
    },
    {
      heading: 'Emergent Capabilities',
      items: [
        { label: 'Few-shot learning', detail: 'Appears around ~10B parameters' },
        { label: 'Chain-of-thought reasoning', detail: 'Appears around ~100B parameters' },
        { label: 'Instruction following', detail: 'Enhanced by RLHF at any scale' },
        { label: 'Multi-step arithmetic', detail: 'Appears around ~540B parameters (without chain-of-thought)' },
      ],
      note: {
        title: 'Emergence debate',
        body: 'Some researchers argue emergence is an artifact of discontinuous evaluation metrics rather than a true phase transition. The capabilities may improve gradually but cross a threshold of usefulness at certain scales.',
      },
    },
  ],
}

// --- Beyond NLP (content) ---

const beyondNlpDrilldown: DrilldownDef = {
  type: 'content',
  id: 'beyond-nlp',
  title: 'Applications Beyond Language',
  subtitle: 'The Transformer as a universal sequence model',
  sections: [
    {
      columns: [
        {
          heading: 'Vision (ViT)',
          badge: { text: 'Images', color: 'mist' },
          body: 'Images split into 16x16 pixel patches, each flattened and treated as a token. A class token is prepended. Standard encoder applied directly. Matches or exceeds CNN performance at scale.',
          items: [
            { label: 'Input', detail: '224x224 image -> 196 patches + 1 class token' },
            { label: 'Models', detail: 'ViT, CLIP, DINO, SAM' },
          ],
        },
        {
          heading: 'Biology (AlphaFold)',
          badge: { text: 'Proteins', color: 'sage' },
          body: 'AlphaFold 2 uses a Transformer variant (Evoformer) to process multiple sequence alignments. Attention learns which residue pairs interact — predicting 3D protein structure from sequence alone.',
          items: [
            { label: 'Input', detail: 'Amino acid sequences + evolutionary alignments' },
            { label: 'Output', detail: '3D atomic coordinates' },
          ],
        },
      ],
    },
    {
      columns: [
        {
          heading: 'Code',
          badge: { text: 'Programming', color: 'slate' },
          body: 'Code tokenized like text. Long-range dependency modeling suits function calls, variable references, and control flow spanning hundreds of tokens.',
          items: [
            { label: 'Models', detail: 'Codex, GitHub Copilot, AlphaCode, Claude' },
          ],
        },
        {
          heading: 'Multimodal',
          badge: { text: 'Cross-domain', color: 'warm' },
          body: 'Different modalities converted to token sequences and processed jointly. Images as visual tokens, text as word tokens, audio as spectrogram patches. Attention naturally handles cross-modal relationships.',
          items: [
            { label: 'Models', detail: 'CLIP, GPT-4V, Gemini, Flamingo' },
          ],
        },
      ],
    },
    {
      heading: 'Other Domains',
      items: [
        { label: 'Audio (Whisper)', detail: 'Mel spectrogram patches -> transcript' },
        { label: 'Video (Sora)', detail: 'Spacetime patches -> generated video frames' },
        { label: 'Molecules (ChemBERTa)', detail: 'SMILES characters -> molecular properties' },
        { label: 'Game playing (Decision Transformer)', detail: 'States + actions + returns -> next action' },
      ],
    },
  ],
}

export const drilldowns: DrilldownDef[] = [
  attentionMathDrilldown,
  encoderLayersDrilldown,
  decoderInternalsDrilldown,
  maskingDetailDrilldown,
  outputSamplingDrilldown,
  variantsDetailDrilldown,
  scalingEfficiencyDrilldown,
  beyondNlpDrilldown,
]
