/** "core" = expected in a mid-level design round; "deep-dive" = senior-depth or project-specific material. */
export type HLDLevel = "core" | "deep-dive";

export interface HLDConcept {
  id: string;
  level?: HLDLevel;
  category:
    | "Interview Approach"
    | "Network & Web"
    | "Scalability"
    | "Data Storage"
    | "Distributed Systems"
    | "Caching"
    | "Async Processing"
    | "Architecture";
  title: string;
  summary: string;
  keyPrinciples: string[];
  tradeOffs: string[];
  /** Short label/value facts worth memorising (reference numbers, status codes, rules of thumb). */
  quickReference?: Array<{ label: string; value: string }>;
  mermaidDiagram?: string;
  interviewTip: string;
  sources?: Array<{ label: string; url: string }>;
}

export interface HLDCaseStudy {
  id: string;
  level?: HLDLevel;
  title: string;
  category: "Classic" | "Resume-Aligned";
  companyContext?: string;
  summary: string;
  rubric: {
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
    estimations: {
      rps: string;
      storagePerDay: string;
      bandwidth: string;
      cacheSize: string;
    };
    apiDesign: Array<{
      endpoint: string;
      method: "GET" | "POST" | "PUT" | "DELETE" | "WS" | "gRPC" | "MQTT";
      description: string;
      payload?: string;
      response?: string;
    }>;
    dbSchema: Array<{
      table: string;
      primaryKey: string;
      fields: string[];
      notes: string;
    }>;
    architectureDiagram: string;
    deepDiveAndBottlenecks: Array<{
      topic: string;
      problem: string;
      solution: string;
      /** Optional supporting diagram, e.g. a state machine for this deep dive. */
      diagram?: string;
    }>;
    /** Decisions made in this design and what each one gives up. */
    tradeOffs?: string[];
    /** Questions an interviewer is likely to ask next, with a short model answer. */
    followUpQuestions?: Array<{ question: string; answer: string }>;
  };
}
