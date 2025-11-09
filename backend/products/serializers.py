from rest_framework import serializers
from .models import Category, Store, Product, ProductPrice, Favorite, ScanHistory, PriceVerification, PriceReport
from django.contrib.auth import get_user_model

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model with hierarchical display"""
    full_path = serializers.ReadOnlyField()
    is_parent = serializers.ReadOnlyField()
    subcategories_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'icon', 'full_path', 'is_parent', 'subcategories_count', 'created_at']
        read_only_fields = ['created_at']

    def get_subcategories_count(self, obj):
        return obj.subcategories.count()


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical category tree (includes subcategories)"""
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'subcategories']

    def get_subcategories(self, obj):
        subcategories = obj.subcategories.all()
        return CategoryTreeSerializer(subcategories, many=True).data


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for Store model"""

    class Meta:
        model = Store
        fields = ['id', 'name', 'chain', 'address', 'city', 'logo_url', 'website', 'primary_color', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class ProductPriceSerializer(serializers.ModelSerializer):
    """Serializer for ProductPrice with store details"""
    store = StoreSerializer(read_only=True)
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(),
        source='store',
        write_only=True
    )
    submitted_by_email = serializers.EmailField(source='submitted_by.email', read_only=True)
    display_price = serializers.ReadOnlyField()

    class Meta:
        model = ProductPrice
        fields = [
            'id', 'product', 'store', 'store_id', 'price_eur', 'price_entered',
            'currency_entered', 'status', 'is_outlier', 'positive_votes', 'negative_votes',
            'submitted_by', 'submitted_by_email', 'display_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['price_eur', 'submitted_by', 'positive_votes', 'negative_votes', 'created_at', 'updated_at']

    def create(self, validated_data):
        from decimal import Decimal

        # Get the user from context
        user = self.context['request'].user

        # Convert price to EUR (fixed rate: 1 EUR = 1.95583 BGN)
        price_entered = validated_data['price_entered']
        currency_entered = validated_data['currency_entered']

        BGN_TO_EUR_RATE = Decimal('1.95583')

        if currency_entered == 'BGN':
            validated_data['price_eur'] = price_entered / BGN_TO_EUR_RATE
        else:
            validated_data['price_eur'] = price_entered

        # Set the user who submitted the price
        validated_data['submitted_by'] = user

        # Award trust points and increment counter
        user.total_prices_added += 1
        user.trust_score += 3  # Award 3 points for adding a price
        user.save()

        return super().create(validated_data)


class ProductSerializer(serializers.ModelSerializer):
    """Detailed serializer for Product with all relationships"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    latest_prices = serializers.SerializerMethodField()
    best_price = serializers.SerializerMethodField()
    is_approved = serializers.ReadOnlyField()
    is_pending = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'brand', 'description', 'category', 'category_id',
            'image_url', 'status', 'created_by', 'created_by_email', 'latest_prices',
            'best_price', 'is_approved', 'is_pending', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'status', 'created_at', 'updated_at']

    def get_latest_prices(self, obj):
        """Get latest 5 prices for this product (exclude outliers)"""
        prices = obj.prices.filter(status='approved', is_outlier=False).order_by('-created_at')[:5]
        return ProductPriceSerializer(prices, many=True).data

    def get_best_price(self, obj):
        """Get the best (lowest) current price (exclude outliers)"""
        # Get prices from last 30 days
        from django.utils import timezone
        from datetime import timedelta

        thirty_days_ago = timezone.now() - timedelta(days=30)
        best_price = obj.prices.filter(
            status='approved',
            is_outlier=False,
            created_at__gte=thirty_days_ago
        ).order_by('price_eur').first()

        if best_price:
            return ProductPriceSerializer(best_price).data
        return None

    def create(self, validated_data):
        # Auto-approve for admin or trusted users
        user = self.context['request'].user
        if user.is_admin or user.trust_score >= 100:
            validated_data['status'] = 'approved'
        else:
            validated_data['status'] = 'pending'

        validated_data['created_by'] = user
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists (search results, etc.)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    best_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'brand', 'category_name',
            'image_url', 'status', 'best_price', 'created_at'
        ]

    def get_best_price(self, obj):
        """Get the best (lowest) current price - simplified version (exclude outliers)"""
        from django.utils import timezone
        from datetime import timedelta

        thirty_days_ago = timezone.now() - timedelta(days=30)
        best_price = obj.prices.filter(
            status='approved',
            is_outlier=False,
            created_at__gte=thirty_days_ago
        ).order_by('price_eur').first()

        if best_price:
            return {
                'price_entered': str(best_price.price_entered),
                'currency_entered': best_price.currency_entered,
                'store': best_price.store.name
            }
        return None


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new products"""

    class Meta:
        model = Product
        fields = ['id', 'barcode', 'name', 'brand', 'description', 'category_id', 'image_url', 'status', 'is_pending']
        read_only_fields = ['id', 'status', 'is_pending']

    def validate_barcode(self, value):
        """Ensure barcode is unique"""
        if Product.objects.filter(barcode=value).exists():
            raise serializers.ValidationError('A product with this barcode already exists.')
        return value

    def create(self, validated_data):
        # Auto-approve for admin or trusted users
        user = self.context['request'].user
        if user.is_admin or user.trust_score >= 100:
            validated_data['status'] = 'approved'
        else:
            validated_data['status'] = 'pending'

        validated_data['created_by'] = user

        # Increment user's product count and award trust points
        user.total_products_added += 1
        user.trust_score += 5  # Award 5 points for adding a product
        user.save()

        return super().create(validated_data)


class ScanHistorySerializer(serializers.ModelSerializer):
    """Serializer for ScanHistory model"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ScanHistory
        fields = ['id', 'product', 'product_id', 'barcode', 'scan_type', 'scanned_at']
        read_only_fields = ['id', 'scanned_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PriceVerificationSerializer(serializers.ModelSerializer):
    """Serializer for PriceVerification model with positive/negative votes"""
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = PriceVerification
        fields = ['id', 'price', 'vote_type', 'user_email', 'verified_at']
        read_only_fields = ['id', 'user_email', 'verified_at']

    def validate_price(self, value):
        """Ensure user doesn't verify their own price"""
        user = self.context['request'].user
        if value.submitted_by == user:
            raise serializers.ValidationError("You cannot verify your own price.")

        # Check if already voted by this user
        if PriceVerification.objects.filter(price=value, user=user).exists():
            raise serializers.ValidationError("You have already voted on this price.")

        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        vote_type = validated_data.get('vote_type', 'positive')

        # Create verification
        verification = super().create(validated_data)

        # Increment vote count on price based on vote type
        price = validated_data['price']
        if vote_type == 'positive':
            price.positive_votes += 1
        else:
            price.negative_votes += 1
        price.save()

        # Award points: +1 to voter (regardless of vote type)
        user.trust_score += 1
        user.save()

        return verification


class PriceReportSerializer(serializers.ModelSerializer):
    """Serializer for PriceReport model"""
    reported_by_email = serializers.EmailField(source='reported_by.email', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    
    class Meta:
        model = PriceReport
        fields = ['id', 'price', 'reason', 'reason_display', 'comment', 'reported_by_email', 'reported_at']
        read_only_fields = ['id', 'reported_by_email', 'reason_display', 'reported_at']

    def validate_price(self, value):
        """Ensure user doesn't report their own price"""
        user = self.context['request'].user
        if value.submitted_by == user:
            raise serializers.ValidationError("You cannot report your own price.")
        
        # Check if already reported by this user
        if PriceReport.objects.filter(price=value, reported_by=user).exists():
            raise serializers.ValidationError("You have already reported this price.")
        
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['reported_by'] = user
        
        # Create report
        report = super().create(validated_data)
        
        # Check if price should be flagged (3+ reports)
        price = validated_data['price']
        report_count = PriceReport.objects.filter(price=price).count()
        
        if report_count >= 3 and price.status == 'approved':
            price.status = 'pending'  # Flag for admin review
            price.save()
        
        return report
