# Production Deployment Guide

## Successfully Imported! ✅

**Local Import Summary:**
- Total products imported: **12,295**
- Skipped (missing product_name): 1,686
- All products set to `status='approved'`
- All products have `category=None` (can be assigned later)
- All products have `created_by=None` (system import)

---

## Deploy to Production Server

### Step 1: Prepare Files

Files needed on production server:
1. `products/bg_products_final.jsonl` (the data file)
2. `import_products_standalone.py` (the import script)
3. `IMPORT_README.md` (documentation - optional)

### Step 2: Upload to Server

```bash
# From your local machine, upload files to server
scp backend/products/bg_products_final.jsonl user@server:/path/to/backend/products/
scp backend/import_products_standalone.py user@server:/path/to/backend/
scp backend/IMPORT_README.md user@server:/path/to/backend/
```

### Step 3: SSH into Production Server

```bash
ssh user@server
cd /path/to/backend
```

### Step 4: Backup Database (IMPORTANT!)

```bash
# PostgreSQL backup
pg_dump -h localhost -U your_db_user -d your_db_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Django management command
source venv/bin/activate
python manage.py dumpdata products.Product > products_backup_$(date +%Y%m%d_%H%M%S).json
```

### Step 5: Test with Dry Run

```bash
# Activate virtual environment
source venv/bin/activate

# Test the import (no database changes)
python import_products_standalone.py --dry-run
```

Expected output:
```
✅ Successfully processed: 12295
⊘ Skipped (duplicates): 1686
❌ Errors: 0

⚠️ DRY RUN - No changes were committed to the database
```

### Step 6: Run Actual Import

```bash
# Run the import
python import_products_standalone.py
```

Expected duration: ~1-2 minutes

### Step 7: Verify Import

```bash
python manage.py shell
```

```python
from products.models import Product

# Verify counts
print(f"Total products: {Product.objects.count()}")
print(f"Approved products: {Product.objects.filter(status='approved').count()}")
print(f"System imports: {Product.objects.filter(created_by=None).count()}")

# Sample check
for p in Product.objects.all()[:3]:
    print(f"{p.barcode}: {p.name}")
```

---

## Alternative: Using Django Management Command

If you prefer using Django management commands:

```bash
# Test
python manage.py import_bg_products --dry-run

# Run
python manage.py import_bg_products

# With custom options
python manage.py import_bg_products --batch-size=1000 -v 2
```

---

## Rollback (if needed)

If something goes wrong, restore from backup:

### PostgreSQL Rollback:
```bash
psql -h localhost -U your_db_user -d your_db_name < backup_YYYYMMDD_HHMMSS.sql
```

### Django Rollback:
```bash
# Delete imported products
python manage.py shell
```
```python
from products.models import Product
Product.objects.filter(created_by=None, status='approved').delete()
```

---

## Important Notes

1. **Duplicates**: The script automatically skips products with duplicate barcodes
2. **Missing Names**: Products without `product_name` are skipped (1,686 in your file)
3. **Safe to Re-run**: You can run the script multiple times - duplicates will be skipped
4. **Performance**: Uses batch inserts (500 products per batch) for optimal speed
5. **Memory**: Processes file line-by-line, so memory-efficient even for large files

---

## Troubleshooting

### "File not found" error
```bash
# Make sure you're in the backend directory
cd /path/to/backend
pwd  # Should show: /path/to/backend

# Check file exists
ls -la products/bg_products_final.jsonl
```

### Database connection errors
```bash
# Check environment variables
cat .env.prod  # or .env.dev

# Test database connection
python manage.py dbshell
```

### Import is slow
- Check database server load
- Increase batch size: edit script or use `--batch-size=1000`
- Ensure database indexes exist on `products.barcode` column

---

## Post-Import Tasks

### 1. Verify Data Quality
```python
from products.models import Product

# Check products without brands
no_brand = Product.objects.filter(brand='').count()
print(f"Products without brand: {no_brand}")

# Check products without images
no_image = Product.objects.filter(image_url__isnull=True).count()
print(f"Products without images: {no_image}")

# Check products without categories
no_category = Product.objects.filter(category__isnull=True).count()
print(f"Products without categories: {no_category}")
```

### 2. Assign Categories (Optional)
You can manually assign categories later through the admin panel or create a separate script.

### 3. Update Search Indexes
If you're using search functionality, rebuild indexes:
```bash
python manage.py rebuild_index  # If using django-haystack
# or your specific search indexing command
```

---

## Success Checklist

- [ ] Database backed up
- [ ] Dry-run completed successfully
- [ ] Import completed without errors
- [ ] Verification shows correct product count
- [ ] Sample products look correct
- [ ] Products are searchable in your app
- [ ] Products appear with status='approved'

---

## Support

If you encounter issues:
1. Check the `IMPORT_README.md` for detailed documentation
2. Review error messages in the import output
3. Check Django logs for database errors
4. Verify environment variables and database credentials

---

## File Locations

After deployment, your files should be:
```
backend/
├── products/
│   ├── bg_products_final.jsonl    # Data file
│   ├── models.py                   # Product models
│   └── management/
│       └── commands/
│           └── import_bg_products.py  # Django command
├── import_products_standalone.py   # Standalone script
├── IMPORT_README.md               # Full documentation
└── PRODUCTION_DEPLOY.md           # This file
```

---

**🎉 Import successful on local! Ready for production deployment.**
