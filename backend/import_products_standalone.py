#!/usr/bin/env python
"""
Standalone script to import products from bg_products_final.jsonl
Can be run directly without Django management commands.

Usage:
    cd backend
    python import_products_standalone.py [--dry-run]
"""

import os
import sys
import json
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Product


def import_products(dry_run=False, batch_size=500):
    """Import products from JSONL file"""

    # File path
    jsonl_file = 'products/bg_products_final.jsonl'

    if not os.path.exists(jsonl_file):
        print(f'❌ Error: File not found: {jsonl_file}')
        return False

    print(f'📂 Reading from: {jsonl_file}')
    print(f'🔍 Dry run: {dry_run}')
    print(f'📦 Batch size: {batch_size}\n')

    # Statistics
    total_lines = 0
    successful = 0
    skipped = 0
    errors = 0
    error_details = []

    products_to_create = []

    try:
        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, start=1):
                total_lines += 1
                line = line.strip()

                if not line:
                    continue

                try:
                    # Parse JSON
                    data = json.loads(line)

                    # Extract fields (handle None values)
                    barcode = (data.get('barcode') or '').strip()
                    product_name = (data.get('product_name') or '').strip()
                    brand = (data.get('brand') or '').strip()
                    image_url = (data.get('image_url') or '').strip()

                    # Validate required fields
                    if not barcode:
                        skipped += 1
                        error_details.append(f"Line {line_num}: Missing barcode")
                        continue

                    if not product_name:
                        skipped += 1
                        error_details.append(f"Line {line_num}: Missing product_name")
                        continue

                    # Check for duplicates
                    if Product.objects.filter(barcode=barcode).exists():
                        skipped += 1
                        continue

                    # Create product object
                    product = Product(
                        barcode=barcode,
                        name=product_name[:255],
                        brand=brand[:100] if brand else '',
                        image_url=image_url if image_url else None,
                        status='approved',
                        category=None,
                        description='',
                        created_by=None,
                    )

                    products_to_create.append(product)
                    successful += 1

                    # Batch insert
                    if len(products_to_create) >= batch_size:
                        if not dry_run:
                            Product.objects.bulk_create(
                                products_to_create,
                                ignore_conflicts=True
                            )
                        print(f'✅ Processed {successful} products...')
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
            print(f'✅ Processed final batch of {len(products_to_create)} products')

    except Exception as e:
        print(f'❌ Error reading file: {str(e)}')
        return False

    # Print summary
    print('\n' + '='*70)
    print('📊 IMPORT SUMMARY')
    print('='*70)
    print(f'Total lines read:         {total_lines}')
    print(f'✅ Successfully processed: {successful}')
    print(f'⊘ Skipped (duplicates):    {skipped}')
    print(f'❌ Errors:                 {errors}')
    print('='*70)

    if dry_run:
        print('\n⚠️  DRY RUN - No changes were committed to the database\n')
    else:
        print(f'\n✅ Successfully imported {successful} products to the database!\n')

    # Show first few errors
    if error_details:
        print('\n❌ ERROR DETAILS (first 10):')
        for detail in error_details[:10]:
            print(f'   - {detail}')
        if len(error_details) > 10:
            print(f'   ... and {len(error_details) - 10} more errors')

    return errors == 0


if __name__ == '__main__':
    # Check for --dry-run flag
    dry_run = '--dry-run' in sys.argv

    print('='*70)
    print('🚀 BG Products Import Script')
    print('='*70 + '\n')

    success = import_products(dry_run=dry_run)

    sys.exit(0 if success else 1)
