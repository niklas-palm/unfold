# How Transformers Work — Technical Reference

> The Transformer is a neural network architecture introduced in 2017 by Vaswani et al. in the paper *"Attention Is All You Need."* It replaced the dominant recurrent neural network (RNN) paradigm with a mechanism built entirely on attention — allowing the model to process all tokens in a sequence simultaneously rather than one at a time, and to relate any two positions directly regardless of their distance. Originally designed for machine translation, the Transformer became the foundational architecture for nearly all of modern AI: large language models (GPT, Claude, Llama), vision models (ViT), multimodal systems (DALL-E, Sora), and protein folding models (AlphaFold). Its core insight — that attention over a learned representation is all you need to model sequences — proved almost universally applicable.

**Version:** 1.0
**Date:** 2026-03-31

---

## Table of Contents

1. [Why Transformers Exist](#1-why-transformers-exist)
2. [Architecture Overview](#2-architecture-overview)
3. [Tokenization](#3-tokenization)
4. [Embeddings](#4-embeddings)
5. [Positional Encoding](#5-positional-encoding)
6. [Self-Attention](#6-self-attention)
7. [Scaled Dot-Product Attention](#7-scaled-dot-product-attention)
8. [Multi-Head Attention](#8-multi-head-attention)
9. [The Feed-Forward Network](#9-the-feed-forward-network)
10. [Residual Connections and Layer Normalization](#10-residual-connections-and-layer-normalization)
11. [The Encoder](#11-the-encoder)
12. [The Decoder](#12-the-decoder)
13. [Cross-Attention](#13-cross-attention)
14. [Masking](#14-masking)
15. [The Output Head](#15-the-output-head)
16. [Training Objectives](#16-training-objectives)
17. [Architectural Variants](#17-architectural-variants)
18. [Efficiency Improvements](#18-efficiency-improvements)
19. [Scaling Laws](#19-scaling-laws)
20. [Applications Beyond Language](#20-applications-beyond-language)
- [Appendix A: Technical Constants](#appendix-a-technical-constants)
- [Appendix B: Key Equations Reference](#appendix-b-key-equations-reference)

---

## 1. Why Transformers Exist

Before Transformers, the standard architecture for sequential data was the **Recurrent Neural Network (RNN)** and its improved variant, the **Long Short-Term Memory (LSTM)**. These models processed sequences token by token, passing a hidden state forward through each step.

**Problems with RNNs:**

| Problem | Description |
|---------|-------------|
| **Sequential bottleneck** | Tokens must be processed one at a time — impossible to fully parallelize across a sequence. A 1,000-token input requires 1,000 sequential steps. |
| **Vanishing gradients** | Signals from early tokens fade through many multiplicative steps during backpropagation. Long-range dependencies are hard to learn. |
| **Limited context** | The entire history of a sequence must be compressed into a fixed-size hidden state vector — a severe information bottleneck. |
| **Fixed receptive field** | CNNs, an alternative, can only attend to a fixed local window without deep stacking. |

**What Transformers provide:**

| Capability | How |
|-----------|-----|
| **Parallelism** | All tokens are processed simultaneously — training scales with hardware |
| **Direct token interaction** | Any two tokens can directly attend to each other regardless of distance |
| **Flexible context** | The context window is not a fixed vector but a full set of token representations |
| **Scalability** | Model quality improves predictably with more parameters and more data |

The cost: Transformer self-attention has **O(n²)** complexity in sequence length — every token must attend to every other token. For a sequence of length n, this means n² attention computations. This is manageable for thousands of tokens but expensive at hundreds of thousands, motivating the efficiency work described in Section 18.

---

## 2. Architecture Overview

The original Transformer is an **encoder-decoder** architecture designed for sequence-to-sequence tasks (e.g., translation). Modern language models use either the encoder alone (BERT-style) or the decoder alone (GPT-style).

### 2.1 High-Level Architecture

```
Input Sequence: "The cat sat on the mat"
        │
        ▼
┌─────────────────────────────────────────────┐
│              ENCODER STACK                   │
│                                             │
│  Input Tokens → Embeddings + Positional     │
│  Encoding → N × Encoder Layers              │
│                                             │
│  Each Encoder Layer:                        │
│    Multi-Head Self-Attention                │
│    + Add & LayerNorm                        │
│    Feed-Forward Network                     │
│    + Add & LayerNorm                        │
│                                             │
└─────────────────┬───────────────────────────┘
                  │  Encoder Output
                  │  (contextualized representations)
                  ▼
┌─────────────────────────────────────────────┐
│              DECODER STACK                   │
│                                             │
│  Output Tokens → Embeddings + Positional    │
│  Encoding → N × Decoder Layers              │
│                                             │
│  Each Decoder Layer:                        │
│    Masked Multi-Head Self-Attention         │
│    + Add & LayerNorm                        │
│    Cross-Attention (queries from decoder,   │
│      keys/values from encoder output)       │
│    + Add & LayerNorm                        │
│    Feed-Forward Network                     │
│    + Add & LayerNorm                        │
│                                             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         Linear Projection
                  │
                  ▼
              Softmax
                  │
                  ▼
     Probability over Vocabulary
     → Output token: "Die Katze..."
```

### 2.2 Original Paper Hyperparameters

The original "Attention Is All You Need" model (2017) used:

| Hyperparameter | Base Model | Large Model |
|----------------|-----------|-------------|
| Encoder layers (N) | 6 | 6 |
| Decoder layers (N) | 6 | 6 |
| Model dimension (d_model) | 512 | 1024 |
| Feed-forward dimension (d_ff) | 2048 | 4096 |
| Attention heads (h) | 8 | 16 |
| Head dimension (d_k = d_v) | 64 | 64 |
| Dropout | 0.1 | 0.3 |
| Parameters | ~65M | ~213M |

---

## 3. Tokenization

Before any neural processing occurs, raw text must be converted to discrete integer tokens. This is not part of the Transformer architecture itself but is essential context.

### 3.1 What a Token Is

A token is the basic unit the model operates on. It may be a word, a subword, a character, or a byte — depending on the tokenizer. Most modern models use **subword tokenization**, which balances vocabulary size against the ability to represent rare and novel words.

```
Input:  "unbelievable"
Tokens: ["un", "believ", "able"]  ← subword split
IDs:    [4892, 7163, 1382]        ← integer indices into vocabulary
```

### 3.2 Tokenization Algorithms

| Algorithm | Description | Used By |
|-----------|-------------|---------|
| **Byte-Pair Encoding (BPE)** | Iteratively merges the most frequent adjacent pairs of bytes/characters | GPT series, Llama |
| **WordPiece** | Similar to BPE but maximizes likelihood of the training corpus | BERT |
| **SentencePiece** | Language-agnostic, treats the input as a raw byte stream | T5, Gemma |
| **Tiktoken** | Optimized BPE implementation with deterministic byte fallback | GPT-4, Claude |

### 3.3 Vocabulary Size

| Model | Vocabulary Size |
|-------|----------------|
| BERT | 30,522 |
| GPT-2 | 50,257 |
| GPT-4 / Claude | ~100,000 |
| Llama 3 | 128,000 |

Larger vocabularies mean shorter token sequences for the same text (more efficient) but require larger embedding tables. The vocabulary size directly sets the dimensions of the embedding matrix and the final output projection.

---

## 4. Embeddings

After tokenization, each integer token ID is converted into a dense vector — a high-dimensional floating-point representation that the model can learn to use.

### 4.1 The Embedding Table

The embedding table is a learned matrix of shape **(vocab_size × d_model)**. Each row corresponds to one token in the vocabulary. Looking up a token's embedding is a simple matrix row selection — functionally equivalent to multiplying a one-hot vector by the embedding matrix.

```
Vocabulary: 50,000 tokens
d_model: 512

Embedding matrix: [50,000 × 512]
                   ↑           ↑
            one row per     each token is a
             token          512-dimensional vector
```

The embedding values are **learned during training** — they are initialized randomly and updated through backpropagation. After training, geometrically close vectors in this space tend to represent semantically related concepts.

### 4.2 Embedding Scale

In the original Transformer, embedding weights are multiplied by **√d_model** before adding positional encodings. This prevents the positional encoding signal from overwhelming the learned token representation when d_model is large — the embedding values are otherwise small relative to the sinusoidal positional values.

### 4.3 Weight Tying

Many models share the same weight matrix between the input embedding table and the final output projection (the un-embedding layer). This reduces parameters by d_model × vocab_size and has been found empirically to improve performance by ensuring the input and output spaces are aligned.

---

## 5. Positional Encoding

Self-attention is **permutation-invariant** — if you shuffle the tokens, the attention scores change (because different tokens are now next to different tokens), but the mechanism itself has no built-in notion of order. The sequence "cat sat the" is computed identically to "the cat sat" without positional information.

Positional encodings inject position information into the token representations before the first layer.

### 5.1 Sinusoidal Positional Encoding (Original)

The original paper uses fixed sinusoidal functions of different frequencies:

```
PE(pos, 2i)   = sin(pos / 10000^(2i / d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i / d_model))
```

Where `pos` is the token's position in the sequence, and `i` is the dimension index. Even dimensions use sine, odd dimensions use cosine. Each dimension oscillates at a different frequency — lower dimensions change rapidly with position, higher dimensions change slowly.

**Resulting pattern for a 512-dimensional model:**

```
Position 0:  [sin(0), cos(0), sin(0), cos(0), ...]
Position 1:  [sin(1), cos(1), sin(0.001), cos(0.001), ...]
Position 2:  [sin(2), cos(2), sin(0.002), cos(0.002), ...]
...
```

The key property: the encoding for position `pos + k` can always be expressed as a linear function of the encoding for position `pos`. This lets the model learn to attend based on relative position via linear attention weight computations.

### 5.2 Learned Positional Embeddings

An alternative: treat positions like tokens — create a separate embedding table of shape **(max_sequence_length × d_model)** and learn position representations from data. Used by BERT and GPT-2.

| Approach | Pros | Cons |
|----------|------|------|
| **Sinusoidal (fixed)** | No parameters; extrapolates to unseen lengths | No adaptation to data |
| **Learned absolute** | Adapts to training distribution | Cannot extrapolate beyond training length |
| **Relative (RPE)** | Captures relative distances; better extrapolation | More complex |
| **RoPE (Rotary)** | Elegant relative encoding via rotation; excellent extrapolation | Requires modified attention computation |
| **ALiBi** | Adds position bias directly to attention logits; strong extrapolation | Linear, not distance-adaptive |

**RoPE** (Rotary Position Embedding) is the dominant approach in modern models (Llama, Falcon, Mistral) because it enables significantly longer context windows than the model was trained on.

### 5.3 How Positional Encoding is Applied

The positional encoding vector is **added** element-wise to the token embedding vector. Both have dimension d_model. The result is passed as input to the first encoder (or decoder) layer.

```
Input to Layer 1 = TokenEmbedding(token_id) + PositionalEncoding(position)
                   [d_model]                   [d_model]
                              = [d_model]
```

---

## 6. Self-Attention

Self-attention is the core mechanism that allows every token to incorporate information from every other token in the sequence. It answers the question: *given this token, which other tokens are most relevant to understanding it in context?*

### 6.1 Intuition

Consider the sentence: **"The animal didn't cross the street because it was too tired."**

The word "it" could refer to "animal" or "street." Self-attention allows the model to look at all surrounding tokens and determine — based on learned patterns — that "it" refers to "animal." The representation of "it" is updated to include contextual information from "animal," "tired," and other relevant tokens.

### 6.2 Query, Key, and Value

Self-attention uses three learned linear projections of the same input:

| Vector | Intuition | Analogy |
|--------|-----------|---------|
| **Query (Q)** | "What am I looking for?" | A search query |
| **Key (K)** | "What do I contain?" | A document's index |
| **Value (V)** | "What information do I carry?" | The document's actual content |

For each token, the model produces a Query, a Key, and a Value vector by multiplying the token's representation by three separate learned weight matrices (W_Q, W_K, W_V).

```
For each token representation x (dimension: d_model):

Q = x · W_Q    (W_Q: d_model × d_k)
K = x · W_K    (W_K: d_model × d_k)
V = x · W_V    (W_V: d_model × d_v)
```

The attention score between token i and token j is computed as the dot product of Q_i and K_j — measuring how well token i's query "matches" token j's key. High scores mean token i should attend strongly to token j.

### 6.3 The Attention Operation

```
1. Compute all Q, K, V vectors (one per token)
         │
         ▼
2. Compute attention scores: score(i, j) = Q_i · K_j
   Result: an [n × n] matrix of raw scores
         │
         ▼
3. Scale by 1/√d_k
   (prevents dot products from growing too large in magnitude)
         │
         ▼
4. Apply softmax row-wise
   Each row sums to 1.0 — becomes a probability distribution
   over "which tokens to attend to"
         │
         ▼
5. Multiply by V matrix
   Each token's output = weighted sum of all Value vectors,
   where weights come from its attention distribution
         │
         ▼
6. Output: a new [n × d_v] matrix
   Each row is a contextually-enriched representation
   of one token — it now contains information from
   all tokens it attended to
```

---

## 7. Scaled Dot-Product Attention

The full mathematical operation packaged as a function:

```
Attention(Q, K, V) = softmax(QK^T / √d_k) · V
```

Where:
- Q is the query matrix: [n × d_k]
- K is the key matrix: [n × d_k]
- V is the value matrix: [n × d_v]
- QK^T produces an [n × n] attention weight matrix
- √d_k is the scaling factor

### 7.1 Why Scale by √d_k?

Without scaling, dot products grow proportionally to d_k. For large d_k, the scores become very large, pushing softmax into regions with near-zero gradients — the model stops learning. Dividing by √d_k keeps the dot products in a sensible range regardless of dimension.

**Example:** If d_k = 64, √d_k = 8. If d_k = 512, √d_k ≈ 22.6.

### 7.2 The Attention Matrix

The [n × n] attention matrix is the "attention map" — it shows how much each token (row) attends to every other token (column). After softmax, each row sums to 1.

```
Attention weights (4-token example):
              "cat"   "sat"   "the"   "mat"
"cat"      [  0.60    0.20    0.10    0.10  ]
"sat"      [  0.25    0.40    0.05    0.30  ]
"the"      [  0.10    0.05    0.70    0.15  ]
"mat"      [  0.10    0.30    0.15    0.45  ]
```

"cat" attends most strongly to itself (0.60) and "sat" (0.20). "the" mostly attends to itself (0.70), as a common function word.

### 7.3 Computational Complexity

| Operation | Complexity |
|-----------|-----------|
| QK^T (attention scores) | O(n² · d_k) |
| Softmax | O(n²) |
| Weighted sum with V | O(n² · d_v) |
| **Total** | **O(n² · d_model)** |

The quadratic n² term is the core bottleneck. Doubling sequence length quadruples attention computation. For context: GPT-4 has a context window of ~128K tokens; computing the full attention matrix at that length requires significant optimization.

---

## 8. Multi-Head Attention

A single attention operation computes one set of Q, K, V projections and produces one attention pattern. **Multi-head attention** runs the attention mechanism h times in parallel with different projections, then concatenates the results.

### 8.1 Why Multiple Heads?

Different heads can learn to attend to different kinds of relationships simultaneously:
- Head 1 might learn syntactic dependencies (subject-verb agreement)
- Head 2 might learn coreference (pronouns → antecedents)
- Head 3 might learn local context (adjacent tokens)
- Head 4 might learn semantic similarity

A single head averages over all these patterns and loses resolution. Multiple heads can specialize.

### 8.2 How Multi-Head Attention Works

```
Input: X  [n × d_model]
           │
           ├── Project to Q₁, K₁, V₁  (W_Q1, W_K1, W_V1)  → Attention Head 1
           ├── Project to Q₂, K₂, V₂  (W_Q2, W_K2, W_V2)  → Attention Head 2
           ├── ...
           └── Project to Q_h, K_h, V_h                    → Attention Head h
                    │
                    ▼
           Each head: Attention(Q_i, K_i, V_i)  →  output [n × d_v]
                    │
                    ▼
           Concatenate all h outputs           →  [n × (h · d_v)]
                    │
                    ▼
           Multiply by output weight W_O       →  [n × d_model]
```

### 8.3 Head Dimension

To keep the total computation cost comparable to single-head attention, each head operates in a smaller dimension:

```
d_k = d_v = d_model / h

Original paper: d_model=512, h=8 → d_k = d_v = 64
```

Each head's Q, K, V matrices are [d_model × d_k] = [512 × 64], rather than [512 × 512]. The total parameter count is similar to a single full-dimensional attention operation.

### 8.4 Full Multi-Head Attention Formula

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) · W_O

where head_i = Attention(Q · W_Qi, K · W_Ki, V · W_Vi)
```

Weight matrices per head: W_Qi, W_Ki ∈ ℝ^(d_model × d_k), W_Vi ∈ ℝ^(d_model × d_v)
Output weight: W_O ∈ ℝ^(h·d_v × d_model)

---

## 9. The Feed-Forward Network

After the attention sublayer, each position's representation passes through a **position-wise feed-forward network (FFN)** — a small two-layer multilayer perceptron applied independently and identically to every token position.

### 9.1 Structure

```
FFN(x) = max(0, x · W₁ + b₁) · W₂ + b₂

Input:       x  [d_model]  = [512]
             │
             ▼
Linear:      x · W₁  [d_model → d_ff]  = [512 → 2048]   (expansion)
             │
             ▼
Activation:  ReLU (or GeLU in modern models)
             │
             ▼
Linear:      · W₂   [d_ff → d_model]   = [2048 → 512]   (contraction)
             │
             ▼
Output:      [d_model]  = [512]
```

### 9.2 Purpose

Attention is fundamentally a **linear** operation (a weighted sum). The FFN introduces **non-linearity**, giving the model capacity to learn complex transformations that cannot be expressed as attention patterns alone. Think of attention as *gathering* the right information; the FFN then *processes* it.

### 9.3 Expansion Ratio

The inner dimension d_ff is typically **4× d_model**:

| d_model | d_ff | Ratio |
|---------|------|-------|
| 512 | 2048 | 4× |
| 768 | 3072 | 4× |
| 1024 | 4096 | 4× |
| 4096 | 16384 | 4× |

This expansion-then-contraction pattern allows the network to project into a higher-dimensional space where more complex patterns can be separated, then compress back to the residual stream dimension.

### 9.4 The FFN Contains Most Parameters

In a Transformer, the FFN layers typically contain **~⅔ of total parameters**, more than the attention layers. For a 6-layer model with d_model=512, d_ff=2048:
- Parameters per attention sublayer: ~4 × d_model² = ~1M
- Parameters per FFN sublayer: ~8 × d_model² = ~2M

### 9.5 Activation Functions

| Activation | Formula | Used In |
|-----------|---------|---------|
| **ReLU** | max(0, x) | Original Transformer |
| **GeLU** | x · Φ(x) | BERT, GPT-2, GPT-3 |
| **SwiGLU** | Swish(xW) · xV (gated variant) | LLaMA, PaLM, GPT-4 (likely) |

SwiGLU has become the de facto standard for large language models — it requires 3 weight matrices rather than 2, but achieves better performance at the same parameter count.

---

## 10. Residual Connections and Layer Normalization

Deep networks (many layers stacked) are notoriously difficult to train. Two structural techniques — residual connections and layer normalization — make deep Transformers trainable.

### 10.1 Residual Connections

A residual (skip) connection adds the input of a sublayer directly to its output:

```
Output = LayerNorm(x + Sublayer(x))
```

The input bypasses the sublayer and is added back at the end. This creates an "identity path" through the network — if a sublayer's contribution is not useful, it can learn to output near-zero and the input passes through unchanged.

**Why it helps:**
- **Vanishing gradients**: Gradients can flow directly backward through the identity path without degrading
- **Depth**: Allows training networks of 12, 24, 96, or more layers that would otherwise fail to converge

### 10.2 Layer Normalization

Layer normalization normalizes each token's representation vector independently, across the d_model dimension:

```
LayerNorm(x) = γ · (x - μ) / (σ + ε) + β

where:
  μ = mean of x's d_model values
  σ = standard deviation of x's d_model values
  γ, β = learned per-dimension scale and bias parameters
  ε = small constant for numerical stability (typically 1e-5 or 1e-6)
```

Unlike **batch normalization** (which normalizes across the batch dimension), layer normalization normalizes across the feature dimension for each individual token. This makes it independent of batch size — critical for variable-length sequences with padding.

### 10.3 Pre-Norm vs. Post-Norm

The original paper applies LayerNorm *after* the residual addition (**Post-Norm**):
```
x = LayerNorm(x + Sublayer(x))
```

Modern large models use **Pre-Norm** (applying LayerNorm *before* the sublayer):
```
x = x + Sublayer(LayerNorm(x))
```

Pre-Norm is more stable during training — gradients flow more cleanly through the unmodified residual path. Nearly all modern large language models (GPT-3, Llama, Claude) use Pre-Norm.

---

## 11. The Encoder

The encoder takes an input sequence and produces a set of **contextual representations** — one vector per input token — that capture meaning in context.

### 11.1 Encoder Layer

Each encoder layer applies two sublayers, each wrapped in a residual connection + LayerNorm:

```
EncoderLayer(x):
  1. x = LayerNorm(x + MultiHeadSelfAttention(x, x, x))
  2. x = LayerNorm(x + FFN(x))
  return x
```

The input to each attention call is the same x for queries, keys, and values — this is **self-attention**: every token attends to every other token in the same sequence.

### 11.2 Encoder Stack

N identical encoder layers are stacked. The original paper uses N=6. GPT-3 uses 96. Each layer refines the representations produced by the previous one:

```
Input embeddings + positional encodings
         │
         ▼
  Encoder Layer 1  (low-level: syntax, local patterns)
         │
         ▼
  Encoder Layer 2
         │
         ▼
  ...
         │
         ▼
  Encoder Layer N  (high-level: semantics, long-range relationships)
         │
         ▼
  Encoder Output  [n × d_model]
  (one contextual vector per input token)
```

### 11.3 What Each Layer Learns

Research into Transformer layer representations (probing studies) consistently finds:
- **Early layers**: Surface features — token identity, POS tags, local context
- **Middle layers**: Syntactic structure — parse trees, subject-object relationships
- **Later layers**: Semantic content — coreference, entity types, world knowledge

---

## 12. The Decoder

The decoder generates output sequences autoregressively — one token at a time. At each step, it takes the tokens generated so far and produces a probability distribution over the vocabulary for the next token.

### 12.1 Decoder Layer

Each decoder layer has **three** sublayers (versus two in the encoder):

```
DecoderLayer(x, encoder_output):
  1. x = LayerNorm(x + MaskedMultiHeadSelfAttention(x))
       (attends only to previous output tokens)
  2. x = LayerNorm(x + CrossAttention(x, encoder_output, encoder_output))
       (attends to the encoder's output)
  3. x = LayerNorm(x + FFN(x))
  return x
```

### 12.2 Autoregressive Generation

The decoder generates tokens one at a time. At each step:

```
Step 1: Input = [<start>]
        → Decoder generates: "Die"

Step 2: Input = [<start>, "Die"]
        → Decoder generates: "Katze"

Step 3: Input = [<start>, "Die", "Katze"]
        → Decoder generates: "saß"

...continues until <end> token is generated
```

During training, the full target sequence is provided at once (teacher forcing). The causal mask ensures that position i can only attend to positions ≤ i, preventing the model from "cheating" by looking at future tokens.

---

## 13. Cross-Attention

Cross-attention bridges the encoder and decoder. It allows the decoder to selectively pull information from the encoder's representations while generating each output token.

### 13.1 How Cross-Attention Differs from Self-Attention

In self-attention, Q, K, and V all come from the same sequence. In cross-attention, Q comes from the decoder, while K and V come from the encoder:

```
Q = decoder_hidden_state · W_Q    (what the decoder is looking for)
K = encoder_output · W_K          (what the encoder has)
V = encoder_output · W_V          (the encoder's actual content)

Attention(Q, K, V) →  decoder attends to encoder positions
```

The attention weight matrix is now **(decoder_length × encoder_length)** rather than square. Each decoder position can choose which encoder positions to attend to.

### 13.2 Intuition for Translation

When translating "The cat" → "Die Katze":
- When generating "Die" (the), the decoder's cross-attention attends strongly to "The" in the encoder
- When generating "Katze" (cat), cross-attention shifts to "cat" in the encoder

The attention pattern learns this alignment from data, without any explicit supervision about word order or correspondence.

---

## 14. Masking

Transformers use two types of masks to control which tokens can attend to which other tokens.

### 14.1 Padding Mask

Input sequences in a batch are padded to the same length with a special [PAD] token. The padding mask prevents tokens from attending to padding positions — those positions carry no information and attending to them would corrupt the representations.

```
Sequence: ["cat", "sat", "on", <PAD>, <PAD>]

Mask:
       "cat" "sat" "on"  <PAD> <PAD>
"cat"  [ 1     1     1     0     0  ]
"sat"  [ 1     1     1     0     0  ]
"on"   [ 1     1     1     0     0  ]
<PAD>  [ 0     0     0     0     0  ]
<PAD>  [ 0     0     0     0     0  ]
```

Where 0 means "do not attend here." In practice, masked positions are set to -∞ before softmax, resulting in near-zero attention weights.

### 14.2 Causal Mask (Look-Ahead Mask)

Used in the decoder's self-attention. Prevents position i from attending to positions j > i — tokens cannot see future tokens during generation.

```
Causal mask for 4-token sequence:

       t=1  t=2  t=3  t=4
t=1  [  1    0    0    0  ]   (can only see itself)
t=2  [  1    1    0    0  ]   (can see t=1 and t=2)
t=3  [  1    1    1    0  ]   (can see t=1, t=2, t=3)
t=4  [  1    1    1    1  ]   (can see all)
```

The upper triangle is masked to -∞. This makes the Transformer **causal** — each position's representation depends only on itself and earlier positions.

---

## 15. The Output Head

After the final decoder layer (or encoder layer for encoder-only models), a linear projection and softmax convert the model's internal representation into a probability distribution over the vocabulary.

### 15.1 Structure

```
Decoder Output: [n × d_model]
                      │
                      ▼
             Linear (un-embedding)
             [d_model → vocab_size]
                      │
                      ▼
                  Softmax
                      │
                      ▼
       Probability distribution: [vocab_size]
       P(next_token | context)
```

### 15.2 Sampling Strategies

At inference time, the probability distribution must be converted into a single token:

| Strategy | Mechanism | Effect |
|----------|-----------|--------|
| **Greedy** | Always pick argmax | Deterministic; often repetitive |
| **Temperature sampling** | Divide logits by T before softmax; T<1 = sharper, T>1 = flatter | Controls randomness |
| **Top-k sampling** | Sample only from k highest-probability tokens | Prevents unlikely token selection |
| **Top-p (nucleus) sampling** | Sample from smallest set whose cumulative probability ≥ p | Adaptive vocabulary truncation |
| **Beam search** | Maintain k "beams" (candidate sequences); pick highest overall probability | Best for deterministic tasks (translation) |

---

## 16. Training Objectives

The architecture is the same for many tasks — the training objective determines what the model learns.

### 16.1 Next Token Prediction (Causal Language Modeling)

Used by GPT-series models and most modern decoder-only LLMs. The model predicts the next token given all previous tokens.

```
Input:  ["The", "cat", "sat"]
Target: ["cat", "sat", "on"]    ← shifted by one position

Loss: cross-entropy averaged across all positions
```

The model sees every token in the training data as a supervision signal simultaneously, making this extremely data-efficient.

### 16.2 Masked Language Modeling (MLM)

Used by BERT. A random 15% of input tokens are masked ([MASK] token), and the model must predict the original token from context.

```
Input:  ["The", "[MASK]", "sat", "on", "the", "mat"]
Target:           "cat"
```

This is **bidirectional** — the model sees context from both left and right. BERT-style models excel at understanding tasks but cannot generate text autoregressively.

### 16.3 Sequence-to-Sequence (Encoder-Decoder)

Used by T5, BART. The encoder reads the full input, the decoder generates the output. Loss is computed on the decoder output only.

Applications: translation, summarization, question answering, code generation.

### 16.4 Loss Function

All variants use **cross-entropy loss**:

```
L = -Σ log P(correct_token | context)
```

The model is penalized proportionally to the negative log probability it assigned to the correct token. If the correct token received probability 0.01, the loss contribution is -log(0.01) = 4.6; if it received 0.99, the loss is -log(0.99) ≈ 0.01.

---

## 17. Architectural Variants

The encoder-decoder Transformer has spawned three major families, each suited to different tasks.

### 17.1 Encoder-Only (BERT-style)

| Property | Value |
|----------|-------|
| Architecture | Encoder stack only |
| Attention | Bidirectional (all tokens see all tokens) |
| Training | Masked language modeling + next sentence prediction |
| Best for | Classification, named entity recognition, semantic similarity, retrieval |
| Examples | BERT, RoBERTa, ALBERT, DeBERTa |

### 17.2 Decoder-Only (GPT-style)

| Property | Value |
|----------|-------|
| Architecture | Decoder stack without cross-attention (no encoder to attend to) |
| Attention | Causal / unidirectional |
| Training | Next token prediction |
| Best for | Text generation, chat, code generation, reasoning |
| Examples | GPT series, Claude, Llama, Mistral, Falcon, Gemini |

The decoder-only architecture dominates modern LLMs. Without an encoder, the cross-attention sublayer is removed, leaving two sublayers per layer: causal self-attention and FFN.

### 17.3 Encoder-Decoder (T5-style)

| Property | Value |
|----------|-------|
| Architecture | Full encoder + decoder with cross-attention |
| Training | Text-to-text (any input/output framed as text) |
| Best for | Translation, summarization, structured generation |
| Examples | T5, BART, mBART, Flan-T5 |

### 17.4 Comparison

| Feature | Encoder-Only | Decoder-Only | Encoder-Decoder |
|---------|-------------|-------------|-----------------|
| Context direction | Bidirectional | Unidirectional | Mixed |
| Generative | No | Yes | Yes |
| Understanding tasks | ✓✓✓ | ✓ | ✓✓ |
| Generation tasks | ✗ | ✓✓✓ | ✓✓ |
| Dominant use | NLU (2018–2021) | LLMs (2020–present) | Seq2seq |

---

## 18. Efficiency Improvements

The O(n²) attention bottleneck has driven substantial research into more efficient variants.

### 18.1 Flash Attention

Flash Attention (Dao et al., 2022) does not reduce the mathematical complexity — it still computes exact attention — but drastically reduces **memory bandwidth** usage by computing attention in tiles that fit in GPU SRAM (fast on-chip memory), avoiding slow reads and writes to HBM (GPU DRAM).

| Metric | Standard Attention | Flash Attention 2 |
|--------|--------------------|------------------|
| Memory | O(n²) | O(n) |
| Speed | Baseline | 2–4× faster |
| Output | Exact | Exact (same result) |

Flash Attention is now the default implementation in all major frameworks (PyTorch, JAX) and models.

### 18.2 Grouped-Query Attention (GQA)

Multi-Head Attention uses h independent K and V projections (one per head). **Grouped-Query Attention** shares K and V across groups of heads — reducing the KV cache size (the memory required during inference for previously computed keys and values).

| Variant | K/V heads | Memory | Quality |
|---------|-----------|--------|---------|
| Multi-Head (MHA) | h (one per head) | High | Highest |
| Grouped-Query (GQA) | g (one per group) | Medium | Near-MHA |
| Multi-Query (MQA) | 1 (shared) | Lowest | Slightly degraded |

Llama 3, Mistral, and Gemma all use GQA. It is now standard for production models.

### 18.3 KV Cache

During autoregressive generation, the model must compute K and V for all previous tokens at every step. The **KV cache** stores previously computed K and V tensors, so at step t, only the new token's K and V need to be computed. Without the KV cache, generation cost grows as O(n²) per token generated; with it, each step costs O(n).

**Memory cost of KV cache:**
```
KV cache size = 2 × n_layers × n_kv_heads × d_head × sequence_length × bytes_per_element

For Llama 3 70B at 4096 tokens (bf16):
≈ 2 × 80 × 8 × 128 × 4096 × 2 ≈ ~1.3 GB
```

Managing KV cache memory is a primary concern in LLM deployment (PagedAttention, used by vLLM, applies virtual memory principles to KV cache management).

### 18.4 Sparse Attention

Instead of every token attending to every other token, sparse attention restricts each token to a local window plus a small number of global tokens:

| Method | Pattern | Context |
|--------|---------|---------|
| **Sliding Window (Longformer)** | Each token attends to w/2 neighbors on each side | Local context |
| **Global tokens (Longformer)** | Designated tokens attend to all | Document-level |
| **Strided (BigBird)** | Sliding window + random + global | Full document |

---

## 19. Scaling Laws

One of the most important empirical findings about Transformers is that their performance scales **predictably** with compute, data, and parameters.

### 19.1 Chinchilla Scaling Laws

Hoffmann et al. (2022) established that for a given compute budget C (measured in FLOPs), the optimal allocation is roughly:

```
Optimal model size (parameters N) ∝ √C
Optimal training tokens D ∝ √C
→ N ≈ D  (tokens should be ~20× the parameter count for "Chinchilla-optimal" training)
```

Earlier models like GPT-3 (175B parameters, trained on 300B tokens) were significantly undertrained relative to their size. Llama 2 (7B parameters, trained on 2T tokens) followed Chinchilla-optimal ratios.

### 19.2 Neural Scaling Laws (Kaplan et al., 2020)

Performance (measured by loss) follows a power law with respect to each resource independently:

```
L(N) ∝ N^(-α_N)    (parameters)
L(D) ∝ D^(-α_D)    (training data)
L(C) ∝ C^(-α_C)    (compute)
```

The exponents are approximately 0.07–0.095. Crucially, these power laws hold across many orders of magnitude — the relationship between compute and performance has not plateaued at any scale tested to date.

### 19.3 Emergent Capabilities

As models scale beyond certain thresholds, capabilities appear that are absent or near-random at smaller scales — they "emerge" rather than improve gradually:

| Capability | Approximate Scale |
|-----------|------------------|
| Few-shot in-context learning | ~10B parameters |
| Chain-of-thought reasoning | ~100B parameters |
| Instruction following | Enhanced by RLHF, any scale |
| Multi-step arithmetic | ~540B parameters (without CoT) |

The mechanism behind emergence is debated — some researchers argue it is an artifact of discontinuous evaluation metrics rather than a true phase transition in the model's capabilities.

---

## 20. Applications Beyond Language

The Transformer's success in NLP has made it a general-purpose sequence model applicable across many domains.

### 20.1 Vision Transformers (ViT)

Images are split into fixed-size patches (e.g., 16×16 pixels). Each patch is flattened and treated as a token. A class token is prepended. The standard Transformer encoder is applied directly.

```
224×224 image  →  196 patches of 16×16 pixels
                →  196 tokens (+ 1 class token = 197 total)
                →  Standard Transformer encoder
                →  Class token output → classification head
```

ViT matches or exceeds CNN performance at scale, and is the backbone of modern vision models (CLIP, DINO, SAM).

### 20.2 Multimodal Transformers

Different modalities are converted to token sequences and processed jointly. Images are encoded as visual tokens (using a vision encoder), text as word tokens, audio as spectogram patches. The attention mechanism naturally handles cross-modal relationships.

Examples: CLIP (text-image alignment), Flamingo (few-shot visual reasoning), GPT-4V, Gemini.

### 20.3 Code

Code is tokenized like text. The Transformer's ability to model long-range dependencies is well-suited to code — function calls, variable references, and control flow span hundreds or thousands of tokens.

Examples: GitHub Copilot (Codex), AlphaCode, Claude for code, Devin.

### 20.4 Biology

**AlphaFold 2** uses a Transformer variant (Evoformer) that processes multiple sequence alignments as tokens and predicts 3D protein structure. The attention mechanism learns which residue pairs interact — learning the geometry of protein folding from sequence data alone.

### 20.5 Other Domains

| Domain | Input Tokens | Output |
|--------|-------------|--------|
| Audio (Whisper) | Mel spectrogram patches | Transcript |
| Video (Sora) | Spacetime patches | Generated video frames |
| Molecules (ChemBERTa) | SMILES characters | Molecular properties |
| Tabular data | Column values | Predictions |
| Game playing (Decision Transformer) | States, actions, returns | Next action |

---

## Appendix A: Technical Constants

| Constant | Value | Context |
|----------|-------|---------|
| Original paper d_model | 512 (base), 1024 (large) | "Attention Is All You Need" (2017) |
| Original paper N (layers) | 6 encoder + 6 decoder | Both base and large |
| Original paper heads (h) | 8 (base), 16 (large) | Multi-head attention |
| Original paper d_ff | 2048 (base), 4096 (large) | Feed-forward inner dimension |
| Original paper d_k = d_v | 64 (base), 64 (large) | Per-head dimension |
| Standard FFN expansion ratio | 4× d_model | Nearly universal |
| Attention scaling factor | 1/√d_k | Prevents gradient vanishing in softmax |
| Typical dropout rate | 0.1–0.3 | Applied to sublayer outputs |
| Positional encoding max length | 10,000 (original sinusoidal) | Can extend further |
| BPE merge operations | 10,000–100,000 | Determines vocabulary size |
| GPT-2 vocabulary size | 50,257 | BPE tokenizer |
| GPT-4 / Claude vocabulary size | ~100,000 | Tiktoken / SentencePiece |
| Llama 3 vocabulary size | 128,000 | SentencePiece |
| BERT vocabulary | 30,522 | WordPiece |
| GPT-3 parameters | 175 billion | 96 layers, d_model=12288 |
| Chinchilla optimal token/param ratio | ~20× tokens per parameter | Hoffmann et al. 2022 |
| Flash Attention speedup | 2–4× over naive | IO-aware tiling |
| GQA KV head count | Varies (2–8 typical) | Grouped-Query Attention |
| Standard LayerNorm epsilon | 1e-5 to 1e-6 | Numerical stability |
| Cross-entropy loss (random baseline) | ln(vocab_size) | e.g., ln(50257) ≈ 10.8 |
| GPT-3 trained FLOPS | ~3.1 × 10²³ | 300B tokens × 6 × 175B params |
| ViT patch size (standard) | 16×16 pixels | ViT-Base/16, ViT-Large/16 |
| Typical context window (2024–2025) | 128K–1M tokens | Production models |
| Attention complexity | O(n² · d) | Per layer, n = sequence length |
| KV cache memory formula | 2 × L × H × d_head × n × bytes | L=layers, H=KV heads |

---

## Appendix B: Key Equations Reference

| Equation | Formula | Notes |
|----------|---------|-------|
| **Scaled Dot-Product Attention** | Attention(Q,K,V) = softmax(QK^T / √d_k) · V | Core attention operation |
| **Multi-Head Attention** | MultiHead(Q,K,V) = Concat(head₁,...,headₕ) · W_O | h parallel heads |
| **Single Head** | head_i = Attention(QW_Qi, KW_Ki, VW_Vi) | Each head has its own projections |
| **Feed-Forward Network** | FFN(x) = max(0, xW₁ + b₁)W₂ + b₂ | ReLU variant |
| **FFN with SwiGLU** | FFN(x) = (Swish(xW) ⊙ xV) · W₂ | Modern variant |
| **Residual + LayerNorm (Post)** | x = LayerNorm(x + Sublayer(x)) | Original paper |
| **Residual + LayerNorm (Pre)** | x = x + Sublayer(LayerNorm(x)) | Modern LLMs |
| **LayerNorm** | γ · (x − μ)/√(σ² + ε) + β | Per-token normalization |
| **Sinusoidal PE (even)** | PE(pos, 2i) = sin(pos / 10000^(2i/d_model)) | Position encoding |
| **Sinusoidal PE (odd)** | PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model)) | Position encoding |
| **Embedding scale** | E(token) · √d_model | Prevents PE from dominating |
| **Cross-entropy loss** | L = −Σ log P(y_t \| y<t, x) | Training objective |
| **Attention complexity** | O(n² · d_model) | Per layer |
| **Head dimension** | d_k = d_v = d_model / h | Equal split across heads |
