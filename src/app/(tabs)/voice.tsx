import { useState } from 'react';
import { TextInput, View, StyleSheet } from 'react-native';

import { Screen, Text, Button, VoiceOrb, Color, Spacing, Radius, ConfirmationSheet } from '@/design-system';
import { executeConfirmedCalls, interpretTranscript, speak, type PendingToolCall } from '@/voice/pipeline';
import type { ProposedAction } from '@/design-system/ConfirmationSheet';

// STT provider is an open item (AMP_HANDOVER.md §10) — for now the transcript
// is typed rather than spoken, which still exercises the full pipeline:
// transcript → LLM tool_use → confirm → execute → TTS.
export default function VoiceScreen() {
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [pendingActions, setPendingActions] = useState<ProposedAction[]>([]);
  const [pendingCalls, setPendingCalls] = useState<PendingToolCall[]>([]);

  async function handleSubmit() {
    if (!transcript.trim()) return;
    setBusy(true);
    setAssistantText('');
    try {
      const outcome = await interpretTranscript(transcript.trim());
      if (outcome.kind === 'no_action') {
        setAssistantText(outcome.assistantText);
        speak(outcome.assistantText);
      } else {
        setPendingActions(outcome.actions);
        setPendingCalls(outcome.calls);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    const summaries = await executeConfirmedCalls(pendingCalls);
    const confirmation = summaries.join(' ');
    setPendingActions([]);
    setPendingCalls([]);
    setTranscript('');
    setAssistantText(confirmation);
    speak(confirmation);
  }

  function handleCancel() {
    setPendingActions([]);
    setPendingCalls([]);
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.orbSection}>
        <VoiceOrb listening={busy} />
        <Text variant="caption" color={Color.textSecondary}>
          {busy ? 'Thinking…' : 'Type what you would say'}
        </Text>
      </View>

      {assistantText ? (
        <View style={styles.assistantBubble}>
          <Text variant="body">{assistantText}</Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          value={transcript}
          onChangeText={setTranscript}
          placeholder='e.g. "log that I meditated today"'
          placeholderTextColor={Color.textSecondary}
          style={styles.input}
          onSubmitEditing={handleSubmit}
        />
        <Button label="Send" onPress={handleSubmit} />
      </View>

      <ConfirmationSheet
        visible={pendingActions.length > 0}
        actions={pendingActions}
        onEdit={() => {}}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'flex-end', paddingBottom: Spacing.xl },
  orbSection: { alignItems: 'center', gap: Spacing.md, flex: 1, justifyContent: 'center' },
  assistantBubble: {
    backgroundColor: Color.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Color.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    color: Color.textPrimary,
  },
});
