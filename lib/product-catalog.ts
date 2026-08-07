export type ProductLine = {
  label: string
  code?: string
}

export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: ProductLine[]
}

const line = (label: string, code?: string): ProductLine => (code ? { label, code } : { label })

export const PRODUCT_BRANDS: ProductBrand[] = [
  // Test Strips
  {
    key: 'contour',
    label: 'Contour / Bayer',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: [line('Contour 50ct'), line('Contour 100ct'), line('Contour NEXT 50ct'), line('Contour NEXT 100ct')],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: [line('Aviva Plus 50ct'), line('Aviva Plus 100ct'), line('Guide 50ct'), line('Guide 100ct'), line('SmartView')],
  },
  {
    key: 'true-metrix',
    label: 'True Metrix',
    category: 'Test Strips',
    image: '/products/true-metrix.jpg',
    lines: [line('True Metrix')],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Test Strips',
    image: '/products/onetouch.jpg',
    lines: [line('Ultra 50ct'), line('Ultra 100ct'), line('VERIO 50ct'), line('VERIO 100ct')],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Test Strips',
    image: '/products/freestyle.jpg',
    lines: [line('Lite 50ct'), line('Lite 100ct'), line('InsuLinx 50ct'), line('InsuLinx 100ct')],
  },
  // CGM
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: [
      line('G6 Receivers'),
      line('G6 Sensors', 'STS-OE-001 / STS-OR-001'),
      line('G6 Transmitters'),
      line('G7 10 Day Sensors', 'STP-AT-011 / -012 / -018'),
      line('G7 15 Day Sensors', 'STP-FT-010 / -012'),
      line('G7 Receivers'),
    ],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: [
      line('Libre 14 Day Sensor'),
      line('Libre 2 Sensor'),
      line('Libre 2 Plus Sensor'),
      line('Libre 2 Reader'),
      line('Libre 3 Sensor'),
      line('Libre 3 Plus Sensor'),
      line('Libre 3 Reader'),
    ],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: [
      line('5 (Purple) G6/G7'),
      line('5 (Purple) G6/L2'),
      line('5 (Purple) L2/L3'),
      line('5 Starter Kit (w/ PDM)'),
      line('DASH (5 Pack Pods)'),
    ],
  },
  {
    key: 'medtronic-guardian',
    label: 'Medtronic Guardian',
    category: 'CGM',
    image: '/products/medtronic.jpg',
    lines: [line('Guardian Sensor 3'), line('Guardian Sensor 4')],
  },
  // Infusion Sets
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: [
      line('AutoSoft 90'),
      line('AutoSoft XC'),
      line('Extended Infusion Set (10x)'),
      line('Mio Advance'),
      line('Mio Infusion Set'),
      line('Quick-Set'),
      line('Reservoir'),
    ],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: [line('AutoSoft 90 Infusion Set'), line('AutoSoft XC Infusion Set'), line('TruSteel Infusion Set')],
  },
  // Lancets
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Lancets',
    image: '/products/accu-chek.jpg',
    lines: [line('Fastclix'), line('Softclix')],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Lancets',
    image: '/products/onetouch.jpg',
    lines: [line('Delica Plus'), line('Ultrasoft 2')],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Lancets',
    image: '/products/freestyle.jpg',
    lines: [line('Lancets')],
  },
  {
    key: 'microlet',
    label: 'Microlet',
    category: 'Lancets',
    image: '/products/microlet.jpg',
    lines: [line('Lancets')],
  },
]
