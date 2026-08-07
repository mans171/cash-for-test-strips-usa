export type ProductLine = {
  label: string
  code?: string
  image: string
}

export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: ProductLine[]
}

const line = (label: string, image: string, code?: string): ProductLine => (code ? { label, image, code } : { label, image })

export const PRODUCT_BRANDS: ProductBrand[] = [
  // Test Strips
  {
    key: 'contour',
    label: 'Contour / Bayer',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: [
      line('Contour 50ct', '/products/lines/contour-50ct.jpg'),
      line('Contour 100ct', '/products/lines/contour-100ct.jpg'),
      line('Contour NEXT 50ct', '/products/lines/contour-next-50ct.jpg'),
      line('Contour NEXT 100ct', '/products/lines/contour-next-100ct.jpg'),
    ],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: [
      line('Aviva Plus 50ct', '/products/lines/avivaplus-50ct.jpg'),
      line('Aviva Plus 100ct', '/products/lines/avivaplus-100ct.jpg'),
      line('Guide 50ct', '/products/lines/guide-50ct.jpg'),
      line('Guide 100ct', '/products/lines/guide-100ct.jpg'),
      line('SmartView', '/products/lines/smartview.jpg'),
    ],
  },
  {
    key: 'true-metrix',
    label: 'True Metrix',
    category: 'Test Strips',
    image: '/products/true-metrix.jpg',
    lines: [line('True Metrix', '/products/true-metrix.jpg')],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Test Strips',
    image: '/products/onetouch.jpg',
    lines: [
      line('Ultra 50ct', '/products/lines/onetouch-ultra-50ct.jpg'),
      line('Ultra 100ct', '/products/lines/onetouch-ultra-100ct.jpg'),
      line('VERIO 50ct', '/products/lines/onetouch-verio-50ct.jpg'),
      line('VERIO 100ct', '/products/lines/onetouch-verio-100ct.jpg'),
    ],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Test Strips',
    image: '/products/freestyle.jpg',
    lines: [
      line('Lite 50ct', '/products/lines/freestyle-lite-50ct.jpg'),
      line('Lite 100ct', '/products/lines/freestyle-lite-100ct.jpg'),
      line('InsuLinx 50ct', '/products/lines/freestyle-insulinx-50ct.jpg'),
      line('InsuLinx 100ct', '/products/lines/freestyle-insulinx-100ct.jpg'),
    ],
  },
  // CGM
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: [
      line('G6 Receivers', '/products/lines/dexcom-g6-receivers.jpg'),
      line('G6 Sensors', '/products/lines/dexcom-g6-sensors.jpg', 'STS-OE-001 / STS-OR-001'),
      line('G6 Transmitters', '/products/lines/dexcom-g6-transmitters.jpg'),
      line('G7 10 Day Sensors', '/products/lines/dexcom-g7-10day.jpg', 'STP-AT-011 / -012 / -018'),
      line('G7 15 Day Sensors', '/products/lines/dexcom-g7-15day.jpg', 'STP-FT-010 / -012'),
      line('G7 Receivers', '/products/lines/dexcom-g7-receivers.jpg'),
    ],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: [
      line('Libre 14 Day Sensor', '/products/lines/libre-14day-sensor.jpg'),
      line('Libre 2 Sensor', '/products/lines/libre-2-sensor.jpg'),
      line('Libre 2 Plus Sensor', '/products/lines/libre-2plus-sensor.jpg'),
      line('Libre 2 Reader', '/products/lines/libre-2-reader.jpg'),
      line('Libre 3 Sensor', '/products/lines/libre-3-sensor.jpg'),
      line('Libre 3 Plus Sensor', '/products/lines/libre-3plus-sensor.jpg'),
      line('Libre 3 Reader', '/products/lines/libre-3-reader.jpg'),
    ],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: [
      line('5 (Purple) G6/G7', '/products/lines/omnipod5-g6g7.jpg'),
      line('5 (Purple) G6/L2', '/products/lines/omnipod5-g6l2.jpg'),
      line('5 (Purple) L2/L3', '/products/lines/omnipod5-l2l3.jpg'),
      line('5 Starter Kit (w/ PDM)', '/products/lines/omnipod5-starterkit.jpg'),
      line('DASH (5 Pack Pods)', '/products/lines/omnipod-dash.jpg'),
    ],
  },
  {
    key: 'medtronic-guardian',
    label: 'Medtronic Guardian',
    category: 'CGM',
    image: '/products/medtronic.jpg',
    lines: [
      line('Guardian Sensor 3', '/products/lines/medtronic-guardian3.jpg'),
      line('Guardian Sensor 4', '/products/lines/medtronic-guardian4.jpg'),
    ],
  },
  // Infusion Sets
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: [
      line('AutoSoft 90', '/products/lines/medtronic-autosoft90.jpg'),
      line('AutoSoft XC', '/products/lines/medtronic-autosoftxc.jpg'),
      line('Extended Infusion Set (10x)', '/products/lines/medtronic-extended.jpg'),
      line('Mio Advance', '/products/lines/medtronic-mioadvance.jpg'),
      line('Mio Infusion Set', '/products/lines/medtronic-mio.jpg'),
      line('Quick-Set', '/products/lines/medtronic-quickset.jpg'),
      line('Reservoir', '/products/lines/medtronic-reservoir.jpg'),
    ],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: [
      line('AutoSoft 90 Infusion Set', '/products/lines/tandem-autosoft90.jpg'),
      line('AutoSoft XC Infusion Set', '/products/lines/tandem-autosoftxc.jpg'),
      line('TruSteel Infusion Set', '/products/lines/tandem-trusteel.jpg'),
    ],
  },
  // Lancets
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Lancets',
    image: '/products/accu-chek.jpg',
    lines: [
      line('Fastclix', '/products/lines/accuchek-fastclix.jpg'),
      line('Softclix', '/products/lines/accuchek-softclix.jpg'),
    ],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Lancets',
    image: '/products/onetouch.jpg',
    lines: [
      line('Delica Plus', '/products/lines/onetouch-delicaplus.jpg'),
      line('Ultrasoft 2', '/products/lines/onetouch-ultrasoft2.jpg'),
    ],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Lancets',
    image: '/products/lines/freestyle-lancets.jpg',
    lines: [line('Lancets', '/products/lines/freestyle-lancets.jpg')],
  },
  {
    key: 'microlet',
    label: 'Microlet',
    category: 'Lancets',
    image: '/products/microlet.jpg',
    lines: [line('Lancets', '/products/microlet.jpg')],
  },
]
