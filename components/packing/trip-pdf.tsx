"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { pdfFilename, type PdfBagGroup, type PdfEntry, type PdfViewModel } from "@/lib/pdf";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  header: { marginBottom: 18 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { marginTop: 4, fontSize: 10, color: "#555555" },
  progress: { marginTop: 2, fontSize: 10, color: "#555555" },
  section: { marginBottom: 14 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    paddingBottom: 4,
    marginBottom: 6,
  },
  groupName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  groupMeta: { fontSize: 9, color: "#555555" },
  overLimit: { color: "#b91c1c", fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#666666",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxTicked: { backgroundColor: "#111111", borderColor: "#111111" },
  tick: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  entryName: { flexGrow: 1, paddingRight: 8 },
  entryMeta: { fontSize: 9, color: "#555555" },
  emptyRow: { fontSize: 9, color: "#999999", paddingVertical: 3 },
  empty: { marginTop: 24, fontSize: 11, color: "#555555" },
});

function TickBox({ ticked }: { ticked: boolean }) {
  return (
    <View style={ticked ? [styles.checkbox, styles.checkboxTicked] : styles.checkbox}>
      {ticked ? <Text style={styles.tick}>X</Text> : null}
    </View>
  );
}

function EntryRow({ entry }: { entry: PdfEntry }) {
  const meta = [
    entry.category === null ? null : ITEM_CATEGORY_LABELS[entry.category],
    entry.qty > 1 ? `x${entry.qty}` : null,
    entry.weightLabel,
  ]
    .filter((part): part is string => part !== null)
    .join("  |  ");

  return (
    <View style={styles.row} wrap={false}>
      <TickBox ticked={entry.ticked} />
      <Text style={styles.entryName}>{entry.name}</Text>
      {meta ? <Text style={styles.entryMeta}>{meta}</Text> : null}
    </View>
  );
}

function EntryList({ entries }: { entries: PdfEntry[] }) {
  if (entries.length === 0) return <Text style={styles.emptyRow}>Nothing here yet.</Text>;
  return (
    <>
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} />
      ))}
    </>
  );
}

function GroupHeader({ title, meta, alert }: { title: string; meta?: string; alert?: boolean }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupName}>{title}</Text>
      {meta ? (
        <Text style={alert ? [styles.groupMeta, styles.overLimit] : styles.groupMeta}>{meta}</Text>
      ) : null}
    </View>
  );
}

function BagGroupView({ group }: { group: PdfBagGroup }) {
  const parts = [group.weightComplete ? group.weightLabel : `${group.weightLabel} (incomplete)`];
  if (group.limitLabel) parts.push(`limit ${group.limitLabel}`);
  if (group.overLimit) parts.push("over limit");

  return (
    <View style={[styles.section, { marginLeft: group.depth * 14 }]} wrap={false}>
      <GroupHeader title={group.name} meta={parts.join("  |  ")} alert={group.overLimit} />
      <EntryList entries={group.entries} />
    </View>
  );
}

export function TripPdfDocument({ model }: { model: PdfViewModel }) {
  return (
    <Document title={model.tripName} author="Pack Mate" creator="Pack Mate">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{model.tripName}</Text>
          {model.dates ? <Text style={styles.subtitle}>{model.dates}</Text> : null}
          <Text style={styles.progress}>
            {model.packed} of {model.total} packed
          </Text>
        </View>

        {model.isEmpty ? (
          <Text style={styles.empty}>This packing list is empty.</Text>
        ) : (
          <>
            {model.bags.map((group) => (
              <BagGroupView key={group.id} group={group} />
            ))}
            {model.withMe.length > 0 ? (
              <View style={styles.section} wrap={false}>
                <GroupHeader title="With Me" />
                <EntryList entries={model.withMe} />
              </View>
            ) : null}
            {model.loose.length > 0 ? (
              <View style={styles.section} wrap={false}>
                <GroupHeader title="Not assigned" />
                <EntryList entries={model.loose} />
              </View>
            ) : null}
          </>
        )}
      </Page>
    </Document>
  );
}

export async function downloadTripPdf(model: PdfViewModel): Promise<void> {
  const blob = await pdf(<TripPdfDocument model={model} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = pdfFilename(model.tripName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
