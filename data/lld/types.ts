export interface LLDPrinciple {
  id: string;
  name: string;
  acronym: string;
  summary: string;
  whyItMatters: string;
  badCode: string;
  goodCode: string;
  explanation: string;
}

export interface DesignPattern {
  id: string;
  name: string;
  type: "Creational" | "Structural" | "Behavioral";
  summary: string;
  realWorldUseCase: string;
  mermaidDiagram: string;
  pythonCode: string;
  goCode: string;
  interviewTips: string[];
}

export interface LLDProblem {
  id: string;
  title: string;
  category: "Classic OOP" | "Concurrency & Systems";
  difficulty: "Medium" | "Hard";
  summary: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  mermaidDiagram: string;
  designPatternsUsed: string[];
  pythonCode: string;
  goCode?: string;
  keyInterviewTakeaways: string[];
}
