export type GraphNode = {
  id: string;
  name: string;
  databaseId: string;
  databaseName: string;
  color: string;
  notionUrl: string;
  createdBy: string;
  createdTime: string;
  x: number;
  y: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relationName: string;
};

export type GraphData = {
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings?: string[];
};

export type NodeDetail = {
  id: string;
  name: string;
  createdBy: string;
  createdTime: string;
  databaseName: string;
  notionUrl: string;
};

export type AppConfig = {
  databaseColors: Record<string, string>;
  lastSyncAt?: string;
};
