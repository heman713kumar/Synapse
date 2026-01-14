import { IdeaNode } from "../types";

export const BASIC_MINDMAP_TEMPLATE: IdeaNode[] = [
    { id: 'template_node_1', x: 300, y: 200, title: 'Central Idea', description: 'This is the core concept.', connections: ['template_node_2', 'template_node_3', 'template_node_4'] },
    { id: 'template_node_2', x: 100, y: 100, title: 'Topic 1', description: 'A key aspect of the idea.', connections: [] },
    { id: 'template_node_3', x: 500, y: 100, title: 'Topic 2', description: 'Another key aspect.', connections: [] },
    { id: 'template_node_4', x: 300, y: 400, title: 'Topic 3', description: 'A third key aspect.', connections: [] },
];

export const SWOT_TEMPLATE: IdeaNode[] = [
    { id: 'swot_1', x: 100, y: 100, title: 'Strengths', description: 'What we do well.', connections: [] },
    { id: 'swot_2', x: 400, y: 100, title: 'Weaknesses', description: 'Where we can improve.', connections: [] },
    { id: 'swot_3', x: 100, y: 300, title: 'Opportunities', description: 'External factors we can leverage.', connections: [] },
    { id: 'swot_4', x: 400, y: 300, title: 'Threats', description: 'External factors that could harm us.', connections: [] },
];