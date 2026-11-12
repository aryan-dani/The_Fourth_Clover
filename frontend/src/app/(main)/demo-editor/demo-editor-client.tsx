"use client";

import React, { useState } from "react";
import { EditorShell } from "@/features/editor/EditorShell";
import { EditorCanvas } from "@/features/editor/EditorCanvas";
import { EditorSettingsSheet } from "@/features/editor/EditorSettingsSheet";
import { PostBodyRenderer } from "@/components/post/PostBodyRenderer";
import { toast } from "sonner";

const INITIAL_DEMO_CONTENT = `
<h2>The Raft Consensus Invariant</h2>
<p>Distributed coordination requires strict state consistency across cluster partitions. Raft achieves this by decomposing consensus into leader election, log replication, and safety guarantees.</p>

<aside data-callout-type="mechanism">
  <p><strong>Core Invariant:</strong> If any cluster node has committed a log entry at a given index, no other node can ever commit a different entry for that same index.</p>
</aside>

<h2>Leader State Transition</h2>
<p>Below is the state machine implementation handling heartbeat cycles and term synchronization in Rust:</p>

<pre data-language="rust" data-filename="consensus.rs" data-line-numbers="true"><code>pub struct RaftNode {
    pub id: usize,
    pub term: u64,
    pub voted_for: Option<usize>,
    pub log: Vec<LogEntry>,
    pub commit_index: usize,
}

impl RaftNode {
    pub fn append_entries(&mut self, term: u64, entries: Vec<LogEntry>) -> Result<(), &'static str> {
        if term < self.term {
            return Err("Stale election term rejected");
        }
        self.log.extend(entries);
        self.commit_index = self.log.len() - 1;
        Ok(())
    }
}</code></pre>

<h2>Consensus Quorum Distribution</h2>
<p>The replication lifecycle between the elected leader and follower replicas is illustrated below:</p>

<div data-mermaid="sequenceDiagram
    Client->>Leader: WriteCommand(key, value)
    Leader->>Follower1: AppendEntriesRPC(term, log)
    Leader->>Follower2: AppendEntriesRPC(term, log)
    Follower1-->>Leader: AppendSuccess(index)
    Follower2-->>Leader: AppendSuccess(index)
    Leader->>Leader: CommitToStateMachine()
    Leader->>Client: WriteSuccessAck"></div>

<h2>Election Probability Theorem</h2>
<p>The statistical probability of resolving a split-vote cycle within randomized timeout intervals is defined by:</p>

<div data-latex="P(\\text{election}) = 1 - \\prod_{i=1}^N \\left(1 - \\frac{\\Delta t_i}{T_{\\text{window}}}\\right)"></div>

<aside data-callout-type="takeaway">
  <p><strong>Production Takeaway:</strong> Always apply randomized heartbeat jitter between <code>150ms</code> and <code>300ms</code> to prevent split-vote deadlocks during high-latency network partitions.</p>
</aside>

<p>Try placing your cursor on an empty line to trigger the <strong>Floating <code>+</code> Gutter Menu</strong>, or type <code>/</code> anywhere to open the <strong>Slash Command Palette</strong>!</p>
`.trim();

export function DemoEditorClient() {
  const [title, setTitle] = useState("Building Distributed Key-Value Stores with Raft Consensus");
  const [dek, setDek] = useState("A technical deep-dive into leader election, quorum consensus, and log replication state machines.");
  const [content, setContent] = useState(INITIAL_DEMO_CONTENT);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tags, setTags] = useState("Distributed Systems, Rust, System Design, Raft");
  const [coverImage, setCoverImage] = useState("");

  return (
    <div className="py-8">
      <EditorShell
        backHref="/tech-weekly"
        backLabel="CSI Tech Weekly"
        saveStatus="Interactive Demo Studio"
        mode={mode}
        onModeChange={setMode}
        primaryAction={{
          label: "Try Preview",
          onClick: () => {
            setMode(mode === "write" ? "preview" : "write");
            toast.success(mode === "write" ? "Switched to Reader Preview Mode!" : "Switched to Write Mode!");
          },
        }}
        secondaryAction={{
          label: "Reset Demo",
          onClick: () => {
            setContent(INITIAL_DEMO_CONTENT);
            toast.success("Demo content reset!");
          },
        }}
        settingsTrigger={
          <EditorSettingsSheet
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            coverImage={coverImage}
            onCoverFileChange={() => {}}
            onClearCover={() => setCoverImage("")}
            tags={tags}
            onTagsChange={setTags}
            showExcerpt={false}
            showSlug={false}
            showFormat={false}
          />
        }
      >
        <EditorCanvas
          title={title}
          onTitleChange={setTitle}
          dek={dek}
          onDekChange={setDek}
          showDek={true}
          content={content}
          onContentChange={setContent}
          titlePlaceholder="Article Title..."
          dekPlaceholder="Lead summary or hook..."
          mode={mode}
          preview={
            <div className="space-y-6 p-6 sm:p-10">
              <div className="space-y-2 border-b border-border/40 pb-6">
                <span className="font-mono text-xs uppercase tracking-wider text-brand">
                  Live Manuscript Reader Preview
                </span>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                  {title}
                </h1>
                {dek && (
                  <p className="font-serif text-lg text-muted-foreground leading-relaxed sm:text-xl">
                    {dek}
                  </p>
                )}
              </div>
              <PostBodyRenderer content={content} />
            </div>
          }
        />
      </EditorShell>
    </div>
  );
}
