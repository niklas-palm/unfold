import type { DiagramSlide, SlideDef } from 'unfold-ai'
import { carry } from 'unfold-ai'

// ============================================================
// Layout Strategy
//
// Pre-compact (slides 1-3): large nodes, establishing "why"
//   Slide 1: [RNN] -> [Output] (the problem)
//   Slide 2: [Transformer] (the solution)
//   Slide 3: [Input] -> [Encoder] -> [Decoder] -> [Output]
//
// Post-compact (slides 4+): h:48 nodes, four rows, 2 columns
//   Row 0 (y:50):  [Input x:50]       [Tokenizer x:260]
//   Row 1 (y:150): [Embed x:50]       [Pos Enc x:270]
//   Row 2 (y:290): [Encoder x:50]     [Decoder x:280]
//   Row 3 (y:410): [CrossAttn x:50]   [Output Head x:280]
//
// Annotations at x:500+. Attention, FFN, Add&Norm shown
// via focus expand on Encoder/Decoder — not permanent nodes.
// ============================================================

// --- Slide 0: Title ---
const slide0: SlideDef = {
  type: 'title',
  eyebrow: 'SYSTEM READY',
  title: 'How Transformers Work',
  subtitle: 'From attention to architecture — the neural network behind modern AI',
  hint: 'Use arrow keys to navigate',
  notes: 'A technical walkthrough of the Transformer architecture — from the original 2017 paper through modern LLMs like GPT, Claude, and Llama.',
}

// --- Slide 1: The sequential bottleneck ---
const slide1: DiagramSlide = {
  type: 'diagram',
  heading: 'The sequential bottleneck',
  subheading: 'RNNs process tokens one at a time',
  nodes: [
    { id: 'rnn', label: 'RNN / LSTM', sub: 'Sequential processing', x: 100, y: 170, w: 200, h: 75, color: 'warm' },
    { id: 'output-old', label: 'Output', sub: 'One token at a time', x: 450, y: 170, w: 180, h: 75, color: 'warm' },
  ],
  arrows: [
    { from: 'rnn', to: 'output-old', label: 'sequential' },
  ],
  annotations: [
    {
      type: 'card-list', x: 100, y: 300, direction: 'row',
      cards: [
        { label: 'Sequential', detail: '1000 tokens = 1000 steps' },
        { label: 'Vanishing gradients', detail: 'Long-range signals fade' },
        { label: 'Fixed context', detail: 'Compressed into one vector' },
      ],
    },
  ],
  notes: 'Before Transformers, RNNs and LSTMs were the standard for sequential data. They processed tokens one at a time, creating bottlenecks in parallelism and long-range learning.',
}

// --- Slide 2: Attention replaces recurrence ---
const slide2 = carry(slide1, {
  heading: 'Attention replaces recurrence',
  subheading: 'All tokens processed simultaneously',
  removeNodes: ['rnn', 'output-old'],
  nodes: [
    { id: 'transformer', label: 'Transformer', sub: 'Parallel attention', x: 200, y: 150, w: 240, h: 80, color: 'sage' },
  ],
  arrows: [],
  annotations: [
    {
      type: 'card-list', x: 100, y: 290, direction: 'row',
      cards: [
        { label: 'Parallel', detail: 'All tokens at once' },
        { label: 'Direct interaction', detail: 'Any token to any token' },
        { label: 'Scalable', detail: 'More params = better' },
      ],
    },
  ],
  notes: 'The Transformer (Vaswani et al., 2017) replaced recurrence with self-attention — every token can directly attend to every other token, enabling full parallelism and long-range dependencies.',
})

// --- Slide 3: The encoder-decoder pipeline ---
const slide3 = carry(slide2, {
  heading: 'The encoder-decoder pipeline',
  subheading: 'The original Transformer architecture (2017)',
  removeNodes: ['transformer'],
  nodes: [
    { id: 'input', label: 'Input Text', x: 30, y: 170, w: 150, h: 65, color: 'sea' },
    { id: 'encoder', label: 'Encoder', sub: 'N layers', x: 240, y: 170, w: 180, h: 65, color: 'sage' },
    { id: 'decoder', label: 'Decoder', sub: 'N layers', x: 480, y: 170, w: 180, h: 65, color: 'slate' },
    { id: 'output-head', label: 'Output', sub: 'Vocabulary probs', x: 710, y: 170, w: 150, h: 65, color: 'clay' },
  ],
  arrows: [
    { from: 'input', to: 'encoder', label: 'tokens' },
    { from: 'encoder', to: 'decoder', label: 'context' },
    { from: 'decoder', to: 'output-head', label: 'logits' },
  ],
  annotations: [
    {
      type: 'text-block', x: 200, y: 290, w: 500, align: 'left',
      text: 'The encoder reads the full input and produces **contextualized representations**. The decoder generates output tokens one at a time, attending to both its own output and the encoder\'s representations.',
    },
  ],
  notes: 'The original Transformer is an encoder-decoder model for sequence-to-sequence tasks like translation. Modern LLMs use either the encoder alone (BERT) or the decoder alone (GPT, Claude, Llama).',
})

// --- Slide 4: COMPACT + From text to tokens (Sections 3, 4, 5) ---
const slide4 = carry(slide3, {
  heading: 'From text to tokens',
  subheading: 'Tokenization, embeddings, and positional encoding',
  nodes: [
    // Row 0 (y:50) — Input pipeline
    { id: 'input', label: 'Input Text', sub: '', x: 50, y: 50, w: 120, h: 48, color: 'sea' },
    { id: 'tokenizer', label: 'Tokenizer', sub: 'BPE / WordPiece', x: 260, y: 50, w: 140, h: 48, color: 'sea' },
    // Row 1 (y:150) — Embeddings
    { id: 'embed', label: 'Embeddings', sub: 'd_model = 512', x: 50, y: 150, w: 140, h: 48, color: 'sea' },
    { id: 'posenc', label: 'Positional Enc', sub: 'sinusoidal / RoPE', x: 270, y: 150, w: 145, h: 48, color: 'sky' },
    // Row 2 (y:290) — Encoder/Decoder
    { id: 'encoder', label: 'Encoder', sub: 'N layers', x: 50, y: 290, w: 155, h: 48, color: 'sage' },
    { id: 'decoder', label: 'Decoder', sub: 'N layers', x: 280, y: 290, w: 155, h: 48, color: 'slate' },
    // Row 3 (y:410) — Cross-Attention / Output
    { id: 'output-head', label: 'Output Head', sub: '', x: 280, y: 410, w: 155, h: 48, color: 'clay' },
  ],
  arrows: [
    { from: 'input', to: 'tokenizer', label: 'text' },
    { from: 'tokenizer', to: 'embed', label: 'IDs' },
    // U-shaped arrow: PosEnc adds to Embed (same row, via waypoint below)
    {
      from: { id: 'posenc', side: 'bottom' },
      to: { id: 'embed', side: 'bottom' },
      via: [{ x: 342, y: 225 }, { x: 120, y: 225 }],
      label: '+ add',
    },
  ],
  regions: [],
  annotations: [
    {
      type: 'chip-list', x: 500, y: 15, color: 'sea',
      chips: ['BPE', 'WordPiece', 'SentencePiece', 'Tiktoken'],
    },
    {
      type: 'text-block', x: 500, y: 50, w: 370,
      text: 'Raw text is split into **subword tokens**, converted to integer IDs, then looked up in a learned embedding table (vocab_size x d_model). **Positional encodings** are added to inject sequence order.',
    },
  ],
  notes: 'Before any neural processing, text must be tokenized into subwords, embedded as dense vectors, and augmented with positional information. The embedding table and positional encodings together form the input to the first encoder layer.',
})

// --- Slide 5: Self-Attention explained (Sections 6, 7) ---
const slide5 = carry(slide4, {
  heading: 'Self-Attention',
  subheading: 'Every token attends to every other token',
  arrows: [
    { from: 'input', to: 'tokenizer', label: 'text' },
    { from: 'tokenizer', to: 'embed', label: 'IDs' },
    {
      from: { id: 'posenc', side: 'bottom' },
      to: { id: 'embed', side: 'bottom' },
      via: [{ x: 342, y: 225 }, { x: 120, y: 225 }],
      label: '+ add',
    },
    { from: 'embed', to: 'encoder', label: 'vectors' },
  ],
  annotations: [
    {
      type: 'card-list', x: 500, y: 15, direction: 'column',
      cards: [
        { label: 'Query (Q)', detail: '"What am I looking for?"' },
        { label: 'Key (K)', detail: '"What do I contain?"' },
        { label: 'Value (V)', detail: '"What info do I carry?"' },
      ],
    },
    {
      type: 'text-block', x: 500, y: 195, w: 370,
      text: 'Each token produces Q, K, V vectors via learned projections. Attention score = **dot product** of Q_i and K_j. Scaled by 1/sqrt(d_k) to prevent softmax saturation. **O(n^2)** in sequence length.',
      onClick: 'attention-math',
    },
  ],
  notes: 'Self-attention is the core mechanism. For each token, three vectors are computed — Query, Key, and Value. The dot product of Query and Key determines how much attention to pay; the Value carries the actual information.',
})

// --- Slide 6: Multi-Head Attention + FFN (Sections 8, 9, 10) ---
const slide6 = carry(slide5, {
  heading: 'Multi-Head Attention & FFN',
  subheading: 'Parallel heads + expand-contract MLP per layer',
  annotations: [
    {
      type: 'card-list', x: 500, y: 15, direction: 'column',
      cards: [
        { label: 'Head 1', detail: 'Syntactic dependencies' },
        { label: 'Head 2', detail: 'Coreference resolution' },
        { label: 'Head 3', detail: 'Local context window' },
        { label: 'Head 4', detail: 'Semantic similarity' },
      ],
    },
    {
      type: 'text-block', x: 500, y: 230, w: 370,
      text: 'Multi-head attention runs **h parallel heads** (d_k = d_model/h each). Results are concatenated and projected. The **Feed-Forward Network** (expand 4x, then contract) processes each token independently. **Residual connections** + **LayerNorm** wrap each sublayer.',
    },
    {
      type: 'chip-list', x: 500, y: 380, color: 'sand',
      chips: ['ReLU', 'GeLU', 'SwiGLU'],
    },
  ],
  notes: 'Multi-head attention runs h parallel attention operations. The FFN is a two-layer MLP (expand to 4x, apply non-linearity, contract back). Residual connections and layer normalization make deep stacking possible.',
})

// --- Slide 7: Inside the Encoder (focus expand, Section 11) ---
const slide7 = carry(slide6, {
  heading: 'Inside the Encoder',
  subheading: 'N identical layers stacked — each refines representations',
  focus: {
    nodeId: 'encoder',
    x: 200, y: 80,
    w: 400, h: 340,
    items: [
      { label: 'Multi-Head Self-Attention', sub: 'All tokens attend to all tokens', color: 'mist', onClick: 'attention-math' },
      { label: 'Add & LayerNorm', sub: 'Residual connection + normalization', color: 'stone' },
      { label: 'Feed-Forward Network', sub: '512 -> 2048 -> 512 (expand-contract)', color: 'sand' },
      { label: 'Add & LayerNorm', sub: 'Second residual + normalization', color: 'stone' },
    ],
    footnote: 'x N layers (N=6 in original) — click for layer-by-layer view',
    footnoteOnClick: 'encoder-layers',
  },
  annotations: [],
  notes: 'Each encoder layer has two sublayers: multi-head self-attention and a position-wise feed-forward network, each wrapped in a residual connection and layer normalization. The original paper stacks 6 identical layers; modern models use 24, 32, or even 96.',
})

// --- Slide 8: The Decoder + Cross-Attention (Sections 12, 13) — focus collapses ---
const slide8 = carry(slide7, {
  heading: 'The Decoder',
  subheading: 'Generates output tokens autoregressively',
  nodes: [
    { id: 'crossattn', label: 'Cross-Attention', sub: 'Encoder -> Decoder', x: 50, y: 410, w: 155, h: 48, color: 'mist' },
  ],
  arrows: [
    { from: 'input', to: 'tokenizer', label: 'text' },
    { from: 'tokenizer', to: 'embed', label: 'IDs' },
    {
      from: { id: 'posenc', side: 'bottom' },
      to: { id: 'embed', side: 'bottom' },
      via: [{ x: 342, y: 225 }, { x: 120, y: 225 }],
    },
    { from: 'embed', to: 'encoder' },
    { from: 'encoder', to: 'crossattn', label: 'K, V' },
    { from: 'crossattn', to: 'decoder' },
    { from: 'decoder', to: 'output-head' },
  ],
  annotations: [
    {
      type: 'text-block', x: 500, y: 230, w: 370,
      text: 'The decoder has **three sublayers** per layer: masked self-attention, cross-attention, and FFN. **Cross-attention** lets each decoder position select which encoder outputs to attend to — Q from decoder, K/V from encoder.',
      onClick: 'decoder-internals',
    },
  ],
  notes: 'The decoder generates tokens one at a time. Cross-attention bridges encoder and decoder — queries come from the decoder, while keys and values come from the encoder output.',
})

// --- Slide 9: Inside the Decoder (focus expand) ---
const slide9 = carry(slide8, {
  heading: 'Inside the Decoder',
  subheading: 'Three sublayers per layer (vs two in encoder)',
  focus: {
    nodeId: 'decoder',
    x: 200, y: 70,
    w: 400, h: 400,
    items: [
      { label: 'Masked Self-Attention', sub: 'Causal mask: token i sees only tokens <= i', color: 'slate', onClick: 'masking-detail' },
      { label: 'Add & LayerNorm', sub: 'First residual connection', color: 'stone' },
      { label: 'Cross-Attention', sub: 'Q from decoder, K/V from encoder output', color: 'mist' },
      { label: 'Add & LayerNorm', sub: 'Second residual connection', color: 'stone' },
      { label: 'Feed-Forward Network', sub: 'Same expand-contract pattern as encoder', color: 'sand' },
      { label: 'Add & LayerNorm', sub: 'Third residual connection', color: 'stone' },
    ],
    footnote: 'x N layers — generates one token at a time',
  },
  annotations: [],
  notes: 'The decoder layer has three sublayers instead of two: masked self-attention (can only see past tokens), cross-attention (attends to encoder output), and the FFN. Each is wrapped in residual + LayerNorm.',
})

// --- Slide 10: Output Head + Masking (Sections 14, 15) — focus collapses ---
const slide10 = carry(slide9, {
  heading: 'From representation to prediction',
  subheading: 'Linear projection + softmax over the full vocabulary',
  arrows: [
    { from: 'input', to: 'tokenizer' },
    { from: 'tokenizer', to: 'embed' },
    {
      from: { id: 'posenc', side: 'bottom' },
      to: { id: 'embed', side: 'bottom' },
      via: [{ x: 342, y: 225 }, { x: 120, y: 225 }],
    },
    { from: 'embed', to: 'encoder' },
    { from: 'encoder', to: 'crossattn', label: 'K, V' },
    { from: 'crossattn', to: 'decoder' },
    { from: 'decoder', to: 'output-head', label: 'logits' },
  ],
  annotations: [
    {
      type: 'numbered-list', x: 500, y: 15, color: 'clay',
      items: [
        { title: 'Decoder output', detail: '[n x d_model]' },
        { title: 'Linear projection', detail: '[d_model -> vocab_size]' },
        { title: 'Softmax', detail: 'Probability distribution' },
        { title: 'Sample next token', detail: 'Greedy, top-k, top-p, beam' },
      ],
    },
    {
      type: 'card-list', x: 500, y: 230, direction: 'column',
      cards: [
        { label: 'Causal Mask', detail: 'Lower triangular — prevents seeing future tokens', onClick: 'masking-detail' },
        { label: 'Padding Mask', detail: 'Prevents attending to [PAD] positions' },
      ],
    },
    {
      type: 'text-block', x: 500, y: 380, w: 370,
      text: 'Explore **sampling strategies**',
      onClick: 'output-sampling',
    },
  ],
  notes: 'The output head converts the decoder\'s final hidden state into a probability distribution over the entire vocabulary via a linear projection and softmax. Two types of masks control attention: causal (prevents seeing future) and padding (ignores [PAD] tokens).',
})

// --- Slide 11: Training & Variants (Sections 16, 17) ---
const slide11 = carry(slide10, {
  heading: 'Training objectives & variants',
  subheading: 'Same architecture, different training signals',
  annotations: [
    {
      type: 'card-list', x: 500, y: 15, direction: 'column',
      cards: [
        { label: 'CLM (GPT, Claude)', detail: 'Predict next token — decoder only', borderColor: 'slate' },
        { label: 'MLM (BERT)', detail: 'Predict masked tokens — encoder only', borderColor: 'sage' },
        { label: 'Seq2Seq (T5)', detail: 'Full encoder-decoder', borderColor: 'warm' },
      ],
    },
    {
      type: 'chip-list', x: 500, y: 225, color: 'warm',
      chips: ['GPT', 'Claude', 'Llama', 'BERT', 'T5', 'Mistral'],
    },
    {
      type: 'text-block', x: 500, y: 265, w: 370,
      text: 'View **architectural variants** in detail',
      onClick: 'variants-detail',
    },
  ],
  notes: 'The same Transformer architecture supports three training paradigms: causal language modeling (decoder-only, used by GPT/Claude/Llama), masked language modeling (encoder-only, used by BERT), and sequence-to-sequence (encoder-decoder, used by T5).',
})

// --- Slide 12: The complete picture ---
const slide12 = carry(slide11, {
  heading: 'The complete architecture',
  subheading: 'All components working together',
  regions: [
    { id: 'input-pipeline', label: 'INPUT PROCESSING', contains: ['input', 'tokenizer', 'embed', 'posenc'], padding: 24 },
    { id: 'enc-dec', label: 'ENCODER-DECODER', contains: ['encoder', 'decoder', 'crossattn'], padding: 24 },
  ],
  annotations: [
    {
      type: 'text-block', x: 500, y: 15, w: 370,
      text: 'Explore **attention math**',
      onClick: 'attention-math',
    },
    {
      type: 'text-block', x: 500, y: 65, w: 370,
      text: 'View **scaling laws & efficiency**',
      onClick: 'scaling-efficiency',
    },
    {
      type: 'text-block', x: 500, y: 115, w: 370,
      text: 'See **applications beyond language**',
      onClick: 'beyond-nlp',
    },
  ],
  notes: 'The full Transformer data path: raw text is tokenized, embedded, and positionally encoded. It flows through self-attention, multi-head concatenation, feed-forward processing, and normalization within each encoder/decoder layer. The output head converts the final representation into token probabilities.',
})

// --- Slide 13: Key Takeaways ---
const slide13: SlideDef = {
  type: 'list',
  eyebrow: 'SUMMARY',
  heading: 'Key Takeaways',
  items: [
    { title: 'Attention is all you need', desc: 'Self-attention replaces recurrence — any token directly attends to any other, enabling parallelism and long-range dependencies' },
    { title: 'Query, Key, Value', desc: 'Queries search for relevant info, Keys advertise content, Values carry the payload — multi-head attention runs this in parallel' },
    { title: 'Three architectural variants', desc: 'Encoder-only (BERT), decoder-only (GPT, Claude, Llama), and encoder-decoder (T5) — same building blocks, different configurations' },
    { title: 'Residuals enable depth', desc: 'Skip connections + LayerNorm make it possible to stack 6, 24, or 96+ layers without gradient collapse' },
    { title: 'Predictable scaling', desc: 'Loss follows power laws with compute, data, and parameters — more resources reliably produce better models' },
    { title: 'Universally applicable', desc: 'The same architecture powers language, vision (ViT), protein folding (AlphaFold), code generation, and multimodal systems' },
  ],
  notes: 'The Transformer is arguably the most important neural network architecture in the history of AI — its core insight that attention over learned representations is sufficient to model sequences has proven almost universally applicable.',
}

export const slides: SlideDef[] = [
  slide0, slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8,
  slide9, slide10, slide11, slide12, slide13,
]
