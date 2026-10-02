// Render fixture copied from the owner mockup. In the app this comes from /api/v1/workforce;
// the screen reads only these shapes, so the adapter is the single integration point.
export const OWNER = { name: 'Marcus Hawkins Jr.', title: "MARCUS HAWKINS JR'S", roles: ['BUILDER', 'CREATOR', 'INNOVATOR'] }
export const AGENTS = [
  { id: 1, project: 'StreamsAiLive', role: 'Platform Builder & Quality Guardian', status: 'paused' },
  { id: 2, project: 'HIPAA Doctor Panel', role: 'Compliance & Security Agent', status: 'active' },
  { id: 3, project: 'PatientPanel', role: 'Patient Experience Agent', status: 'active' },
  { id: 4, project: 'StreamsAiLive Chat', role: 'AI Support & Assistance Agent', status: 'active' },
  { id: 5, project: 'Dropshipping Management', role: 'E-Commerce Operations Agent', status: 'active' },
  { id: 6, project: 'FulfillmentPro', role: 'Order Fulfillment Agent', status: 'active' },
  { id: 7, project: 'SEO / Optimization', role: 'Visibility & Growth Agent', status: 'active' },
  { id: 8, project: 'Live Freelance', role: 'Client & Project Management Agent', status: 'active' },
  { id: 9, project: 'Google Merchant', role: 'Product Listing & Merchant Agent', status: 'active' },
  { id: 10, project: 'Shopify Agent', role: 'Store & Sales Optimization Agent', status: 'active' },
]
export const JOBS = [
  { id: 113, agent: 'StreamsAiLive', title: 'Stage universal reconstruction', status: 'running', progress: 62, updated: '2h ago' },
  { id: 112, agent: 'SEO / Optimization', title: 'Analyze search performance', status: 'completed', progress: 100, updated: '1d ago' },
  { id: 111, agent: 'Shopify Agent', title: 'Update product listings', status: 'failed', progress: 0, updated: '2d ago' },
]
export const SYSTEM = { online: 8, total: 10, running: 3, queued: 5, completedToday: 12, failed: 1, updated: 'Just now' }
export const QUICK_ACTIONS = ['Create New Job', 'Edit Current Job', 'View Agent Details', 'Enhance Agent', 'Upload Files', 'View Reports']
export const SPECIALTIES = ['View Current Specialties', 'Add / Edit Specialties', 'Upload Knowledge Files', 'Enhance Agent Capabilities', 'Manage Integrations']
export const NAV = ['Agent Workforce', 'Dashboard', 'Projects', 'Tasks', 'Agents', 'Knowledge', 'Integrations', 'Analytics', 'Settings']
