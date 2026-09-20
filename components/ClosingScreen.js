import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function ClosingScreen({ onDone }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.line}>Your day begins now.</Text>

      <Pressable style={styles.doneButton} onPress={onDone} hitSlop={12}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  line: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  doneButton: {
    position: 'absolute',
    bottom: 48,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneText: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 1,
  },
});
