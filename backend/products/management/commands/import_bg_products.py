"""
Django management command to import products from bg_products_final.jsonl

Usage:
    python manage.py import_bg_products [--dry-run] [--batch-size=500]

Options:
    --dry-run: Test the import without committing to database
    --batch-size: Number of products to insert in each batch (default: 500)
"""

import json
import os
from django.core.management.base import BaseCommand, CommandError
from products.models import Product
from django.conf import settings


class Command(BaseCommand):
    help = 'Import products from bg_products_final.jsonl file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without committing changes to database',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of products to insert in each batch (default: 500)',
        )
        parser.add_argument(
            '--file',
            type=str,
            default='backend/products/bg_products_final.jsonl',
            help='Path to JSONL file relative to project root',
        )

    def handle(self, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        jsonl_file = options['file']

        # Construct absolute path
        base_dir = settings.BASE_DIR.parent  # Go up one level from backend/
        file_path = os.path.join(base_dir, jsonl_file)

        # Check if file exists
        if not os.path.exists(file_path):
            raise CommandError(f'File not found: {file_path}')

        self.stdout.write(self.style.SUCCESS(f'Reading from: {file_path}'))
        self.stdout.write(self.style.SUCCESS(f'Dry run: {dry_run}'))
        self.stdout.write(self.style.SUCCESS(f'Batch size: {batch_size}\n'))

        # Statistics
        total_lines = 0
        successful = 0
        skipped = 0
        errors = 0
        error_details = []

        # Read and process file
        products_to_create = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, start=1):
                    total_lines += 1
                    line = line.strip()

                    if not line:
                        continue

                    try:
                        # Parse JSON
                        data = json.loads(line)

                        # Validate required fields (handle None values)
                        barcode = (data.get('barcode') or '').strip()
                        product_name = (data.get('product_name') or '').strip()
                        brand = (data.get('brand') or '').strip()
                        image_url = (data.get('image_url') or '').strip()

                        if not barcode:
                            skipped += 1
                            error_details.append(f"Line {line_num}: Missing barcode")
                            continue

                        if not product_name:
                            skipped += 1
                            error_details.append(f"Line {line_num}: Missing product_name")
                            continue

                        # Check if product already exists
                        if Product.objects.filter(barcode=barcode).exists():
                            skipped += 1
                            if options['verbosity'] >= 2:
                                self.stdout.write(
                                    self.style.WARNING(
                                        f"Line {line_num}: Barcode {barcode} already exists - skipping"
                                    )
                                )
                            continue

                        # Create product object (not saved yet)
                        product = Product(
                            barcode=barcode,
                            name=product_name[:255],  # Ensure max length
                            brand=brand[:100] if brand else '',  # Ensure max length
                            image_url=image_url if image_url else None,
                            status='approved',  # As requested
                            category=None,  # As requested
                            description='',
                            created_by=None,  # System import
                        )

                        products_to_create.append(product)
                        successful += 1

                        # Batch insert when we reach batch_size
                        if len(products_to_create) >= batch_size:
                            if not dry_run:
                                Product.objects.bulk_create(
                                    products_to_create,
                                    ignore_conflicts=True
                                )
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'✓ Processed {successful} products...'
                                )
                            )
                            products_to_create = []

                    except json.JSONDecodeError as e:
                        errors += 1
                        error_details.append(f"Line {line_num}: Invalid JSON - {str(e)}")
                    except Exception as e:
                        errors += 1
                        error_details.append(f"Line {line_num}: {str(e)}")

            # Insert remaining products
            if products_to_create:
                if not dry_run:
                    Product.objects.bulk_create(
                        products_to_create,
                        ignore_conflicts=True
                    )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Processed final batch of {len(products_to_create)} products'
                    )
                )

        except Exception as e:
            raise CommandError(f'Error reading file: {str(e)}')

        # Print summary
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('IMPORT SUMMARY'))
        self.stdout.write('='*70)
        self.stdout.write(f'Total lines read:     {total_lines}')
        self.stdout.write(self.style.SUCCESS(f'✓ Successfully processed: {successful}'))
        self.stdout.write(self.style.WARNING(f'⊘ Skipped (duplicates):  {skipped}'))
        self.stdout.write(self.style.ERROR(f'✗ Errors:                {errors}'))
        self.stdout.write('='*70)

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠ DRY RUN - No changes were committed to the database'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Successfully imported {successful} products to the database!'
                )
            )

        # Show error details if any
        if error_details and options['verbosity'] >= 2:
            self.stdout.write('\n' + self.style.ERROR('ERROR DETAILS:'))
            for detail in error_details[:20]:  # Show first 20 errors
                self.stdout.write(self.style.ERROR(f'  - {detail}'))
            if len(error_details) > 20:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ... and {len(error_details) - 20} more errors'
                    )
                )

        # Exit with appropriate code
        if errors > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠ Completed with {errors} errors. Review the output above.'
                )
            )
