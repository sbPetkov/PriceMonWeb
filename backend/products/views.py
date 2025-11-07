from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q, Count, Avg, Min, Max
from django.utils import timezone
from datetime import timedelta

from .models import Category, Store, Product, ProductPrice, Favorite, ScanHistory, PriceVerification, PriceReport
from .serializers import (
    CategorySerializer, CategoryTreeSerializer, StoreSerializer,
    ProductSerializer, ProductListSerializer, ProductCreateSerializer,
    ProductPriceSerializer, ScanHistorySerializer, PriceVerificationSerializer, PriceReportSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing categories.
    Read-only - categories are managed via admin panel.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical category tree (parent categories with subcategories)"""
        parents = Category.objects.filter(parent=None)
        serializer = CategoryTreeSerializer(parents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products in this category (including subcategories)"""
        category = self.get_object()

        # Get this category and all its subcategories
        category_ids = [category.id]
        category_ids.extend(category.subcategories.values_list('id', flat=True))

        # Filter products
        products = Product.objects.filter(
            category_id__in=category_ids,
            status='approved'
        )

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class StoreViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing stores.
    Users can view and create stores.
    Search matches anywhere in name, chain, or address (case-insensitive).
    """
    queryset = Store.objects.filter(is_active=True)
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Store.objects.filter(is_active=True)
        search = self.request.query_params.get('search', None)

        if search:
            # Filter in Python for reliable case-insensitive Cyrillic support
            search_lower = search.lower()
            all_stores = list(queryset)

            # Filter stores where search matches anywhere in name, chain, or address
            filtered_stores = [
                store for store in all_stores
                if search_lower in store.name.lower() or
                   search_lower in store.chain.lower() or
                   search_lower in (store.address or '').lower()
            ]

            # Get IDs of matching stores
            if filtered_stores:
                store_ids = [store.id for store in filtered_stores]
                queryset = queryset.filter(id__in=store_ids)
            else:
                # Return empty queryset if no matches
                queryset = queryset.none()

        return queryset

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products available at this store"""
        store = self.get_object()

        # Get unique products that have prices at this store (exclude outliers)
        product_ids = ProductPrice.objects.filter(
            store=store,
            status='approved',
            is_outlier=False
        ).values_list('product_id', flat=True).distinct()

        products = Product.objects.filter(id__in=product_ids, status='approved')
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing products.
    - List/Retrieve: public (approved products only)
    - Create/Update/Delete: authenticated users only
    """
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'barcode', 'description']
    ordering_fields = ['name', 'brand', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        elif self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all()

        # Non-authenticated users see only approved products
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status='approved')
        # Authenticated users see approved + their own pending products
        elif not self.request.user.is_admin:
            queryset = queryset.filter(
                Q(status='approved') | Q(created_by=self.request.user)
            )
        # Admins see everything

        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by creator (for "My Products" view)
        created_by_id = self.request.query_params.get('created_by', None)
        if created_by_id:
            queryset = queryset.filter(created_by_id=created_by_id)

        return queryset

    @action(detail=False, methods=['get'])
    def lookup_barcode(self, request):
        """Look up a product by barcode"""
        barcode = request.query_params.get('barcode', None)

        if not barcode:
            return Response(
                {'error': 'Barcode parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(barcode=barcode)

            # Check if user can see this product
            if product.status == 'approved':
                serializer = ProductSerializer(product)
                return Response({
                    'found': True,
                    'status': 'approved',
                    'product': serializer.data
                })
            elif product.status == 'pending':
                # Only creator and admins can see pending products
                if request.user.is_authenticated and (
                    product.created_by == request.user or request.user.is_admin
                ):
                    serializer = ProductSerializer(product)
                    return Response({
                        'found': True,
                        'status': 'pending',
                        'product': serializer.data
                    })
                else:
                    return Response({
                        'found': True,
                        'status': 'pending',
                        'message': 'This product is pending approval'
                    })
            else:  # rejected
                return Response({
                    'found': True,
                    'status': 'rejected',
                    'message': 'This product was rejected'
                })

        except Product.DoesNotExist:
            return Response({
                'found': False,
                'message': 'No product found with this barcode'
            })

    @action(detail=True, methods=['get'])
    def prices(self, request, pk=None):
        """Get all prices for this product"""
        product = self.get_object()

        prices = ProductPrice.objects.filter(
            product=product,
            status='approved'
        ).order_by('-created_at')

        # Filter by store
        store_id = request.query_params.get('store', None)
        if store_id:
            prices = prices.filter(store_id=store_id)

        # Pagination
        page_size = int(request.query_params.get('page_size', 20))
        offset = int(request.query_params.get('offset', 0))
        prices = prices[offset:offset + page_size]

        serializer = ProductPriceSerializer(prices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def price_history(self, request, pk=None):
        """Get price history with daily median prices and statistics

        Query params:
        - period: 'week' (7 days), 'month' (30 days), 'all' (default: all)
        """
        from django.db.models.functions import TruncDate
        from statistics import median

        product = self.get_object()
        period = request.query_params.get('period', 'all')

        # Determine date range based on period
        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        else:  # 'all'
            start_date = None

        # Get all prices for the period (exclude outliers from chart)
        prices_query = ProductPrice.objects.filter(
            product=product,
            status='approved',
            is_outlier=False
        )

        if start_date:
            prices_query = prices_query.filter(created_at__gte=start_date)

        prices = prices_query.order_by('created_at')

        # Calculate daily median prices
        daily_medians = []
        if prices.exists():
            # Group prices by date
            prices_by_date = {}
            for price in prices:
                date_key = price.created_at.date()
                if date_key not in prices_by_date:
                    prices_by_date[date_key] = []
                prices_by_date[date_key].append(float(price.price_eur))

            # Calculate median for each day
            for date, price_list in sorted(prices_by_date.items()):
                daily_medians.append({
                    'date': date.isoformat(),
                    'median_price_eur': median(price_list),
                    'count': len(price_list)
                })

        # Calculate overall statistics
        stats = prices.aggregate(
            avg_price=Avg('price_eur'),
            min_price=Min('price_eur'),
            max_price=Max('price_eur'),
            count=Count('id')
        )

        # Serialize all individual prices for the dots
        serializer = ProductPriceSerializer(prices, many=True)

        return Response({
            'daily_medians': daily_medians,
            'all_prices': serializer.data,
            'statistics': {
                'average_price': float(stats['avg_price']) if stats['avg_price'] else None,
                'lowest_price': float(stats['min_price']) if stats['min_price'] else None,
                'highest_price': float(stats['max_price']) if stats['max_price'] else None,
                'total_submissions': stats['count'],
                'period': period
            }
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a product (admin only)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can approve products'},
                status=status.HTTP_403_FORBIDDEN
            )

        product = self.get_object()
        product.approve()

        return Response({
            'message': 'Product approved successfully',
            'product': ProductSerializer(product).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a product (admin only)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can reject products'},
                status=status.HTTP_403_FORBIDDEN
            )

        product = self.get_object()
        product.reject()

        return Response({
            'message': 'Product rejected',
            'product': ProductSerializer(product).data
        })

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status for a product"""
        product = self.get_object()
        user = request.user

        # Check if already favorited
        favorite = Favorite.objects.filter(user=user, product=product).first()

        if favorite:
            # Remove from favorites
            favorite.delete()
            return Response({
                'message': 'Removed from favorites',
                'is_favorite': False
            })
        else:
            # Add to favorites
            Favorite.objects.create(user=user, product=product)
            return Response({
                'message': 'Added to favorites',
                'is_favorite': True
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def admin_pending(self, request):
        """Get all pending products for admin review"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        pending_products = Product.objects.filter(
            status='pending'
        ).select_related('created_by', 'category').order_by('-created_at')

        # Serialize with creator details
        data = []
        for product in pending_products:
            product_data = ProductSerializer(product).data
            product_data['creator_trust_score'] = product.created_by.trust_score
            product_data['creator_trust_level'] = product.created_by.trust_level
            data.append(product_data)

        return Response({'results': data, 'count': len(data)})

    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get user's favorite products"""
        favorites = Favorite.objects.filter(user=request.user).select_related('product')
        products = [fav.product for fav in favorites]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductPriceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product prices.
    """
    queryset = ProductPrice.objects.all()
    serializer_class = ProductPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProductPrice.objects.all()

        # Non-admin users see only approved prices
        if not self.request.user.is_admin:
            queryset = queryset.filter(status='approved')

        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Filter by store
        store_id = self.request.query_params.get('store', None)
        if store_id:
            queryset = queryset.filter(store_id=store_id)

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Create a new price submission with outlier detection"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set the submitter
        serializer.validated_data['submitted_by'] = request.user

        # Check rate limiting (30 seconds between submissions)
        thirty_seconds_ago = timezone.now() - timedelta(seconds=30)
        recent_submission = ProductPrice.objects.filter(
            submitted_by=request.user,
            created_at__gte=thirty_seconds_ago
        ).exists()

        if recent_submission:
            return Response(
                {'error': 'Please wait 30 seconds between price submissions'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Save price
        price = serializer.save()

        # Outlier detection: Check if price is too far from average
        product_id = price.product_id
        existing_prices = ProductPrice.objects.filter(
            product_id=product_id,
            status='approved',
            is_outlier=False
        ).exclude(id=price.id)

        # Need at least 2 existing prices to establish a reliable average
        if existing_prices.count() >= 2:
            # Calculate average price in EUR
            avg_price = existing_prices.aggregate(Avg('price_eur'))['price_eur__avg']

            if avg_price and avg_price > 0:
                # Convert to float for comparison
                avg_price_float = float(avg_price)
                new_price_eur = float(price.price_eur)

                # Check if price is 150% higher or 150% lower than average
                upper_threshold = avg_price_float * 2.5  # 150% higher means 2.5x the average
                lower_threshold = avg_price_float * 0.4  # 150% lower means 0.4x the average

                if new_price_eur > upper_threshold or new_price_eur < lower_threshold:
                    # Flag as outlier
                    price.is_outlier = True
                    price.save()

        # Increment user's price count
        request.user.total_prices_added += 1
        request.user.save()

        # Return response with outlier flag information
        response_data = ProductPriceSerializer(price).data
        response_data['is_flagged'] = price.is_outlier

        return Response(
            response_data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a price (community verification)"""
        price = self.get_object()

        # Can't verify your own price
        if price.submitted_by == request.user:
            return Response(
                {'error': 'You cannot verify your own price submission'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has already verified this price
        # (This would require a separate PriceVerification model in production)

        price.verified_count += 1
        price.save()

        return Response({
            'message': 'Price verified successfully',
            'verified_count': price.verified_count
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a price (admin only) - resets negative votes and outlier flag"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can approve prices'},
                status=status.HTTP_403_FORBIDDEN
            )

        price = self.get_object()
        price.approve()

        # Reset negative votes and outlier flag when admin approves
        price.negative_votes = 0
        price.is_outlier = False
        price.save()

        return Response({
            'message': 'Price approved successfully. Negative votes and outlier flag cleared.',
            'price': ProductPriceSerializer(price).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a price (admin only) - penalizes submitter -20 points"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can reject prices'},
                status=status.HTTP_403_FORBIDDEN
            )

        price = self.get_object()

        # Penalize submitter -20 points
        if price.submitted_by:
            price.submitted_by.trust_score -= 20
            # Prevent trust score from going below 0
            if price.submitted_by.trust_score < 0:
                price.submitted_by.trust_score = 0
            price.submitted_by.save()

        price.reject()

        return Response({
            'message': 'Price rejected. Submitter penalized -20 trust points.',
            'price': ProductPriceSerializer(price).data
        })

    @action(detail=False, methods=['get'])
    def admin_flagged(self, request):
        """Get all prices with 3+ negative votes or marked as outliers for admin review"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get prices flagged by community (3+ negative votes) OR marked as outliers
        flagged_prices = ProductPrice.objects.filter(
            Q(negative_votes__gte=3) | Q(is_outlier=True),
            status='approved'  # Only show approved prices that got flagged
        ).select_related('product', 'store', 'submitted_by').order_by('-is_outlier', '-negative_votes', '-created_at')

        # Serialize with submitter details
        data = []
        for price in flagged_prices:
            price_data = ProductPriceSerializer(price).data
            if price.submitted_by:
                price_data['submitter_trust_score'] = price.submitted_by.trust_score
                price_data['submitter_trust_level'] = price.submitted_by.trust_level
            else:
                price_data['submitter_trust_score'] = None
                price_data['submitter_trust_level'] = None
            price_data['product_name'] = price.product.name
            price_data['product_brand'] = price.product.brand
            data.append(price_data)

        return Response({'results': data, 'count': len(data)})


class ScanHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user's scan history.
    Users can view their own scan history and record new scans.
    """
    serializer_class = ScanHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return scan history for current user only"""
        return ScanHistory.objects.filter(user=self.request.user).select_related('product', 'user')
    
    def perform_create(self, serializer):
        """Record scan with current user"""
        serializer.save(user=self.request.user)


class PriceVerificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for price verifications.
    Users can verify other users' prices to earn points.
    """
    serializer_class = PriceVerificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']  # Only GET and POST allowed
    
    def get_queryset(self):
        """Return verifications for current user"""
        return PriceVerification.objects.filter(user=self.request.user).select_related('price', 'price__product', 'price__store')
    
    @action(detail=False, methods=['post'], url_path='verify/(?P<price_id>[^/.]+)')
    def verify_price(self, request, price_id=None):
        """Vote on a price by ID (positive or negative)"""
        try:
            price = ProductPrice.objects.get(pk=price_id)
        except ProductPrice.DoesNotExist:
            return Response(
                {'error': 'Price not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get vote_type from request body (default to 'positive')
        vote_type = request.data.get('vote_type', 'positive')
        if vote_type not in ['positive', 'negative']:
            return Response(
                {'error': 'vote_type must be either "positive" or "negative"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data={'price': price.id, 'vote_type': vote_type})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Get updated vote counts
        price.refresh_from_db()
        vote_label = "accurate" if vote_type == 'positive' else "not accurate"

        return Response({
            'message': f'Price voted as {vote_label}! +1 point earned.',
            'verification': serializer.data,
            'positive_votes': price.positive_votes,
            'negative_votes': price.negative_votes
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='check-votes')
    def check_votes(self, request):
        """Check if user has voted on specific prices (batch check)"""
        price_ids = request.data.get('price_ids', [])
        if not price_ids:
            return Response({'votes': {}})

        # Get all votes for this user on these prices
        votes = PriceVerification.objects.filter(
            user=request.user,
            price_id__in=price_ids
        ).values('price_id', 'vote_type')

        # Create a dictionary: {price_id: vote_type}
        votes_dict = {vote['price_id']: vote['vote_type'] for vote in votes}

        return Response({'votes': votes_dict})


class PriceReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for price reports.
    Users can report suspicious or incorrect prices.
    """
    serializer_class = PriceReportSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']  # Only GET and POST allowed
    
    def get_queryset(self):
        """Return reports by current user"""
        return PriceReport.objects.filter(reported_by=self.request.user).select_related('price', 'price__product', 'price__store')
    
    @action(detail=False, methods=['post'], url_path='report/(?P<price_id>[^/.]+)')
    def report_price(self, request, price_id=None):
        """Report a price by ID"""
        try:
            price = ProductPrice.objects.get(pk=price_id)
        except ProductPrice.DoesNotExist:
            return Response(
                {'error': 'Price not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = {
            'price': price.id,
            'reason': request.data.get('reason'),
            'comment': request.data.get('comment', '')
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Price reported successfully. Thank you for helping maintain data quality!',
            'report': serializer.data
        }, status=status.HTTP_201_CREATED)
