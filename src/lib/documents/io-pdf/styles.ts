import { StyleSheet } from '@react-pdf/renderer'

export const COLORS = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  text: '#1a1a1a',
  muted: '#6b7280',
  border: '#e5e7eb',
  headerBg: '#1e3a5f',
  headerText: '#ffffff',
  rowAlt: '#f9fafb',
  white: '#ffffff',
  channelColors: [
    '#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3',
    '#ede9fe', '#fee2e2', '#e0f2fe', '#f0fdf4',
  ],
}

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },

  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 64,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  coverLogo: {
    width: 120,
    height: 48,
    objectFit: 'contain',
    marginBottom: 32,
  },
  coverDivider: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    marginVertical: 24,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 32,
  },
  coverMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coverMetaLabel: {
    fontSize: 9,
    color: COLORS.muted,
    width: 120,
    fontFamily: 'Helvetica-Bold',
  },
  coverMetaValue: {
    fontSize: 9,
    color: COLORS.text,
    flex: 1,
  },
  coverFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverFooterText: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // Terms page
  termsHeader: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  termsBody: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: COLORS.text,
    marginBottom: 32,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 32,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
    marginBottom: 6,
    height: 1,
  },
  signatureName: {
    fontSize: 8,
    color: COLORS.muted,
  },
  signatureDateLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 12,
    marginBottom: 24,
  },
  signatureDateLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
    height: 1,
    width: 120,
  },

  // Flowchart
  flowchartPage: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  flowchartTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
  },
  tableHeaderCell: {
    color: COLORS.headerText,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#3b5998',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.rowAlt,
  },
  channelHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
  },
  channelHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    padding: 4,
    color: COLORS.primary,
  },
  tableCell: {
    fontSize: 7,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f4ff',
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  totalCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    color: COLORS.primary,
  },

  // Page number
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.muted,
  },
})
