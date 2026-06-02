import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/app/Screen';
import { useToken } from '@/hooks/use-token';
import {
  aiChat,
  getQuota,
  type AiChatGoal,
  type AiChatMessage,
  type QuotaState,
} from '@/data/backendProxyClient';

interface GoalConfig {
  id: AiChatGoal;
  label: string;
  icon: any;
  description: string;
  initialMessage: string;
  placeholder: string;
}

const GOALS: GoalConfig[] = [
  {
    id: 'conversation',
    label: 'Hội thoại',
    icon: 'chatbubbles-outline',
    description: 'Luyện tập giao tiếp tự nhiên bằng tiếng Anh theo nhiều chủ đề.',
    initialMessage: 'Hi there! Let\'s practice speaking English together. What would you like to chat about today?',
    placeholder: 'Nhập tin nhắn bằng tiếng Anh...',
  },
  {
    id: 'correction',
    label: 'Sửa lỗi viết',
    icon: 'document-text-outline',
    description: 'Nhập một đoạn văn tiếng Anh để được kiểm tra chính tả, ngữ pháp và gợi ý viết tốt hơn.',
    initialMessage: 'Please write or paste any sentence or paragraph in English here. I will review it and provide corrections and writing tips.',
    placeholder: 'Nhập câu hoặc đoạn văn cần sửa...',
  },
  {
    id: 'explanation',
    label: 'Giải thích',
    icon: 'help-circle-outline',
    description: 'Giải thích các điểm ngữ pháp phức tạp hoặc phân biệt các từ dễ nhầm lẫn.',
    initialMessage: 'Ask me any English grammar questions or ask me to explain a difficult sentence.',
    placeholder: 'Nhập câu hỏi ngữ pháp của bạn...',
  },
  {
    id: 'roleplay',
    label: 'Đóng vai',
    icon: 'people-outline',
    description: 'Thực hành hội thoại theo tình huống thực tế (đặt bàn ăn, phỏng vấn, mua sắm).',
    initialMessage: 'Let\'s practice roleplaying! Choose a scenario: e.g. "ordering coffee", "job interview", "hotel check-in". Tell me your choice or start whenever you are ready.',
    placeholder: 'Bắt đầu tình huống đóng vai...',
  },
];

export default function AiAssistantScreen() {
  const { colors, radius, typography } = useToken();
  const [selectedGoal, setSelectedGoal] = useState<AiChatGoal>('conversation');
  const [messagesByGoal, setMessagesByGoal] = useState<Record<AiChatGoal, AiChatMessage[]>>({
    conversation: [{ role: 'assistant', content: GOALS[0].initialMessage }],
    correction: [{ role: 'assistant', content: GOALS[1].initialMessage }],
    explanation: [{ role: 'assistant', content: GOALS[2].initialMessage }],
    roleplay: [{ role: 'assistant', content: GOALS[3].initialMessage }],
  });
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const currentGoalConfig = GOALS.find((g) => g.id === selectedGoal) || GOALS[0];
  const chatMessages = messagesByGoal[selectedGoal];

  const fetchQuotaState = async () => {
    try {
      const state = await getQuota();
      setQuota(state);
    } catch {
      // Ignore quota fetching error
    }
  };

  useEffect(() => {
    fetchQuotaState();
  }, []);

  // Scroll to bottom on messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages, loading]);

  const handleGoalChange = (goalId: AiChatGoal) => {
    setSelectedGoal(goalId);
    setError(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessageContent = inputText.trim();
    setInputText('');
    setError(null);

    const newUserMessage: AiChatMessage = {
      role: 'user',
      content: userMessageContent,
    };

    // Update messages locally immediately
    const updatedMessages = [...chatMessages, newUserMessage];
    setMessagesByGoal((prev) => ({
      ...prev,
      [selectedGoal]: updatedMessages,
    }));

    setLoading(true);

    try {
      // Call AI Chat API
      const response = await aiChat({
        goal: selectedGoal,
        learningLanguage: 'EN',
        messages: updatedMessages,
      });

      const assistantMessage: AiChatMessage = {
        role: 'assistant',
        content: response.content,
      };

      setMessagesByGoal((prev) => ({
        ...prev,
        [selectedGoal]: [...updatedMessages, assistantMessage],
      }));

      // Refresh quota after a successful response
      fetchQuotaState();
    } catch (err: any) {
      if (err?.status === 429) {
        setError('Bạn đã dùng hết lượt hội thoại miễn phí của gói này.');
      } else {
        setError(err?.message || 'Không thể kết nối đến máy chủ AI.');
      }
      
      // Rollback last message or keep it and show error? We keep it but show an error banner.
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessagesByGoal((prev) => ({
      ...prev,
      [selectedGoal]: [{ role: 'assistant', content: currentGoalConfig.initialMessage }],
    }));
    setError(null);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.flexContainer}
      >
        {/* Header Area */}
        <View style={[styles.header, { borderColor: colors.borderDefault }]}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary, ...typography.h3 }]}>
              Trợ lý AI Học tập
            </Text>
            {quota?.aiChat ? (
              <Text style={[styles.quotaText, { color: colors.textTertiary, ...typography.captionSmall }]}>
                Đã dùng {quota.aiChat.used}/{quota.aiChat.limit} tin nhắn tháng này
              </Text>
            ) : (
              <Text style={[styles.quotaText, { color: colors.textTertiary, ...typography.captionSmall }]}>
                Đồng hành cùng AI Tutor của bạn
              </Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResetChat}
            style={[styles.resetButton, { backgroundColor: colors.canvasAlt, borderRadius: radius.full }]}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Goal Selector */}
        <View style={styles.goalSelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalSelectorScroll}
          >
            {GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id;
              return (
                <TouchableOpacity
                  key={goal.id}
                  activeOpacity={0.8}
                  onPress={() => handleGoalChange(goal.id)}
                  style={[
                    styles.goalPill,
                    {
                      borderRadius: radius.full,
                      backgroundColor: isSelected ? colors.accentSoft : colors.canvasAlt,
                      borderColor: isSelected ? colors.accentPrimary : colors.borderDefault,
                    },
                  ]}
                >
                  <Ionicons
                    name={goal.icon}
                    size={16}
                    color={isSelected ? colors.accentPrimary : colors.textSecondary}
                    style={styles.goalIcon}
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      {
                        color: isSelected ? colors.accentPrimary : colors.textSecondary,
                        ...typography.bodySmBold,
                      },
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Goal description banner */}
        <View style={[styles.descriptionBanner, { backgroundColor: colors.canvasAlt }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary, ...typography.caption }]}>
            {currentGoalConfig.description}
          </Text>
        </View>

        {/* Chat Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatFeed}
          contentContainerStyle={styles.chatFeedContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={index}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.assistantRow,
                ]}
              >
                {!isUser && (
                  <View style={[styles.avatar, { backgroundColor: colors.accentPrimary }]}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.accentPrimary, borderBottomRightRadius: radius.none }]
                      : [styles.assistantBubble, { backgroundColor: colors.canvasElevated, borderColor: colors.borderDefault, borderBottomLeftRadius: radius.none }],
                    { borderRadius: radius.lg },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isUser ? '#FFFFFF' : colors.textPrimary,
                        ...typography.bodySm,
                      },
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={[styles.avatar, { backgroundColor: colors.accentPrimary }]}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.bubble,
                  styles.assistantBubble,
                  {
                    backgroundColor: colors.canvasElevated,
                    borderColor: colors.borderDefault,
                    borderRadius: radius.lg,
                    borderBottomLeftRadius: radius.none,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.accentPrimary} />
              </View>
            </View>
          )}

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.statusError, borderRadius: radius.md }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.accentError} />
              <Text style={[styles.errorText, { color: colors.accentError, ...typography.caption }]}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { borderColor: colors.borderDefault, backgroundColor: colors.canvas }]}>
          <TextInput
            multiline
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.borderDefault,
                borderRadius: radius.md,
                backgroundColor: colors.canvasAlt,
                ...typography.bodySm,
                maxHeight: 100,
              },
            ]}
            placeholder={currentGoalConfig.placeholder}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !loading ? colors.accentPrimary : colors.disabledBg,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={16}
              color={inputText.trim() && !loading ? '#FFFFFF' : colors.disabledText}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontWeight: '700',
  },
  quotaText: {
    marginTop: 2,
  },
  resetButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSelectorContainer: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  goalSelectorScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  goalIcon: {
    marginRight: 6,
  },
  goalLabel: {
    fontSize: 13,
  },
  descriptionBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  chatFeed: {
    flex: 1,
  },
  chatFeedContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  assistantRow: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    // Left border rounded
  },
  assistantBubble: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  messageText: {
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 38,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
