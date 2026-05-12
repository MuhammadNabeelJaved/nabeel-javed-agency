/**
 * ChatbotConfig — singleton document that stores the AI chatbot configuration.
 *
 * Only one document lives in this collection (enforced by a unique `singleton`
 * field). All admin operations read/update this single record.
 *
 * API keys are stored as an encrypted string (AES-256-GCM via the `crypto`
 * module) using the ENCRYPTION_KEY env variable.  Never expose the raw key.
 */
import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  provider:     { type: String, required: true, trim: true },  // 'claude' | 'openai' | 'gemini' | etc.
  encryptedKey: { type: String, required: true },              // AES-256-GCM encrypted
  label:        { type: String, default: '' },                 // friendly name, e.g. "Production Claude key"
  isActive:     { type: Boolean, default: false },
  addedAt:      { type: Date, default: Date.now },
}, { _id: true });

const chatbotConfigSchema = new mongoose.Schema({
  /** Ensures only one document can exist in this collection. */
  singleton: { type: String, default: 'main', unique: true, immutable: true },

  /** Which AI provider + model is currently active. */
  activeProvider: {
    type:    String,
    enum:    ['anthropic', 'claude', 'openai', 'gemini', 'custom'],
    default: 'anthropic',
  },
  activeModel:  { type: String, default: 'claude-sonnet-4-20250514',  trim: true },
  /** Cheaper model used automatically for short/simple queries (smart routing). */
  simpleModel:  { type: String, default: 'claude-sonnet-4-20250514',  trim: true },

  /** Stored API key entries (one may be marked active). */
  apiKeys: { type: [apiKeySchema], default: [] },

  /** System prompt injected into every Claude conversation. */
  systemPrompt: {
    type: String,
    default:
      'You are a helpful business assistant for this agency website. ' +
      'Answer questions ONLY about the business, services, projects, team, ' +
      'pricing, and other topics directly related to this company. ' +
      'If a question is off-topic, politely decline and redirect the user to ' +
      'ask about the business.',
  },

  /** Extra free-text context about the business (appended to system prompt). */
  businessContext: { type: String, default: '' },

  /** Chatbot personality name shown in the UI. */
  botName: { type: String, default: 'WEB AI', trim: true },

  /** Greeting message shown when the chat opens. */
  welcomeMessage: {
    type:    String,
    default: "Hi! I'm WEB AI, your AI assistant. Ask me anything about our services, projects, or team!",
  },

  /** Whether the public chatbot widget is active on the public site. */
  isEnabled:        { type: Boolean, default: true },
  /** Whether the AI assistant is shown inside the user dashboard. */
  isUserChatEnabled: { type: Boolean, default: true },
  /** Whether the AI assistant is shown inside the team dashboard. */
  isTeamChatEnabled: { type: Boolean, default: true },

  /** Custom system prompt for the user-dashboard chatbot. */
  userChatSystemPrompt: {
    type: String,
    default:
      'You are a personal AI assistant for a client user of this agency. ' +
      'You have full access to this user\'s project data, applied jobs, and account info. ' +
      'Answer questions about their specific projects (status, deadlines, payments, progress), ' +
      'applied job applications, and account settings. ' +
      'Be helpful, specific, and refer to their actual data. ' +
      'Do not discuss other users\' data. ' +
      'For general business questions, you can also help, but prioritize their personal context.',
  },

  /** Custom system prompt for the team-dashboard chatbot. */
  teamChatSystemPrompt: {
    type: String,
    default:
      'You are an internal AI assistant for a team member of this agency. ' +
      'You have access to this team member\'s assigned client projects, tasks, and team data. ' +
      'Help them with project management questions, task planning, client project details, ' +
      'deadlines, technical decisions, and anything work-related. ' +
      'You can reference specific projects and tasks assigned to them. ' +
      'Be concise, professional, and practical.',
  },

  /**
   * Conversational tone / personality style injected into the system prompt.
   * Each option maps to a pre-written instruction paragraph in the controller.
   */
  tone: {
    type:    String,
    enum:    ['professional', 'friendly', 'formal', 'casual', 'expert', 'empathetic'],
    default: 'professional',
  },

  /** Claude generation parameters. */
  maxTokens:   { type: Number, default: 1024, min: 256, max: 8192 },
  temperature: { type: Number, default: 0.7,  min: 0,   max: 1 },

  /** Simple rate-limiting hints (enforced at the controller level). */
  maxMessagesPerHour: { type: Number, default: 30 },
  maxMessagesPerDay:  { type: Number, default: 100 },

  /** Suggested quick-prompt buttons shown in the user dashboard chatbot. */
  userChatQuickPrompts: {
    type:    [String],
    default: [
      "What's the status of my projects?",
      "Show my applied jobs",
      "What's my outstanding balance?",
      "How do I submit a new project?",
    ],
  },

  /** Suggested quick-prompt buttons shown in the team dashboard chatbot. */
  teamChatQuickPrompts: {
    type:    [String],
    default: [
      "Which projects am I assigned to?",
      "What tasks are due this week?",
      "Show me client project details",
      "Help me write a project update",
    ],
  },

  /** Custom welcome/greeting message for the user-dashboard chatbot. */
  userChatWelcomeMessage: {
    type:    String,
    default: "Hi! I'm your personal assistant. I can help you track your projects, check job applications, and answer questions about our services. What would you like to know?",
  },

  /** Custom welcome/greeting message for the team-dashboard chatbot. */
  teamChatWelcomeMessage: {
    type:    String,
    default: "Hi! I'm your team assistant. I have access to your assigned projects, portfolio work, and company info. How can I help you today?",
  },

  /**
   * Extra context hints for the user chatbot — free-text block appended to
   * the user chat system prompt (e.g. current promotions, support policies).
   */
  userChatContextHints: {
    type:    String,
    default: '',
  },

  /**
   * Extra context hints for the team chatbot — free-text block appended to
   * the team chat system prompt (e.g. internal guidelines, processes).
   */
  teamChatContextHints: {
    type:    String,
    default: '',
  },
}, {
  timestamps: true,
});

export default mongoose.model('ChatbotConfig', chatbotConfigSchema);
