export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets'
  image: string
  lines: string[]
}

export const PRODUCT_BRANDS: ProductBrand[] = [
  {
    key: 'contour-next',
    label: 'Contour Next',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: ['Contour Next'],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: ['Guide', 'Aviva', 'SmartView'],
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
    lines: ['Verio', 'Ultra', 'Other OneTouch'],
  },
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: ['G6 Sensors', 'G6 Transmitters', 'G7 Sensors', 'G7 Receivers'],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: ['Libre 1', 'Libre 2', 'Libre 3'],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: ['5 Pods (5-box)', 'DASH Pods (5-box)', 'Classic Pods (10-box)'],
  },
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: ['AutoSoft 90', 'AutoSoft XC', 'Quick-set', 'Guardian Sensor', 'MiniMed Pumps & Sets'],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: ['t:slim X2'],
  },
]
