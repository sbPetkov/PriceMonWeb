"""
Public views for SEO-optimized product pages.
These views render server-side HTML for crawlers and non-authenticated users.
"""
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404
from django.views.decorators.http import require_GET
from django.views.decorators.cache import cache_page
from django.db.models import Min, Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Product, ProductPrice, Category, Store


@require_GET
@cache_page(60 * 15)  # Cache for 15 minutes
def product_detail(request, barcode):
    """
    Public product detail page with SEO optimization.
    Shows product info, price comparison, and structured data for search engines.

    Args:
        barcode: Product barcode (EAN-13, UPC, etc.)

    Returns:
        Rendered HTML template with product data
    """
    # Get approved product or 404
    product = get_object_or_404(
        Product.objects.select_related('category', 'created_by'),
        barcode=barcode,
        status='approved'  # Only show approved products publicly
    )

    # Get all approved prices for this product, ordered by price (lowest first)
    all_prices = ProductPrice.objects.filter(
        product=product,
        status='approved'
    ).select_related('store').order_by('price_eur', '-created_at')[:20]

    # Get best (lowest) price
    best_price = all_prices.first() if all_prices else None

    # Get price history for the last 30 days for chart
    thirty_days_ago = timezone.now() - timedelta(days=30)
    price_history = ProductPrice.objects.filter(
        product=product,
        status='approved',
        created_at__gte=thirty_days_ago
    ).select_related('store').order_by('created_at')

    # Calculate height percentages for simple bar chart
    if price_history:
        prices_list = list(price_history)
        max_price = max(float(p.price_eur) for p in prices_list)
        min_price = min(float(p.price_eur) for p in prices_list)
        price_range = max_price - min_price if max_price > min_price else 1

        for price in prices_list:
            # Calculate height as percentage (20% minimum for visibility)
            if price_range > 0:
                normalized = (float(price.price_eur) - min_price) / price_range
                price.height_percent = 20 + (normalized * 80)  # Scale from 20% to 100%
            else:
                price.height_percent = 50
    else:
        prices_list = []

    # Get related products from same category
    related_products = []
    if product.category:
        related_products = Product.objects.filter(
            category=product.category,
            status='approved'
        ).exclude(id=product.id)[:4]

    # Calculate aggregate rating from verifications
    total_verifications = product.prices.aggregate(
        total_positive=Count('positive_votes'),
        total_negative=Count('negative_votes')
    )

    total_votes = (total_verifications.get('total_positive', 0) +
                   total_verifications.get('total_negative', 0))

    if total_votes > 0:
        positive_ratio = total_verifications.get('total_positive', 0) / total_votes
        avg_rating = 1 + (positive_ratio * 4)  # Scale to 1-5 stars
    else:
        avg_rating = 4.5  # Default rating

    # Price valid until (used in structured data)
    price_valid_until = timezone.now() + timedelta(days=7)

    context = {
        'product': product,
        'best_price': best_price,
        'all_prices': all_prices,
        'price_history': prices_list,
        'related_products': related_products,
        'avg_rating': round(avg_rating, 1),
        'total_verifications': total_votes,
        'price_valid_until': price_valid_until,
    }

    return render(request, 'public/product_detail.html', context)


@require_GET
@cache_page(60 * 60)  # Cache for 1 hour
def category_list(request, slug):
    """
    Public category listing page showing all products in a category.

    Args:
        slug: Category slug

    Returns:
        Rendered HTML template with category products
    """
    category = get_object_or_404(Category, slug=slug)

    # Get all approved products in this category
    products = Product.objects.filter(
        category=category,
        status='approved'
    ).prefetch_related('prices').order_by('-created_at')[:50]

    # Annotate each product with its best price
    for product in products:
        best_price = product.prices.filter(status='approved').order_by('price_eur').first()
        product.best_price = best_price

    context = {
        'category': category,
        'products': products,
    }

    return render(request, 'public/category_list.html', context)


@require_GET
@cache_page(60 * 60 * 24)  # Cache for 24 hours
def sitemap_xml(request):
    """
    Generate sitemap.xml for all approved products and public pages.

    Returns:
        XML sitemap for search engine crawlers
    """
    # Get all approved products
    products = Product.objects.filter(status='approved').order_by('-updated_at')

    # Get all categories
    categories = Category.objects.all()

    # Build sitemap XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    # Add homepage
    xml_lines.extend([
        '  <url>',
        '    <loc>https://price-mon.com/</loc>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
    ])

    # Add product pages
    for product in products:
        lastmod = product.updated_at.strftime('%Y-%m-%d')
        xml_lines.extend([
            '  <url>',
            f'    <loc>https://price-mon.com/products/{product.barcode}</loc>',
            f'    <lastmod>{lastmod}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.8</priority>',
            '  </url>',
        ])

    # Add category pages
    for category in categories:
        xml_lines.extend([
            '  <url>',
            f'    <loc>https://price-mon.com/category/{category.slug}</loc>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.6</priority>',
            '  </url>',
        ])

    xml_lines.append('</urlset>')

    xml_content = '\n'.join(xml_lines)

    return HttpResponse(xml_content, content_type='application/xml')


@require_GET
def robots_txt(request):
    """
    Generate robots.txt file to guide search engine crawlers.

    Returns:
        robots.txt content
    """
    lines = [
        'User-agent: *',
        'Allow: /',
        'Allow: /products/',
        'Allow: /category/',
        'Disallow: /api/',
        'Disallow: /admin/',
        'Disallow: /profile/',
        'Disallow: /shopping-lists/',
        '',
        'Sitemap: https://price-mon.com/sitemap.xml',
    ]

    return HttpResponse('\n'.join(lines), content_type='text/plain')
