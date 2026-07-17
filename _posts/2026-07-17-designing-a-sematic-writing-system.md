---
author: monointerferenz
categories: Text
date: 2026-07-17
layout: post
tags:
- ai
- coding
- development
title: Designing a Sematic Writing System
---

Key-Idea: **The text is not the primary object. The argument structure is.**

## Concept

- A writing assistant where the user builds a semantic graph of ideas, evidence, and argumentative relations; the LLM only transforms selected graph paths into prose. This process is semi-dynamic. Calculation times are normal behaviours. Quality > Realtime.

The Graph consits of "Crad" and "Links".

A possible model for the "Card" is:

```
Card
 ├─ type: idea | claim | source | quote | observation | counterpoint | conclusion
 ├─ content: short semantic statement
 ├─ evidence: linked sources / excerpts
 ├─ relations:
 │   ├─ supports
 │   ├─ contradicts
 │   ├─ expands
 │   ├─ leads_to
 │   └─ concludes
 └─ status: raw | checked | usable | written
```

Then the LLM does not “invent an essay”. It receives a constrained graph:

```
Claim A
  supported_by Source X
  expands Idea B
  leads_to Conclusion C
```

and is asked to formulate prose from that structure.

A strong version would seperate Layers:	

1. Knowldge Layer
   - Cards, sources, quotes, observations, claims.
2. Argument Layer
   - Directed links: supports, causes, contrasts, concludes.
3. Text Layer
   - Paragraphs generated from selected paths through the graph.

## A simple example:

```YAML
cards:
  A:
    type: claim
    text: Water is good for you.

  B:
    type: source
    text: Study about the affects of water on the human body.

  C:
    type: claim
    text: You should drink more water.

  D:
    type: conclusion
    text: Water is indeed good for you and you should drink more of it.

links:
  - from: B
    to: A
    relation: supports

  - from: A
    to: C
    relation: leads_to

  - from: C
    to: D
    relation: supports
```

The llm-prompt could be like this:

```
Write one academic paragraph using only cards A, B, C, and D.
Preserve the argument order.
Do not introduce external claims.
Use source B only as support for claim A.
End with conclusion D.
```

The important part: the system should not only store “ideas”, but also the **epistemic status** of ideas.

For example:

```
raw thought
personal observation
supported claim
direct quotation
interpretive claim
speculative connection
final argument
```

That matters because a source card and an intuition card should not have the same authority.
