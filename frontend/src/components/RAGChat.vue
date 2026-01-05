<template>
  <div class="rag-chat-wrapper">
    <!-- Header -->
    <div class="rag-header">
      <h2 class="rag-title">Ask about the portfolio</h2>
      <p class="rag-subtitle">Get instant answers about projects, skills, and experience</p>
    </div>

    <!-- Messages Container -->
    <div class="rag-messages-container">
      <div v-if="messages.length === 0" class="rag-empty-state">
        <div class="rag-empty-icon">💬</div>
        <p class="rag-empty-text">Start a conversation by asking a question</p>
        <div class="rag-example-queries">
          <p class="rag-example-label">Try asking:</p>
          <div class="rag-example-buttons">
            <button class="rag-example-btn" @click="inputQuery = 'What are your main projects?'; sendQuery()">
              What are your main projects?
            </button>
            <button class="rag-example-btn" @click="inputQuery = 'What skills do you have?'; sendQuery()">
              What skills do you have?
            </button>
            <button class="rag-example-btn" @click="inputQuery = 'Tell me about your experience'; sendQuery()">
              Tell me about your experience
            </button>
          </div>
        </div>
      </div>

      <div v-else class="rag-messages-list">
        <!-- Messages -->
        <div v-for="(message, index) in messages" :key="index" class="rag-message-wrapper" :class="message.role">
          <!-- User Message -->
          <div v-if="message.role === 'user'" class="rag-user-message">
            <div class="rag-message-bubble user">
              {{ message.content }}
            </div>
          </div>

          <!-- Assistant Message -->
          <div v-else class="rag-assistant-message">
            <div class="rag-message-bubble assistant">
              <!-- Markdown rendered content -->
              <div v-html="renderMarkdown(message.content)" class="rag-markdown-content"></div>
            </div>

            <!-- Sources -->
            <div v-if="message.sources && message.sources.length > 0" class="rag-sources">
              <div class="rag-sources-label">📚 Sources:</div>
              <div class="rag-sources-list">
                <a
                  v-for="(source, i) in message.sources"
                  :key="i"
                  :href="source.url || '#'"
                  :target="source.url ? '_blank' : undefined"
                  class="rag-source-item"
                >
                  <span class="rag-source-title">{{ source.title }}</span>
                  <span class="rag-source-type">{{ source.type }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="rag-message-wrapper assistant">
          <div class="rag-assistant-message">
            <div class="rag-message-bubble assistant loading">
              <span class="rag-loading-dot"></span>
              <span class="rag-loading-dot"></span>
              <span class="rag-loading-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-scroll anchor -->
      <div ref="messagesEnd"></div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="rag-error">
      <span class="rag-error-icon">⚠️</span>
      <span class="rag-error-text">{{ error }}</span>
      <button class="rag-error-close" @click="error = null">✕</button>
    </div>

    <!-- Input Area -->
    <div class="rag-input-section">
      <div class="rag-input-wrapper">
        <input
          v-model="inputQuery"
          @keyup.enter="sendQuery"
          :disabled="isLoading"
          type="text"
          placeholder="Ask me anything about the portfolio..."
          class="rag-input"
        />
        <button
          @click="sendQuery"
          :disabled="isLoading || !inputQuery.trim()"
          class="rag-send-btn"
        >
          <span v-if="!isLoading">Send</span>
          <span v-else class="rag-sending">
            <span class="rag-loading-dot-small"></span>
          </span>
        </button>
      </div>
      <p class="rag-hint">💡 Ask about projects, skills, education, or experience</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false,
  },
});

const messages = ref([]);
const inputQuery = ref('');
const isLoading = ref(false);
const error = ref(null);
const messagesEnd = ref(null);

// Determine API URL - use environment variable or construct from current host
const getAPIUrl = () => {
  if (import.meta.env.VITE_RAG_API_URL) {
    return import.meta.env.VITE_RAG_API_URL;
  }
  
  // In production on Vercel, backend is served via /api routes
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use localhost
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getAPIUrl();

/**
 * Render markdown content with HTML escaping for security
 */
const renderMarkdown = (content) => {
  // Simple markdown rendering with basic HTML support
  let html = content
    // Code blocks
    .replace(/```([^```]*?)```/gs, '<pre><code class="rag-code-block">$1</code></pre>')
    // Inline code
    .replace(/`([^`]+?)`/g, '<code class="rag-inline-code">$1</code>')
    // Bold
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.*?)$/gm, '<h3 class="rag-h3">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="rag-h2">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 class="rag-h1">$1</h1>')
    // Bullet points
    .replace(/^\* (.*?)$/gm, '<li class="rag-list-item">$1</li>')
    .replace(/(<li class="rag-list-item">.*?<\/li>)/s, '<ul class="rag-list">$1</ul>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  return html;
};

/**
 * Auto-scroll to bottom when messages change
 */
const scrollToBottom = async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Send a query to the RAG backend
 */
const sendQuery = async () => {
  const query = inputQuery.value.trim();

  if (!query) return;

  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: query,
  });

  inputQuery.value = '';
  isLoading.value = true;
  error.value = null;

  await scrollToBottom();

  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get response');
    }

    const data = await response.json();

    // Add assistant message to chat
    messages.value.push({
      role: 'assistant',
      content: data.answer,
      sources: data.sources,
    });

    await scrollToBottom();
  } catch (err) {
    console.error('Error:', err);
    error.value = err.message;
    messages.value.push({
      role: 'assistant',
      content: '❌ Sorry, I encountered an error processing your request. Please try again.',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.rag-chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border: none;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  transition: all 0.3s ease;
}

.rag-chat-wrapper:hover {
  box-shadow: none;
}

/* Header */
.rag-header {
  padding: 20px;
  background: white;
  border-bottom: 2px solid black;
}

.rag-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: black;
  font-family: system-ui, -apple-system, sans-serif;
}

.rag-subtitle {
  margin: 0;
  font-size: 13px;
  color: #666;
  font-weight: 400;
}

/* Messages Container */
.rag-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: white;
  scroll-behavior: smooth;
}

.rag-messages-container::-webkit-scrollbar {
  width: 6px;
}

.rag-messages-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.rag-messages-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.rag-messages-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.rag-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #999;
}

.rag-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.rag-empty-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  font-weight: 500;
}

.rag-example-queries {
  width: 100%;
  max-width: 400px;
}

.rag-example-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rag-example-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rag-example-btn {
  padding: 10px 14px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  font-weight: 400;
}

.rag-example-btn:hover {
  border-color: black;
  background: #f9f9f9;
  transform: translateX(2px);
}

/* Messages List */
.rag-messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rag-message-wrapper {
  display: flex;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rag-message-wrapper.user {
  justify-content: flex-end;
}

.rag-message-wrapper.assistant {
  justify-content: flex-start;
  flex-direction: column;
}

/* Message Bubbles */
.rag-user-message {
  display: flex;
  justify-content: flex-end;
  max-width: 80%;
}

.rag-assistant-message {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 85%;
}

.rag-message-bubble {
  border-radius: 6px;
  padding: 12px 14px;
  line-height: 1.5;
  font-size: 13px;
  word-wrap: break-word;
}

.rag-message-bubble.user {
  background: black;
  color: white;
  border: none;
  font-weight: 400;
  max-width: 80%;
}

.rag-message-bubble.assistant {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  text-align: left;
}

.rag-message-bubble.loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 14px 20px;
}

/* Markdown Content */
.rag-markdown-content {
  word-break: break-word;
}

.rag-markdown-content h1,
.rag-markdown-content h2,
.rag-markdown-content h3 {
  margin: 16px 0 8px 0;
  font-weight: 700;
  color: black;
  line-height: 1.3;
}

.rag-markdown-content h1,
.rag-h1 {
  font-size: 18px;
}

.rag-markdown-content h2,
.rag-h2 {
  font-size: 16px;
}

.rag-markdown-content h3,
.rag-h3 {
  font-size: 15px;
}

.rag-markdown-content ul,
.rag-list {
  margin: 8px 0;
  padding-left: 20px;
  list-style: none;
}

.rag-markdown-content li,
.rag-list-item {
  margin: 6px 0;
  position: relative;
  padding-left: 16px;
  color: #333;
}

.rag-markdown-content li:before,
.rag-list-item:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #333;
  font-weight: bold;
}

.rag-markdown-content code,
.rag-inline-code {
  background: #e8e8e8;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #c41e3a;
}

.rag-markdown-content pre,
.rag-code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  margin: 8px 0;
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.rag-markdown-content strong {
  font-weight: 700;
  color: black;
}

.rag-markdown-content em {
  font-style: italic;
  color: #555;
}

.rag-markdown-content br {
  margin: 4px 0;
}

/* Sources */
.rag-sources {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-top: 4px;
  font-size: 13px;
}

.rag-sources-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rag-sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rag-source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 4px;
  text-decoration: none;
  color: #0066cc;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.rag-source-item:hover {
  background: #f0f4f9;
  border-color: #0066cc;
  text-decoration: underline;
}

.rag-source-title {
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rag-source-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* Loading Indicator */
.rag-loading-dot,
.rag-loading-dot-small {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  animation: rag-bounce 1.4s infinite ease-in-out both;
}

.rag-loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.rag-loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes rag-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Error Message */
.rag-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fee;
  border: 2px solid #f88;
  border-radius: 6px;
  color: #c41e3a;
  font-size: 14px;
  margin: 0 20px 12px 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rag-error-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.rag-error-text {
  flex: 1;
}

.rag-error-close {
  background: none;
  border: none;
  color: #c41e3a;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.rag-error-close:hover {
  opacity: 1;
}

/* Input Section */
.rag-input-section {
  padding: 14px 16px;
  background: white;
  border-top: 2px solid black;
}

.rag-input-wrapper {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.rag-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
  color: black;
}

.rag-input:focus {
  outline: none;
  border-color: black;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.rag-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.rag-input::placeholder {
  color: #999;
}

.rag-send-btn {
  padding: 10px 18px;
  background: black;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
}

.rag-send-btn:hover:not(:disabled) {
  background: #333;
}

.rag-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rag-sending {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rag-loading-dot-small {
  width: 4px;
  height: 4px;
  background: white;
}

.rag-hint {
  margin: 0;
  font-size: 12px;
  color: #999;
  text-align: center;
  font-weight: 400;
}

/* Responsive */
@media (max-width: 768px) {
  .rag-chat-wrapper {
    border-radius: 8px;
  }

  .rag-header {
    padding: 16px;
  }

  .rag-title {
    font-size: 20px;
  }

  .rag-subtitle {
    font-size: 12px;
  }

  .rag-messages-container {
    padding: 16px;
  }

  .rag-message-bubble {
    font-size: 13px;
  }

  .rag-assistant-message,
  .rag-user-message {
    max-width: 95%;
  }

  .rag-example-buttons {
    flex-direction: column;
  }

  .rag-example-btn {
    font-size: 12px;
    padding: 10px 14px;
  }

  .rag-input {
    font-size: 16px; /* Prevents zoom on mobile */
  }
}
</style>
