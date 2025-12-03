# Product Import Guide

This guide explains how to import products from `bg_products_final.jsonl` into the database.

## File Format

The JSONL file contains one product per line in JSON format:

```json
{"barcode": "0054881008945", "brand": "Ahmad Tea London", "product_name": "ЗЕЛЕН ЧАЙ", "image_url": "https://images.openfoodfacts.org/images/products/..."}
```

## Import Details

- **Total products in file**: ~13,981
- **Status**: All products imported with `status='approved'`
- **Category**: Left empty (can be assigned later)
- **Duplicates**: Automatically skipped based on barcode
- **Batch processing**: 500 products per batch for efficiency

---

## Method 1: Django Management Command (Recommended)

### Test the import (dry-run):
```bash
cd backend
python manage.py import_bg_products --dry-run
```

### Run the actual import:
```bash
cd backend
python manage.py import_bg_products
```

### Custom options:
```bash
# Adjust batch size
python manage.py import_bg_products --batch-size=1000

# Verbose output
python manage.py import_bg_products -v 2

# Custom file path
python manage.py import_bg_products --file=path/to/file.jsonl
```

---

## Method 2: Standalone Script

### Test the import (dry-run):
```bash
cd backend
python import_products_standalone.py --dry-run
```

### Run the actual import:
```bash
cd backend
python import_products_standalone.py
```

---

## Production Deployment

### Step 1: Upload files to production server
```bash
# Upload the JSONL file and scripts
scp backend/products/bg_products_final.jsonl user@server:/path/to/backend/products/
scp backend/import_products_standalone.py user@server:/path/to/backend/
```

### Step 2: SSH into production server
```bash
ssh user@server
cd /path/to/backend
```

### Step 3: Activate virtual environment (if using one)
```bash
source venv/bin/activate
```

### Step 4: Test import with dry-run
```bash
python import_products_standalone.py --dry-run
```

### Step 5: Run actual import
```bash
python import_products_standalone.py
```

---

## Expected Output

```
======================================================================
🚀 BG Products Import Script
======================================================================

📂 Reading from: products/bg_products_final.jsonl
🔍 Dry run: False
📦 Batch size: 500

✅ Processed 500 products...
✅ Processed 1000 products...
✅ Processed 1500 products...
...
✅ Processed final batch of 481 products

======================================================================
📊 IMPORT SUMMARY
======================================================================
Total lines read:         13981
✅ Successfully processed: 13981
⊘ Skipped (duplicates):    0
❌ Errors:                 0
======================================================================

✅ Successfully imported 13981 products to the database!
```

---

## Troubleshooting

### Error: "File not found"
- Make sure you're in the `backend` directory
- Check that `products/bg_products_final.jsonl` exists

### Error: "django.core.exceptions.ImproperlyConfigured"
- Ensure Django settings are properly configured
- Check that `.env.dev` or `.env.prod` file exists with correct database credentials

### Error: "duplicate key value violates unique constraint"
- Products with duplicate barcodes will be automatically skipped
- The script uses `ignore_conflicts=True` to handle this gracefully

### Import is slow
- Increase batch size: `--batch-size=1000`
- Check database connection
- Ensure database has proper indexes on `barcode` field

### Need to re-import?
If you need to delete all imported products and start fresh:

```bash
python manage.py shell
```

```python
from products.models import Product
# ⚠️ WARNING: This deletes ALL products
Product.objects.filter(status='approved', created_by=None).delete()
```

---

## Verification

After import, verify the data:

```bash
python manage.py shell
```

```python
from products.models import Product

# Count total products
print(f"Total products: {Product.objects.count()}")

# Count approved products
print(f"Approved products: {Product.objects.filter(status='approved').count()}")

# Sample products
print("\nSample products:")
for p in Product.objects.all()[:5]:
    print(f"  - {p.barcode}: {p.name} ({p.brand})")
```

---

## Database Backup (Important!)

Before running in production, always backup your database:

```bash
# PostgreSQL backup
pg_dump -h localhost -U your_user -d your_database > backup_before_import.sql

# Django backup (if using dumpdata)
python manage.py dumpdata products.Product > products_backup.json
```

---

## Performance Notes

- **Batch processing**: Uses `bulk_create()` for optimal performance
- **Memory efficient**: Processes file line-by-line
- **Conflict handling**: Duplicate barcodes are automatically skipped
- **Transaction safety**: Each batch is a separate transaction

Estimated import time: ~1-2 minutes for 14,000 products (depending on server)
