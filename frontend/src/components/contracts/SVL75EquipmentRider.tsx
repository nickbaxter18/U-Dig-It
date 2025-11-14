/**
 * SVL75-3 Equipment Rider PDF Generator
 * Professional equipment-specific rider document for Kubota SVL75-3
 */

import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import React from 'react';

// Register fonts for professional appearance
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2',
      fontWeight: 700,
    },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #E1BC56',
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#A90F0F',
    textAlign: 'center',
    marginBottom: 10,
  },
  documentInfo: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderLeft: '3px solid #E1BC56',
  },
  subsection: {
    marginLeft: 15,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 600,
  },
  italic: {
    fontWeight: 400,
  },
  list: {
    marginLeft: 20,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    marginRight: 5,
  },
  table: {
    marginVertical: 10,
    border: '1px solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 600,
  },
  tableCell: {
    padding: 6,
    flex: 1,
    fontSize: 9,
  },
  tableLabel: {
    flex: 1.5,
    fontWeight: 600,
  },
  tableValue: {
    flex: 2,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: 4,
    padding: 10,
    marginVertical: 10,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 9,
    color: '#78350F',
  },
  signatureSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #ddd',
  },
  signatureLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  signatureField: {
    flex: 1,
    marginRight: 15,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  signatureInput: {
    borderBottom: '1px solid #1a1a1a',
    paddingTop: 15,
    minHeight: 30,
  },
  initialsBox: {
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    backgroundColor: '#fafafa',
  },
  initialsText: {
    fontSize: 9,
    fontWeight: 600,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
    borderTop: '1px solid #ddd',
    paddingTop: 8,
  },
  pageNumber: {
    fontSize: 7,
    color: '#999',
    textAlign: 'right',
  },
});

interface RiderData {
  serialNumber?: string;
  hoursAtRelease?: number;
  attachments?: string[];
  rentalStart?: string;
  rentalEnd?: string;
  hourAllowanceDaily?: number;
  hourAllowanceWeekly?: number;
  overageRate?: number;
  deliveryIncluded?: boolean;
  pickupIncluded?: boolean;
  deliveryFee?: number;
  renterName?: string;
  renterPhone?: string;
  renterCompany?: string;
  conditionNotes?: string;
  signatureImage?: string;
  signedDate?: string;
  ownerSignedDate?: string;
  ownerSignatureImage?: string;
}

const SVL75EquipmentRiderDocument: React.FC<{ data?: RiderData }> = ({ data = {} }) => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EQUIPMENT-SPECIFIC RIDER</Text>
          <Text style={styles.subtitle}>2025 Kubota SVL75-3 Compact Track Loader</Text>
          {data.signatureImage && (
            <View
              style={{
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                padding: 8,
                marginTop: 10,
                borderRadius: 15,
                alignSelf: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 11 }}>
                ✓ SIGNED & EXECUTED
              </Text>
            </View>
          )}
          <Text style={styles.documentInfo}>
            Document ID: UDIR-SVL75-3-RIDER | Version: 1.0 | Effective: Aug 22, 2025
          </Text>
        </View>

        {/* Important Notice */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ IMPORTANT LEGAL NOTICE</Text>
          <Text style={styles.warningText}>
            This Rider is incorporated into and made part of the U-Dig It Rentals Inc. Rental
            Agreement. If there is any conflict, the stricter term (greater safety/financial
            protection) applies unless otherwise agreed in writing by U-Dig It Rentals Inc.
            ("Owner").
          </Text>
        </View>

        {/* Section 1: Unit Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1) Unit Details</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Equipment</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                2025 Kubota SVL75-3 (Compact Track Loader)
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Serial/Unit ID</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.serialNumber || '____________________________________________'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Hours at Release</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.hoursAtRelease ? `${data.hoursAtRelease} h` : '__________ h'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Replacement Value</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                $120,000 CAD (base unit w/ bucket)
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Operating Weight</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                9,190 lb (4,169 kg) open cab / 9,420 lb (4,273 kg) closed cab
              </Text>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={[styles.paragraph, styles.bold]}>
              Transport Dimensions (machine only):
            </Text>
            <View style={styles.list}>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>Length (no bucket): 112 in (2,844 mm)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>Length (bucket on ground): 142.1 in (3,609 mm)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>Height (top of cab): 81.8 in (2,078 mm)</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>Vehicle width: 65.9 in (1,675 mm) standard / 69.1 in (1,755 mm) wide</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>Width with bucket: 68 in (1,727 mm)</Text>
              </View>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Included Attachments</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.attachments?.join(', ') || '____________________________________________'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Rental Start</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.rentalStart ||
                  '________________________________________________________________'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Rental End</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.rentalEnd ||
                  '________________________________________________________________'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Hour Allowance</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                {data.hourAllowanceDaily || 8} engine-hours/day, {data.hourAllowanceWeekly || 40}
                /week; excess billed at ${data.overageRate || 65}/hr
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Delivery/Pickup</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                By Owner: {data.deliveryIncluded ? 'Yes' : 'No'} | Customer Tow/Haul:{' '}
                {!data.deliveryIncluded ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabel]}>Float/Delivery Fee</Text>
              <Text style={[styles.tableCell, styles.tableValue]}>
                ${data.deliveryFee || 150} each way (total ${(data.deliveryFee || 150) * 2})
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 2: Insurance & Requirements */}
      <Page size="LETTER" style={styles.page}>
        {/* Section 2: Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2) Insurance (Required — "No COI, No Release")</Text>

          <Text style={styles.paragraph}>
            Renter must maintain, at Renter's expense, and provide evidence (COI + endorsements)
            approved by Owner before release and continuous through the Rental Period:
          </Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>CGL:</Text> ≥ $2,000,000 per occurrence, U-Dig It Rentals
                Inc. as Additional Insured, primary & non-contributory, waiver of subrogation.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Rented/Leased Equipment/Property:</Text> limit ≥ full
                replacement value above; U-Dig It Rentals Inc. as Loss Payee.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Automobile Liability:</Text> ≥ $1,000,000 if Renter
                transports on public roads.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Notice of Cancellation:</Text> insurer notice to Owner
                where available (e.g., 10–30 days).
              </Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Failure to maintain coverage is a material breach; Owner may refuse release or
              repossess at Renter's expense.
            </Text>
          </View>

          <Text style={[styles.paragraph, styles.italic]}>
            Need coverage? Visit: https://udigit.ca/getting-insurance/
          </Text>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 2 — Insurance): ________
            </Text>
          </View>
        </View>

        {/* Section 3: Transport & Tie-Down */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3) Transport & Tie-Down</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Professional loading/unloading only; no one in cab during load/unload.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Trailer, hitch, tow vehicle, chains/binders & straps must be properly rated; minimum
                4-point tie-down on the machine; secure attachments separately.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Verify overhead/bridge/width/weight limits; obtain permits where required.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                No public-road operation of the machine unless legally permitted.
              </Text>
            </View>
          </View>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 3 — Transport & Tie-Down): ________
            </Text>
          </View>
        </View>

        {/* Section 4: Operating Limits & Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4) Operating Limits & Safety</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Max grade/slope:</Text> ≤ 25°. Travel straight up/down;
                avoid side-hilling.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                No riders; never lift/carry people; use manufacturer arm support/lock for work under
                raised arms.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>PPE:</Text> CSA boots, hi-viz, eye/ear protection; hard
                hat where overhead hazards exist.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Utility locates completed and on site before ground disturbance; maintain clearance
                from buried/overhead utilities.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Follow Operator's Manual, decals, and site rules; stop if unsafe and contact Owner.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                No impairment (alcohol/cannabis/drugs); competent adult operators (21+) only.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                No sub-rental or lending without Owner's written consent.
              </Text>
            </View>
          </View>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 4 — Operating Limits & Safety): ________
            </Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 3: Prohibited Uses & Care */}
      <Page size="LETTER" style={styles.page}>
        {/* Section 5: Prohibited Uses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5) Prohibited Uses</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Demolition beyond rated capability; impact/ramming; lifting people or non-approved
                man-baskets.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Hazmat/contamination (fuel spills, sewage, creosote, asbestos, etc.).
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Operation in saltwater/surf, deep mud beyond track height, or fire areas without
                written approval.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Alterations, disabling safety devices, or removing telematics/GPS.
              </Text>
            </View>
          </View>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 5 — Prohibited Uses): ________
            </Text>
          </View>
        </View>

        {/* Section 6: Care & Maintenance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6) Care & Maintenance</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>Keep loads/attachments low and within rated capacity.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Daily pre-start inspection; grease per manual; check fluids, tracks, safety devices.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Report defects immediately; tag-out unsafe equipment—do not continue use.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>Renter responsible for fuel and basic cleaning.</Text>
            </View>
          </View>
        </View>

        {/* Section 7: Damage, Loss, Theft & Environmental */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7) Damage, Loss, Theft & Environmental</Text>

          <Text style={styles.paragraph}>
            Renter is responsible for all damage, loss, theft, vandalism, contamination,
            recovery/winch-out, and down-time per the Rental Agreement.
          </Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Tracks, cutting edges, teeth, glass, hoses, lights, hydraulic couplers and cab
                interior are billable if beyond normal wear.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Theft/vandalism:</Text> notify police and Owner
                immediately & provide report number.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Spills/contamination:</Text> immediate containment and
                cleanup at Renter's expense.
              </Text>
            </View>
          </View>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 7 — Damage/Loss/Theft & Environmental): ________
            </Text>
          </View>
        </View>

        {/* Section 8: Financial Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8) Financial Terms</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Deposit / Pre-Authorization (Security Hold):</Text> $500
                taken at booking/release; applied to fuel/cleaning/minor
                damage/consumables/overages; does not cap liability.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Fuel:</Text> return full; otherwise flat $100 refuel
                charge (or actual fuel + service, whichever is greater).
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Cleaning:</Text> excessive mud/debris removal billed at
                $100 Flat Rate.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Delivery/Recovery/Standby:</Text> billed per posted rates;
                unsuccessful delivery due to site inaccessibility is billable.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Late Return/Holdover:</Text> additional day(s)
                automatically billed at current rates until returned.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                <Text style={styles.bold}>Optional LDW (if offered):</Text> Limited Damage Waiver is
                not insurance, has exclusions/deductible, and does not replace required liability
                insurance.
              </Text>
            </View>
          </View>

          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>
              Renter Initials (Section 8 — Financial Terms): ________
            </Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 4: Additional Terms & Signatures */}
      <Page size="LETTER" style={styles.page}>
        {/* Section 9: Telematics, Photos & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9) Telematics, Photos & Privacy</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Owner may use GPS/telematics/engine-hour data for location, hour tracking,
                diagnostics, and recovery.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Renter consents to pre- and post-rental photos/video for condition documentation.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 10: Site & Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10) Site & Access</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Renter provides safe, level access for delivery, operation, and pickup.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Snow/ice/mud management is Renter's responsibility unless purchased as a service.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Do not operate on newly poured asphalt/concrete without protection; surface damage
                is billable.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 11: Return Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11) Return Condition</Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Park level, bucket/attachment down, brake set; record hour meter.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Clean radiator/engine bay of debris; remove mud from tracks/undercarriage.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={{ flex: 1 }}>
                Return all attachments, keys, manuals, and accessories.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 12: Remedies & Repossession */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12) Remedies & Repossession</Text>

          <Text style={styles.paragraph}>
            Upon breach or unsafe use, Owner may suspend operation and repossess immediately without
            notice.
          </Text>

          <Text style={styles.paragraph}>
            Owner is not liable for consequential or incidental damages; total liability shall not
            exceed amounts received for the specific rental, except for damage caused by Owner's
            gross negligence or willful misconduct.
          </Text>
        </View>

        {/* Section 13: Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13) Governing Law</Text>

          <Text style={styles.paragraph}>
            This Rider and the Rental Agreement are governed by the laws of the Province of New
            Brunswick, Canada.
          </Text>
        </View>

        {/* Section 14: Acceptance & Authority to Charge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14) Acceptance & Authority to Charge</Text>

          <Text style={styles.paragraph}>
            By signing below, Renter acknowledges and agrees that:
          </Text>

          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(i)</Text>
              <Text style={{ flex: 1 }}>
                the equipment has been received in good condition (unless noted on the Pre-Rental
                Condition Notes);
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(ii)</Text>
              <Text style={{ flex: 1 }}>this Rider forms part of the Rental Agreement;</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(iii)</Text>
              <Text style={{ flex: 1 }}>
                Renter has read this Rider and the Rental Agreement in full;
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(iv)</Text>
              <Text style={{ flex: 1 }}>
                Renter understands the Insurance requirement ("No COI, No Release"), the Operating
                Limits & Safety rules (including max 25° slope and utility locates), and the
                Prohibited Uses;
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(v)</Text>
              <Text style={{ flex: 1 }}>
                Renter is responsible for damage, loss, theft, contamination, and downtime as
                stated;
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(vi)</Text>
              <Text style={{ flex: 1 }}>
                the $500 deposit is a pre-authorization and is not a cap on liability;
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(vii)</Text>
              <Text style={{ flex: 1 }}>
                Renter authorizes U-Dig It Rentals Inc. to charge the card on file for fuel ($100 if
                not full), cleaning, over-hours, recovery, and any other amounts due under this
                Rider and the Rental Agreement; and
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>(viii)</Text>
              <Text style={{ flex: 1 }}>
                any optional LDW is not liability insurance and has exclusions.
              </Text>
            </View>
          </View>
        </View>

        {/* Pre-Rental Condition Notes */}
        <View style={styles.section}>
          <Text style={[styles.paragraph, styles.bold]}>
            Pre-Rental Condition Notes (photos attached):
          </Text>
          <View style={styles.signatureInput}>
            <Text>{data.conditionNotes || ''}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Renter Name:</Text>
              <View style={styles.signatureInput}>
                <Text>{data.renterName || ''}</Text>
              </View>
            </View>

            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Date:</Text>
              <View style={styles.signatureInput}>
                <Text>{data.signedDate || today}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signatureLine}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Signature:</Text>
              <View style={styles.signatureInput}>
                {data.signatureImage && (
                  <Image
                    src={data.signatureImage}
                    style={{ maxHeight: 40, maxWidth: 200, objectFit: 'contain' }}
                  />
                )}
              </View>
            </View>

            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Phone:</Text>
              <View style={styles.signatureInput}>
                <Text>{data.renterPhone || ''}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signatureLine}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Company (if any):</Text>
              <View style={styles.signatureInput}>
                <Text>{data.renterCompany || ''}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signatureLine}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Owner: U-Dig It Rentals Inc.</Text>
              <View style={styles.signatureInput}>
                {data.signatureImage && <Text>U-Dig It Rentals Team</Text>}
              </View>
            </View>

            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Date:</Text>
              <View style={styles.signatureInput}>
                <Text>{data.ownerSignedDate || today}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.signatureLine, { marginTop: 15 }]}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Owner Representative:</Text>
              <View style={styles.signatureInput}>
                {data.signatureImage && <Text>See above</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            U-Dig It Rentals Inc. | Saint John, New Brunswick, Canada | Phone: (506) 555-RENT
          </Text>
          <Text>Document ID: UDIR-SVL75-3-RIDER | Version: 1.0 | Effective: Aug 22, 2025</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

// Export component and helper function
export default SVL75EquipmentRiderDocument;

// Helper function to generate and download the PDF
export async function generateSVL75Rider(data?: RiderData): Promise<Blob> {
  const doc = <SVL75EquipmentRiderDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Helper function to download the PDF
export async function downloadSVL75Rider(
  data?: RiderData,
  filename = 'SVL75-3-Equipment-Rider.pdf'
): Promise<void> {
  const blob = await generateSVL75Rider(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
