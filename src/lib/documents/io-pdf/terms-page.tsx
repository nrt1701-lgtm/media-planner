import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles } from './styles'

interface TermsPageProps {
  ioTermsTemplate: string
}

export function TermsPage({ ioTermsTemplate }: TermsPageProps) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.termsHeader}>Terms and Conditions</Text>

      <Text style={styles.termsBody}>
        {ioTermsTemplate || 'No terms and conditions have been configured. Please add IO terms in Agency Settings.'}
      </Text>

      <View style={styles.signaturesRow}>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Agency Representative</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>Signature / Name / Title</Text>
          <Text style={styles.signatureDateLabel}>Date</Text>
          <View style={styles.signatureDateLine} />
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Client Representative</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>Signature / Name / Title</Text>
          <Text style={styles.signatureDateLabel}>Date</Text>
          <View style={styles.signatureDateLine} />
        </View>
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  )
}
