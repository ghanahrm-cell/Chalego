import {
  Bike,
  Building2,
  Car,
  CarFront,
  Construction,
  Hotel,
  Package,
  Plane,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export type FieldType = 'text' | 'date' | 'time' | 'number' | 'select' | 'location' | 'airport' | 'city'

export type BookingField = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: string[]
}

export type Division = {
  slug: string
  name: string
  shortName: string
  icon: LucideIcon
  image: string
  tagline: string
  description: string
  categoriesLabel: string
  categories: string[]
  features: string[]
  partnerCta: string
  partnerAudience: string
  phase: number
  ctaLabel: string
  fields: BookingField[]
}

export const DIVISIONS: Division[] = [
  {
    slug: 'rides',
    name: 'Ride Hailing',
    shortName: 'Ride',
    icon: Car,
    image: '/images/ride.png',
    tagline: 'Safe, verified rides across the city — in minutes.',
    description:
      'Request an instant or scheduled ride with verified drivers, upfront fare estimates, live GPS tracking and in-app support from pickup to drop-off.',
    categoriesLabel: 'Ride categories',
    categories: ['Economy', 'Comfort', 'Premium', 'SUV', 'XL / Group', 'Business', 'Executive'],
    features: [
      'Upfront fare estimation',
      'Live GPS trip tracking',
      'Scheduled rides',
      'Automated driver matching',
      'In-app driver messaging',
      'Electronic receipts',
      'Ratings and reviews',
      'Emergency assistance',
    ],
    partnerCta: 'Drive with CHALEGO',
    partnerAudience: 'Licensed drivers with a roadworthy vehicle',
    phase: 3,
    ctaLabel: 'See prices',
    fields: [
      { name: 'pickup', label: 'Pickup', type: 'location', placeholder: 'Enter pickup location' },
      { name: 'destination', label: 'Destination', type: 'location', placeholder: 'Where to?' },
      { name: 'category', label: 'Ride type', type: 'select', options: ['Economy', 'Comfort', 'Premium', 'SUV', 'XL / Group', 'Business', 'Executive'] },
      { name: 'when', label: 'When', type: 'select', options: ['Now', 'Schedule for later'] },
    ],
  },
  {
    slug: 'vehicle-rentals',
    name: 'Vehicle Rentals',
    shortName: 'Car Rental',
    icon: CarFront,
    image: '/images/car-suv.png',
    tagline: 'Self-drive or chauffeured — rent by the day, week or month.',
    description:
      'Browse verified cars from trusted fleets and private owners. Compare specifications, check availability and book with a transparent deposit and electronic rental agreement.',
    categoriesLabel: 'Vehicle categories',
    categories: ['Economy cars', 'Sedans', 'SUVs', 'Luxury cars', 'Pickup trucks', 'Vans', 'Buses', 'Commercial vehicles', 'Electric vehicles'],
    features: [
      'Daily, weekly and monthly rates',
      'Availability calendar',
      'Self-drive or with driver',
      'ID verification',
      'Transparent security deposits',
      'Electronic rental agreements',
      'Pickup and return management',
      'Damage reporting',
    ],
    partnerCta: 'List your vehicle',
    partnerAudience: 'Car owners and fleet companies',
    phase: 4,
    ctaLabel: 'Find vehicles',
    fields: [
      { name: 'city', label: 'Pickup city', type: 'city' },
      { name: 'category', label: 'Vehicle type', type: 'select', options: ['Economy cars', 'Sedans', 'SUVs', 'Luxury cars', 'Pickup trucks', 'Vans', 'Buses', 'Electric vehicles'] },
      { name: 'start', label: 'Pickup date', type: 'date' },
      { name: 'end', label: 'Return date', type: 'date' },
      { name: 'mode', label: 'Option', type: 'select', options: ['Self-drive', 'With driver'] },
    ],
  },
  {
    slug: 'truck-rentals',
    name: 'Truck Rentals',
    shortName: 'Trucks',
    icon: Truck,
    image: '/images/truck.png',
    tagline: 'The right truck for every load, from light-duty to tractor heads.',
    description:
      'Hire light, medium and heavy-duty trucks by the hour, day, week or month. Filter by load capacity and location, with driver-inclusive options and delivery to your site.',
    categoriesLabel: 'Truck categories',
    categories: ['Light-duty', 'Medium-duty', 'Heavy-duty', 'Flatbed', 'Box trucks', 'Refrigerated', 'Dump trucks', 'Tipper trucks', 'Container trucks', 'Tractor heads & trailers'],
    features: [
      'Load capacity details',
      'Hourly to monthly rentals',
      'Driver-inclusive options',
      'Booking calendar',
      'Location-based search',
      'Delivery and collection',
      'Rental agreements',
      'Fleet management tools',
    ],
    partnerCta: 'List your trucks',
    partnerAudience: 'Truck owners and haulage fleets',
    phase: 4,
    ctaLabel: 'Find trucks',
    fields: [
      { name: 'city', label: 'Location', type: 'city' },
      { name: 'category', label: 'Truck type', type: 'select', options: ['Light-duty', 'Medium-duty', 'Heavy-duty', 'Flatbed', 'Box truck', 'Refrigerated', 'Tipper', 'Container truck'] },
      { name: 'start', label: 'Start date', type: 'date' },
      { name: 'duration', label: 'Duration', type: 'select', options: ['Hourly', 'Daily', 'Weekly', 'Monthly'] },
    ],
  },
  {
    slug: 'cargo',
    name: 'Cargo & Logistics',
    shortName: 'Cargo',
    icon: Package,
    image: '/images/cargo.png',
    tagline: 'Move goods city-to-city with capacity-matched vehicles.',
    description:
      'Book cargo vehicles or full transportation for commercial goods, intercity freight and warehouse-to-destination delivery — with real-time tracking and proof of delivery.',
    categoriesLabel: 'Services',
    categories: ['Cargo vehicle rentals', 'Goods transportation', 'Commercial delivery', 'Intercity cargo', 'Business logistics', 'Warehouse-to-destination'],
    features: [
      'Cargo type, weight and dimensions',
      'Vehicle capacity matching',
      'Delivery scheduling',
      'Price estimation',
      'Driver assignment',
      'Real-time cargo tracking',
      'Proof of delivery',
      'Business shipment history',
    ],
    partnerCta: 'Become a cargo operator',
    partnerAudience: 'Logistics companies and cargo operators',
    phase: 5,
    ctaLabel: 'Get a quote',
    fields: [
      { name: 'pickup', label: 'Pickup address', type: 'location', placeholder: 'Warehouse or pickup point' },
      { name: 'destination', label: 'Delivery address', type: 'location', placeholder: 'Destination' },
      { name: 'cargoType', label: 'Cargo type', type: 'select', options: ['General goods', 'Building materials', 'Perishables', 'Electronics', 'Furniture', 'Industrial'] },
      { name: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 1500' },
      { name: 'date', label: 'Pickup date', type: 'date' },
    ],
  },
  {
    slug: 'moto-delivery',
    name: 'Moto Delivery',
    shortName: 'Delivery',
    icon: Bike,
    image: '/images/moto.png',
    tagline: 'Parcels, documents and packages delivered same day.',
    description:
      'Send anything across town with fast, tracked motorcycle couriers. Express, same-day and business delivery options with live rider tracking and proof of delivery.',
    categoriesLabel: 'Delivery types',
    categories: ['Parcel delivery', 'Document delivery', 'Food delivery', 'Shop-to-customer', 'Business deliveries', 'Express delivery', 'Same-day delivery'],
    features: [
      'Instant delivery fee',
      'Rider matching',
      'Live rider tracking',
      'Status updates',
      'Proof of delivery',
      'Business delivery accounts',
      'Rider earnings dashboard',
      'Customer ratings',
    ],
    partnerCta: 'Ride as a courier',
    partnerAudience: 'Licensed motorcycle riders',
    phase: 5,
    ctaLabel: 'Get delivery fee',
    fields: [
      { name: 'pickup', label: 'Pickup', type: 'location', placeholder: 'Pickup address' },
      { name: 'destination', label: 'Drop-off', type: 'location', placeholder: 'Drop-off address' },
      { name: 'size', label: 'Package size', type: 'select', options: ['Small (envelope)', 'Medium (shoebox)', 'Large (up to 20kg)'] },
      { name: 'speed', label: 'Speed', type: 'select', options: ['Express', 'Same-day', 'Scheduled'] },
    ],
  },
  {
    slug: 'equipment-rentals',
    name: 'Machine & Equipment',
    shortName: 'Equipment',
    icon: Construction,
    image: '/images/excavator.png',
    tagline: 'Heavy machinery for construction, mining and agriculture.',
    description:
      'Rent excavators, cranes, loaders, generators and more from verified owners — with operator-inclusive options, delivery to site, condition reports and maintenance records.',
    categoriesLabel: 'Equipment categories',
    categories: ['Excavators', 'Bulldozers', 'Wheel loaders', 'Cranes', 'Forklifts', 'Graders', 'Rollers', 'Concrete mixers', 'Generators', 'Agricultural', 'Mining', 'Construction'],
    features: [
      'Hourly to monthly rates',
      'Operator-inclusive rentals',
      'Availability calendar',
      'Customer verification',
      'Security deposits',
      'Delivery to site',
      'Maintenance records',
      'Condition reports',
    ],
    partnerCta: 'List your equipment',
    partnerAudience: 'Equipment owners and construction companies',
    phase: 6,
    ctaLabel: 'Find equipment',
    fields: [
      { name: 'city', label: 'Site location', type: 'city' },
      { name: 'category', label: 'Equipment', type: 'select', options: ['Excavator', 'Bulldozer', 'Wheel loader', 'Crane', 'Forklift', 'Grader', 'Roller', 'Concrete mixer', 'Generator'] },
      { name: 'start', label: 'Start date', type: 'date' },
      { name: 'operator', label: 'Operator', type: 'select', options: ['With operator', 'Without operator'] },
    ],
  },
  {
    slug: 'hotels',
    name: 'Hotel Booking',
    shortName: 'Hotels',
    icon: Hotel,
    image: '/images/hotel.png',
    tagline: 'Hotels, resorts, lodges and guesthouses across Africa.',
    description:
      'Search by location, price and rating. Compare rooms and amenities, read verified guest reviews and book instantly with secure payments and clear cancellation policies.',
    categoriesLabel: 'Property types',
    categories: ['Hotels', 'Resorts', 'Boutique hotels', 'Guesthouses', 'Lodges', 'Business hotels'],
    features: [
      'Room categories and availability',
      'Search by price and rating',
      'Amenity filters',
      'Verified guest reviews',
      'Instant booking',
      'Secure online payments',
      'Cancellation and refunds',
      'Hotel owner dashboard',
    ],
    partnerCta: 'List your property',
    partnerAudience: 'Hotels, resorts, guesthouses and lodges',
    phase: 7,
    ctaLabel: 'Search hotels',
    fields: [
      { name: 'city', label: 'Destination', type: 'city' },
      { name: 'checkIn', label: 'Check-in', type: 'date' },
      { name: 'checkOut', label: 'Check-out', type: 'date' },
      { name: 'guests', label: 'Guests', type: 'number', placeholder: '2' },
    ],
  },
  {
    slug: 'apartments',
    name: 'Apartment Booking',
    shortName: 'Apartments',
    icon: Building2,
    image: '/images/apartment.png',
    tagline: 'Short stays and long lets in verified, furnished homes.',
    description:
      'From studios to luxury serviced apartments and holiday homes — with map-based search, daily to monthly pricing, house rules and host-verified listings.',
    categoriesLabel: 'Property categories',
    categories: ['Studio', 'One-bedroom', 'Two-bedroom', 'Three-bedroom', 'Luxury', 'Serviced', 'Furnished', 'Holiday homes', 'Short-stay', 'Long-term'],
    features: [
      'Map and location search',
      'Daily, weekly, monthly pricing',
      'Availability calendar',
      'Amenities and house rules',
      'Guest verification',
      'Secure online payments',
      'Reviews and ratings',
      'Host dashboard',
    ],
    partnerCta: 'Become a host',
    partnerAudience: 'Landlords, property managers and real estate firms',
    phase: 7,
    ctaLabel: 'Search apartments',
    fields: [
      { name: 'city', label: 'City', type: 'city' },
      { name: 'type', label: 'Apartment type', type: 'select', options: ['Studio', 'One-bedroom', 'Two-bedroom', 'Three-bedroom', 'Luxury', 'Serviced'] },
      { name: 'checkIn', label: 'Check-in', type: 'date' },
      { name: 'checkOut', label: 'Check-out', type: 'date' },
    ],
  },
  {
    slug: 'airport-transfers',
    name: 'Airport Transfers',
    shortName: 'Airport',
    icon: Plane,
    image: '/images/airport.png',
    tagline: 'Meet-and-greet pickups that track your flight.',
    description:
      'Pre-book airport pickups and drop-offs at Kotoka, Murtala Muhammed and Nnamdi Azikiwe — with flight-aware scheduling, luggage planning and VIP, corporate and group options.',
    categoriesLabel: 'Transfer types',
    categories: ['Airport pickup', 'Airport drop-off', 'Domestic transfer', 'International transfer', 'Corporate', 'VIP', 'Group', 'Scheduled'],
    features: [
      'Flight number tracking',
      'Arrival and departure planning',
      'Passenger and luggage details',
      'Vehicle selection',
      'Fixed or estimated pricing',
      'Driver assignment',
      'Live driver tracking',
      'Booking notifications',
    ],
    partnerCta: 'Drive airport transfers',
    partnerAudience: 'Professional chauffeurs and executive fleets',
    phase: 3,
    ctaLabel: 'Get transfer price',
    fields: [
      { name: 'airport', label: 'Airport', type: 'airport' },
      { name: 'direction', label: 'Transfer', type: 'select', options: ['Pickup from airport', 'Drop-off at airport'] },
      { name: 'flight', label: 'Flight number', type: 'text', placeholder: 'e.g. KQ510' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'passengers', label: 'Passengers', type: 'number', placeholder: '1' },
    ],
  },
  {
    slug: 'food',
    name: 'Food Delivery',
    shortName: 'Food',
    icon: UtensilsCrossed,
    image: '/images/food-jollof.png',
    tagline: 'Your favourite restaurants and vendors, delivered hot.',
    description:
      'Order from restaurants, food vendors and supermarkets. Build your cart, add special instructions, and track your rider live from kitchen to doorstep.',
    categoriesLabel: 'Popular categories',
    categories: ['Local dishes', 'Grills', 'Fast food', 'Breakfast', 'Seafood', 'Vegetarian', 'Desserts', 'Groceries'],
    features: [
      'Digital menus with photos',
      'Multi-item cart',
      'Custom food instructions',
      'Pickup or delivery',
      'Live order status',
      'Live rider tracking',
      'Promotions and discount codes',
      'Restaurant dashboard',
    ],
    partnerCta: 'Partner your restaurant',
    partnerAudience: 'Restaurants, food vendors and supermarkets',
    phase: 8,
    ctaLabel: 'Find food',
    fields: [
      { name: 'address', label: 'Delivery address', type: 'location', placeholder: 'Enter your address' },
      { name: 'category', label: 'Craving', type: 'select', options: ['Local dishes', 'Grills', 'Fast food', 'Breakfast', 'Seafood', 'Vegetarian', 'Desserts'] },
      { name: 'mode', label: 'Option', type: 'select', options: ['Delivery', 'Pickup'] },
    ],
  },
]

export function getDivision(slug: string) {
  return DIVISIONS.find((d) => d.slug === slug)
}
