from django.core.management.base import BaseCommand
from products.models import Category, Store


class Command(BaseCommand):
    help = 'Seeds the database with initial categories and Bulgarian stores'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Clear existing data (optional - comment out if you want to preserve)
        self.stdout.write('Clearing existing data...')
        Category.objects.all().delete()
        Store.objects.all().delete()

        # Create categories (hierarchical structure)
        self.stdout.write('Creating categories...')

        # Parent categories
        food = Category.objects.create(
            name='Food & Beverages',
            slug='food-beverages',
            icon='🍽️'
        )

        household = Category.objects.create(
            name='Household & Cleaning',
            slug='household-cleaning',
            icon='🧹'
        )

        personal_care = Category.objects.create(
            name='Personal Care & Beauty',
            slug='personal-care-beauty',
            icon='💄'
        )

        health = Category.objects.create(
            name='Health & Wellness',
            slug='health-wellness',
            icon='💊'
        )

        baby = Category.objects.create(
            name='Baby & Kids',
            slug='baby-kids',
            icon='👶'
        )

        pets = Category.objects.create(
            name='Pet Supplies',
            slug='pet-supplies',
            icon='🐾'
        )

        electronics = Category.objects.create(
            name='Electronics & Gadgets',
            slug='electronics-gadgets',
            icon='📱'
        )

        home = Category.objects.create(
            name='Home & Garden',
            slug='home-garden',
            icon='🏡'
        )

        # Food subcategories
        Category.objects.create(name='Dairy & Eggs', slug='dairy-eggs', parent=food, icon='🥛')
        Category.objects.create(name='Meat & Fish', slug='meat-fish', parent=food, icon='🥩')
        Category.objects.create(name='Fruits & Vegetables', slug='fruits-vegetables', parent=food, icon='🍎')
        Category.objects.create(name='Bread & Bakery', slug='bread-bakery', parent=food, icon='🍞')
        Category.objects.create(name='Beverages', slug='beverages', parent=food, icon='🥤')
        Category.objects.create(name='Snacks & Sweets', slug='snacks-sweets', parent=food, icon='🍫')
        Category.objects.create(name='Canned & Jarred', slug='canned-jarred', parent=food, icon='🥫')
        Category.objects.create(name='Frozen Foods', slug='frozen-foods', parent=food, icon='🧊')
        Category.objects.create(name='Pasta & Rice', slug='pasta-rice', parent=food, icon='🍝')
        Category.objects.create(name='Spices & Condiments', slug='spices-condiments', parent=food, icon='🧂')

        # Household subcategories
        Category.objects.create(name='Cleaning Supplies', slug='cleaning-supplies', parent=household, icon='🧴')
        Category.objects.create(name='Laundry', slug='laundry', parent=household, icon='👕')
        Category.objects.create(name='Paper Products', slug='paper-products', parent=household, icon='🧻')
        Category.objects.create(name='Kitchen Supplies', slug='kitchen-supplies', parent=household, icon='🍽️')

        # Personal Care subcategories
        Category.objects.create(name='Bath & Shower', slug='bath-shower', parent=personal_care, icon='🚿')
        Category.objects.create(name='Hair Care', slug='hair-care', parent=personal_care, icon='💇')
        Category.objects.create(name='Skin Care', slug='skin-care', parent=personal_care, icon='🧴')
        Category.objects.create(name='Oral Care', slug='oral-care', parent=personal_care, icon='🪥')
        Category.objects.create(name='Cosmetics', slug='cosmetics', parent=personal_care, icon='💄')
        Category.objects.create(name='Shaving', slug='shaving', parent=personal_care, icon='🪒')

        # Health subcategories
        Category.objects.create(name='Vitamins & Supplements', slug='vitamins-supplements', parent=health, icon='💊')
        Category.objects.create(name='First Aid', slug='first-aid', parent=health, icon='🩹')
        Category.objects.create(name='Pain Relief', slug='pain-relief', parent=health, icon='💊')

        # Baby subcategories
        Category.objects.create(name='Diapers & Wipes', slug='diapers-wipes', parent=baby, icon='🧷')
        Category.objects.create(name='Baby Food', slug='baby-food', parent=baby, icon='🍼')
        Category.objects.create(name='Baby Care', slug='baby-care', parent=baby, icon='👶')

        # Pet subcategories
        Category.objects.create(name='Pet Food', slug='pet-food', parent=pets, icon='🐕')
        Category.objects.create(name='Pet Care', slug='pet-care', parent=pets, icon='🐾')

        self.stdout.write(self.style.SUCCESS(f'✓ Created {Category.objects.count()} categories'))

        # Create Bulgarian stores
        self.stdout.write('Creating stores...')

        stores_data = [
            {
                'name': 'Kaufland',
                'chain': 'Kaufland',
                'primary_color': '#DC143C',
                'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Kaufland_201x_logo.svg/320px-Kaufland_201x_logo.svg.png',
                'website': 'https://www.kaufland.bg/',
                'is_active': True
            },
            {
                'name': 'Lidl',
                'chain': 'Lidl',
                'primary_color': '#0050AA',
                'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/320px-Lidl-Logo.svg.png',
                'website': 'https://www.lidl.bg/',
                'is_active': True
            },
            {
                'name': 'Billa',
                'chain': 'Billa',
                'primary_color': '#FFD700',
                'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Billa_Logo_2021.svg/320px-Billa_Logo_2021.svg.png',
                'website': 'https://www.billa.bg/',
                'is_active': True
            },
            {
                'name': 'Fantastico',
                'chain': 'Fantastico',
                'primary_color': '#E30613',
                'logo_url': None,
                'website': 'https://www.fantastico.bg/',
                'is_active': True
            },
            {
                'name': 'CBA',
                'chain': 'CBA',
                'primary_color': '#006CB7',
                'logo_url': None,
                'website': None,
                'is_active': True
            },
            {
                'name': 'T-Market',
                'chain': 'T-Market',
                'primary_color': '#ED1C24',
                'logo_url': None,
                'website': None,
                'is_active': True
            },
            {
                'name': 'Picadilly',
                'chain': 'Picadilly',
                'primary_color': '#009639',
                'logo_url': None,
                'website': None,
                'is_active': True
            },
            {
                'name': 'Penny Market',
                'chain': 'Penny Market',
                'primary_color': '#E2001A',
                'logo_url': None,
                'website': 'https://www.penny.bg/',
                'is_active': True
            },
            {
                'name': 'Metro',
                'chain': 'Metro',
                'primary_color': '#003C7E',
                'logo_url': None,
                'website': None,
                'is_active': True
            },
            {
                'name': 'Carrefour',
                'chain': 'Carrefour',
                'primary_color': '#0066B3',
                'logo_url': None,
                'website': None,
                'is_active': True
            },
        ]

        for store_data in stores_data:
            Store.objects.create(**store_data)

        self.stdout.write(self.style.SUCCESS(f'✓ Created {Store.objects.count()} stores'))

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'   • Categories: {Category.objects.count()} ({Category.objects.filter(parent=None).count()} parent, {Category.objects.exclude(parent=None).count()} subcategories)')
        self.stdout.write(f'   • Stores: {Store.objects.count()}')
