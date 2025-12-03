# Quick Reference - Product Import

## 🚀 Quick Start (Production)

```bash
# 1. Upload files
scp products/bg_products_final.jsonl user@server:/path/to/backend/products/
scp import_products_standalone.py user@server:/path/to/backend/

# 2. On server
ssh user@server
cd /path/to/backend
source venv/bin/activate

# 3. Backup (IMPORTANT!)
pg_dump -h localhost -U user -d dbname > backup.sql

# 4. Test
python import_products_standalone.py --dry-run

# 5. Import
python import_products_standalone.py
```

## 📋 Commands

### Local Development
```bash
cd backend
source venv/bin/activate

# Test import
python import_products_standalone.py --dry-run

# Run import
python import_products_standalone.py

# Or use Django command
python manage.py import_bg_products --dry-run
python manage.py import_bg_products
```

### Verify Import
```bash
python manage.py shell
```
```python
from products.models import Product
print(f"Total: {Product.objects.count()}")
print(f"Approved: {Product.objects.filter(status='approved').count()}")
```

### Rollback (if needed)
```bash
# PostgreSQL
psql -U user -d dbname < backup.sql

# Or delete system imports
python manage.py shell
from products.models import Product
Product.objects.filter(created_by=None).delete()
```

## 📊 Expected Results

- **Total imported**: ~12,295 products
- **Skipped**: ~1,686 (missing product_name)
- **Time**: 1-2 minutes
- **Status**: All approved
- **Category**: All empty

## ✅ Success Indicators

- ✅ No errors in output
- ✅ "Successfully imported 12295 products"
- ✅ Products visible in database
- ✅ Products searchable in app

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| File not found | Check you're in `backend/` directory |
| ModuleNotFoundError | Activate virtual environment: `source venv/bin/activate` |
| Database error | Check `.env.prod` file and database credentials |
| Duplicate key error | Normal - duplicates are automatically skipped |

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `bg_products_final.jsonl` | Product data (13,981 records) |
| `import_products_standalone.py` | Import script (recommended) |
| `import_bg_products.py` | Django management command |
| `IMPORT_README.md` | Full documentation |
| `PRODUCTION_DEPLOY.md` | Production deployment guide |

## 🔧 Advanced Options

```bash
# Custom batch size
python import_products_standalone.py --batch-size=1000

# Django command with verbose output
python manage.py import_bg_products -v 2

# Custom file location
python manage.py import_bg_products --file=path/to/file.jsonl
```

---

**Need help?** See `IMPORT_README.md` for detailed documentation.
