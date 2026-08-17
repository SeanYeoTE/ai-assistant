import { Modal, StyleSheet, View } from 'react-native';

import { Color, Elevation, Radius, Spacing } from './tokens';
import { Text } from './Text';
import { Button } from './Button';
import type { DomainKey } from './tokens';
import { DomainChip } from './DomainChip';

export type ProposedAction = {
  id: string;
  domain: DomainKey;
  summary: string;
  detail?: string;
};

type Props = {
  visible: boolean;
  actions: ProposedAction[];
  onEdit: (actionId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Bottom-sheet pattern for voice-originated multi-action confirmations. Required before any edit-type action is applied — see AMP_HANDOVER.md §3/§6. */
export function ConfirmationSheet({ visible, actions, onEdit, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text variant="h2">
            {actions.length > 1 ? `Confirm ${actions.length} actions` : 'Confirm action'}
          </Text>
          <View style={styles.list}>
            {actions.map((action) => (
              <View key={action.id} style={styles.actionRow}>
                <DomainChip domain={action.domain} />
                <View style={styles.actionText}>
                  <Text variant="body">{action.summary}</Text>
                  {action.detail ? (
                    <Text variant="caption" color={Color.textSecondary}>
                      {action.detail}
                    </Text>
                  ) : null}
                </View>
                <Button label="Edit" variant="ghost" onPress={() => onEdit(action.id)} />
              </View>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <View style={styles.buttonFlex}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.buttonFlex}>
              <Button label="Confirm" variant="primary" onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Color.surfaceElevated,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Elevation.modal,
  },
  list: { gap: Spacing.md },
  actionRow: { gap: Spacing.xs },
  actionText: { gap: 2 },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  buttonFlex: { flex: 1 },
});
