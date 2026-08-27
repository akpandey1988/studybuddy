import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, CtaButton, Kicker } from '../components/UI';
import { CameraIcon, CheckIcon, UploadIcon } from '../components/Icons';
import { CATALOG, dateLabel } from '../data/catalog';
import {
  SyllabusInputError, captureSyllabusPhoto, humanSize, pickSyllabusFile, pickSyllabusImage,
} from '../services/syllabusInput';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/**
 * Where the knowledge graph's input comes from. A photo of the syllabus sheet
 * is the path most students will actually take, so it leads.
 */
export function SyllabusScreen() {
  const { draftSubject, draftDays, draftSyllabus, draftFile, actions } = useApp();

  const [busy, setBusy] = React.useState<null | 'camera' | 'library' | 'file'>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [typing, setTyping] = React.useState(false);

  const subject = draftSubject ?? '';
  const fallback = CATALOG.find((c) => c.name === subject)?.topics ?? [];
  const typed = draftSyllabus.trim();

  const run = async (
    which: 'camera' | 'library' | 'file',
    pick: () => Promise<Awaited<ReturnType<typeof pickSyllabusFile>>>,
  ) => {
    setBusy(which);
    setError(null);
    try {
      const attachment = await pick();
      if (attachment) actions.setDraftFile(attachment);
    } catch (e) {
      setError(e instanceof SyllabusInputError ? e.message : `Something went wrong: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const ready = Boolean(subject) && (Boolean(draftFile) || typed.length > 0 || !typing);

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goAddsub} />
        <View style={{ gap: 4 }}>
          <Kicker>{subject}</Kicker>
          <Text style={styles.h2}>What's on the paper?</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Nexora reads this to work out what to teach you and what has to come first.
          A photo of the syllabus sheet is enough.
        </Text>

        {draftFile ? (
          <View style={styles.attached}>
            <View style={styles.attachedIcon}><CheckIcon size={18} color="#fff" /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.attachedName} numberOfLines={1}>{draftFile.name}</Text>
              <Text style={styles.attachedMeta}>
                {draftFile.kind === 'pdf' ? 'PDF' : 'Photo'} · {humanSize(draftFile.bytes)}
              </Text>
            </View>
            <Pressable onPress={() => actions.setDraftFile(null)} hitSlop={10}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {/* Camera first — it's the fastest route for a paper syllabus. */}
            {Platform.OS !== 'web' && (
              <SourceButton
                icon={<CameraIcon size={22} color={colors.accent800} />}
                title="Take a photo"
                hint="Point at the syllabus sheet"
                loading={busy === 'camera'}
                onPress={() => run('camera', captureSyllabusPhoto)}
              />
            )}
            <SourceButton
              icon={<UploadIcon size={22} color={colors.accent800} />}
              title="Upload a PDF or photo"
              hint="From your files"
              loading={busy === 'file'}
              onPress={() => run('file', pickSyllabusFile)}
            />
            {Platform.OS !== 'web' && (
              <SourceButton
                icon={<UploadIcon size={22} color={colors.accent800} />}
                title="Choose an existing photo"
                hint="From your gallery"
                loading={busy === 'library'}
                onPress={() => run('library', pickSyllabusImage)}
              />
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!typing && !draftFile && (
          <Pressable onPress={() => setTyping(true)}>
            <Text style={styles.typeLink}>Or type the chapter names instead</Text>
          </Pressable>
        )}

        {(typing || typed.length > 0) && (
          <View style={styles.inputWrap}>
            <TextInput
              value={draftSyllabus}
              onChangeText={actions.setDraftSyllabus}
              placeholder={fallback.length ? `${fallback.slice(0, 3).join('\n')}\n…` : 'Chapter 1: …'}
              placeholderTextColor={colors.neutral500}
              style={styles.input}
              multiline
              textAlignVertical="top"
              autoFocus={typing && typed.length === 0}
            />
            <Text style={styles.inputFooterText}>
              {draftFile
                ? 'Anything extra worth knowing — optional, the file is the main thing.'
                : 'Leave this blank to use the standard syllabus for this subject.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ gap: 14, paddingTop: 12 }}>
        <View style={styles.dateCard}>
          <Text style={styles.dateCardLabel}>Exam date</Text>
          <Text style={styles.dateCardValue}>{dateLabel(draftDays)}</Text>
          <Text style={styles.dateCardSub}>{draftDays} days to prepare.</Text>
        </View>
        <CtaButton label="Build my plan" active={ready} onPress={actions.buildExam} />
      </View>
    </Screen>
  );
}

function SourceButton({
  icon, title, hint, onPress, loading,
}: {
  icon: React.ReactNode; title: string; hint: string; onPress: () => void; loading: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.source, loading && styles.sourceBusy]}>
      <View style={styles.sourceIcon}>
        {loading ? <ActivityIndicator size="small" color={colors.accent800} /> : icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sourceTitle}>{title}</Text>
        <Text style={styles.sourceHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 31, color: colors.text },
  intro: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral700 },
  source: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 2, borderColor: colors.neutral200,
    padding: 14, paddingHorizontal: 16, ...shadow.sm,
  },
  sourceBusy: { opacity: 0.6 },
  sourceIcon: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: colors.accent100,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text },
  sourceHint: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  attached: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 14, paddingHorizontal: 16,
  },
  attachedIcon: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  attachedName: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  attachedMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.accent2_800 },
  remove: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 14, color: colors.accent700 },
  errorCard: {
    backgroundColor: colors.accent100, borderRadius: radius.md, borderWidth: 2,
    borderColor: colors.accent300, padding: 14,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  typeLink: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.accent700 },
  inputWrap: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 4, gap: 4, ...shadow.sm },
  input: {
    minHeight: 130, borderRadius: radius.md, padding: 16,
    fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text,
  },
  inputFooterText: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, paddingHorizontal: 16, paddingBottom: 12 },
  dateCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, paddingHorizontal: 18, gap: 4, ...shadow.sm },
  dateCardLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  dateCardValue: { fontFamily: fonts.heading, fontSize: 22, color: colors.accent700 },
  dateCardSub: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700 },
});
