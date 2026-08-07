export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: string[]
}

export const PRODUCT_BRANDS: ProductBrand[] = [
  // Test Strips
  {
    key: 'contour',
    label: 'Contour / Bayer',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: ['Contour 50ct', 'Contour 100ct', 'Contour NEXT 50ct', 'Contour NEXT 100ct'],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: ['Aviva Plus 50ct', 'Aviva Plus 100ct', 'Guide 50ct', 'Guide 100ct', 'SmartView'],
  },
  {
    key: 'true-metrix',
    label: 'True Metrix',
    category: 'Test Strips',
    image: '/products/true-metrix.jpg',
    lines: ['True Metrix'],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Test Strips',
    image: '/products/onetouch.jpg',
    lines: ['Ultra 50ct', 'Ultra 100ct', 'VERIO 50ct', 'VERIO 100ct'],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Test Strips',
    image: '/products/freestyle.jpg',
    lines: ['Lite 50ct', 'Lite 100ct', 'InsuLinx 50ct', 'InsuLinx 100ct'],
  },
  // CGM
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: [
      'G6 Receivers',
      'G6 Sensors (STS-OE-001 / STS-OR-001)',
      'G6 Transmitters',
      'G7 10 Day Sensors (STP-AT-011 / -012 / -018)',
      'G7 15 Day Sensors (STP-FT-010 / -012)',
      'G7 Receivers',
    ],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: ['Libre 14 Day Sensor', 'Libre 2 Sensor', 'Libre 2 Plus Sensor', 'Libre 2 Reader', 'Libre 3 Sensor', 'Libre 3 Plus Sensor', 'Libre 3 Reader'],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: ['5 (Purple) G6/G7', '5 (Purple) G6/L2', '5 (Purple) L2/L3', '5 Starter Kit (w/ PDM)', 'DASH (5 Pack Pods)'],
  },
  {
    key: 'medtronic-guardian',
    label: 'Medtronic Guardian',
    category: 'CGM',
    image: '/products/medtronic.jpg',
    lines: ['Guardian Sensor 3', 'Guardian Sensor 4'],
  },
  // Infusion Sets
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: ['AutoSoft 90', 'AutoSoft XC', 'Extended Infusion Set (10x)', 'Mio Advance', 'Mio Infusion Set', 'Quick-Set', 'Reservoir'],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: ['AutoSoft 90 Infusion Set', 'AutoSoft XC Infusion Set', 'TruSteel Infusion Set'],
  },
  // Lancets
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Lancets',
    image: '/products/accu-chek.jpg',
    lines: ['Fastclix', 'Softclix'],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Lancets',
    image: '/products/onetouch.jpg',
    lines: ['Delica Plus', 'Ultrasoft 2'],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Lancets',
    image: '/products/freestyle.jpg',
    lines: ['Lancets'],
  },
  {
    key: 'microlet',
    label: 'Microlet',
    category: 'Lancets',
    image: '/products/microlet.jpg',
    lines: ['Lancets'],
  },
]
