import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ALL_THEMES, Theme, ThemeId } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ThemePickerModal({ visible, onClose }: Props) {
  const { themeId, setTheme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('theme.title', undefined, '视觉风格')}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {ALL_THEMES.map((th) => (
            <ThemeOption
              key={th.id}
              theme={th}
              active={themeId === th.id}
              onPick={(id) => {
                setTheme(id);
                onClose();
              }}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

interface OptionProps {
  theme: Theme;
  active: boolean;
  onPick: (id: ThemeId) => void;
}

function ThemeOption({ theme, active, onPick }: OptionProps) {
  return (
    <Pressable
      style={[styles.option, active && styles.optionActive]}
      onPress={() => onPick(theme.id)}
    >
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.swatch}
      />
      <Text style={styles.optionLabel}>
        {t(`theme.${theme.id}.name`, undefined, theme.name)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  close: { fontSize: 28, color: '#94A3B8', paddingHorizontal: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  option: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    gap: 10,
  },
  optionActive: {
    borderColor: '#FACC15',
    backgroundColor: '#FEF9C3',
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
